using System.Text.Json;
using Lovera.Repository;

namespace Lovera.Service;

public sealed record CreateAiConversationRequest(string? Title);

public sealed record SendAiMessageRequest(
    string Content,
    double? Latitude,
    double? Longitude,
    double? AccuracyMeters,
    DateTimeOffset? LocationCapturedAt);

public sealed record AiConversationResponse(
    Guid Id,
    Guid CoupleId,
    Guid CreatedByUserId,
    string? Title,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    DateTime? ArchivedAtUtc);

public sealed record AiMessageSourceResponse(
    string Url,
    string Title,
    int? StartIndex,
    int? EndIndex,
    DateTime CheckedAtUtc);

public sealed record AiConversationContext(
    string? Area,
    decimal? BudgetVnd,
    string? DesiredDateTime,
    string[] FoodPreferences,
    string[] ActivityPreferences,
    double? MaxTravelDistanceKm,
    string[] OtherConstraints);

public sealed record AiDateSuggestion(
    string Name,
    string Type,
    string Summary,
    string Reason,
    string? Address,
    double? Latitude,
    double? Longitude,
    double? DistanceKm,
    string? PriceText,
    decimal? PriceMinVnd,
    decimal? PriceMaxVnd,
    string? PriceUnit,
    string? OpeningHours,
    string VerificationStatus,
    string[] MissingInformation);

public sealed record AiAssistantData(
    AiConversationContext Context,
    AiDateSuggestion[] Suggestions);

public sealed record AiMessageResponse(
    Guid Id,
    Guid ConversationId,
    Guid? SenderUserId,
    string Role,
    string Content,
    AiAssistantData? Data,
    Guid? ReplyToMessageId,
    string? Provider,
    string? Model,
    DateTime CreatedAtUtc,
    IReadOnlyList<AiMessageSourceResponse> Sources);

public sealed record SendAiMessageResponse(
    AiMessageResponse UserMessage,
    AiMessageResponse AssistantMessage);

public sealed record AiAssistantHistoryMessage(
    string Role,
    Guid? SenderUserId,
    string Content);

public sealed record AiAssistantRequest(
    string ContextJson,
    IReadOnlyList<AiAssistantHistoryMessage> History,
    double? Latitude,
    double? Longitude,
    double? AccuracyMeters,
    DateTimeOffset? LocationCapturedAt);

public sealed record AiCitation(
    string Url,
    string Title,
    int? StartIndex,
    int? EndIndex);

public sealed record AiAssistantResult(
    string Reply,
    string? ConversationTitle,
    AiAssistantData Data,
    string RawJson,
    string Provider,
    string Model,
    IReadOnlyList<AiCitation> Citations);

public interface IAiDateAssistant
{
    Task<AiAssistantResult> Reply(AiAssistantRequest request, CancellationToken ct);
}

public sealed class AiChatService(
    IAiChatRepository repo,
    CoupleService couples,
    IAiDateAssistant assistant,
    IClock clock)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<AiConversationResponse> Create(
        Guid userId, CreateAiConversationRequest request, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var title = CleanTitle(request.Title);
        var now = clock.UtcNow;
        var conversation = new AiConversation
        {
            CoupleId = couple.Id,
            CreatedByUserId = userId,
            Title = title,
            ContextJson = JsonSerializer.Serialize(EmptyContext(), JsonOptions),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
        repo.Add(conversation);
        await repo.Save(ct);
        return ToConversation(conversation);
    }

    public async Task<IReadOnlyList<AiConversationResponse>> List(
        Guid userId, int take, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        take = Math.Clamp(take, 1, 100);
        return (await repo.Conversations(couple.Id, take, ct))
            .Select(ToConversation)
            .ToArray();
    }

    public async Task<IReadOnlyList<AiMessageResponse>> Messages(
        Guid userId, Guid conversationId, int take, CancellationToken ct)
    {
        var conversation = await RequireConversation(userId, conversationId, ct);
        take = Math.Clamp(take, 1, 100);
        return (await repo.Messages(conversation.Id, take, ct))
            .Select(ToMessage)
            .ToArray();
    }

    public async Task<SendAiMessageResponse> Send(
        Guid userId,
        Guid conversationId,
        SendAiMessageRequest request,
        CancellationToken ct)
    {
        var conversation = await RequireConversation(userId, conversationId, ct);
        if (conversation.ArchivedAtUtc is not null)
            throw new AppProblem(409, "conversation_archived", "Cuộc trò chuyện đã được lưu trữ.");

        var content = request.Content?.Trim() ?? "";
        if (content.Length is < 1 or > 2000)
            throw new AppProblem(400, "invalid_message", "Tin nhắn phải có từ 1 đến 2000 ký tự.");
        ValidateLocation(request);

        var now = clock.UtcNow;
        var userMessage = new AiMessage
        {
            ConversationId = conversation.Id,
            SenderUserId = userId,
            Role = "user",
            Content = content,
            CreatedAtUtc = now
        };
        conversation.UpdatedAtUtc = now;
        repo.Add(userMessage);
        await repo.Save(ct);

        var history = (await repo.Messages(conversation.Id, 20, ct))
            .Select(m => new AiAssistantHistoryMessage(m.Role, m.SenderUserId, m.Content))
            .ToArray();

        AiAssistantResult result;
        try
        {
            result = await assistant.Reply(new AiAssistantRequest(
                conversation.ContextJson,
                history,
                request.Latitude,
                request.Longitude,
                request.AccuracyMeters,
                request.LocationCapturedAt), ct);
        }
        catch (Exception e) when (!ct.IsCancellationRequested &&
            e is HttpRequestException or TimeoutException or TaskCanceledException or JsonException)
        {
            throw new AppProblem(503, "ai_unavailable", "AI đang bận hoặc trả dữ liệu không hợp lệ. Tin nhắn của bạn đã được lưu; vui lòng thử lại sau.");
        }

        if (string.IsNullOrWhiteSpace(result.Reply) || result.Reply.Length > 8000)
            throw new AppProblem(503, "ai_invalid_response", "AI trả dữ liệu không hợp lệ. Tin nhắn của bạn đã được lưu.");

        var assistantTime = clock.UtcNow <= userMessage.CreatedAtUtc
            ? userMessage.CreatedAtUtc.AddMilliseconds(1)
            : clock.UtcNow;
        var assistantMessage = new AiMessage
        {
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = result.Reply.Trim(),
            StructuredDataJson = result.RawJson,
            ReplyToMessageId = userMessage.Id,
            Provider = result.Provider,
            Model = result.Model,
            CreatedAtUtc = assistantTime
        };

        foreach (var citation in result.Citations
                     .Where(c => IsSafeHttpUrl(c.Url))
                     .DistinctBy(c => c.Url))
        {
            assistantMessage.Sources.Add(new AiMessageSource
            {
                MessageId = assistantMessage.Id,
                Url = citation.Url,
                Title = string.IsNullOrWhiteSpace(citation.Title)
                    ? new Uri(citation.Url).Host
                    : citation.Title.Trim()[..Math.Min(citation.Title.Trim().Length, 300)],
                StartIndex = citation.StartIndex,
                EndIndex = citation.EndIndex,
                CheckedAtUtc = assistantTime
            });
        }

        conversation.ContextJson = JsonSerializer.Serialize(result.Data.Context, JsonOptions);
        conversation.Title ??= CleanTitle(result.ConversationTitle);
        conversation.UpdatedAtUtc = assistantTime;
        repo.Add(assistantMessage);
        await repo.Save(ct);

        return new SendAiMessageResponse(ToMessage(userMessage), ToMessage(assistantMessage));
    }

    public async Task<AiConversationResponse> Archive(
        Guid userId, Guid conversationId, CancellationToken ct)
    {
        var conversation = await RequireConversation(userId, conversationId, ct);
        if (conversation.ArchivedAtUtc is null)
        {
            conversation.ArchivedAtUtc = clock.UtcNow;
            conversation.UpdatedAtUtc = clock.UtcNow;
            await repo.Save(ct);
        }
        return ToConversation(conversation);
    }

    private async Task<AiConversation> RequireConversation(
        Guid userId, Guid conversationId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var conversation = await repo.Conversation(conversationId, ct);
        if (conversation is null || conversation.CoupleId != couple.Id)
            throw new AppProblem(404, "conversation_not_found", "Không tìm thấy cuộc trò chuyện.");
        return conversation;
    }

    private void ValidateLocation(SendAiMessageRequest request)
    {
        var hasAnyLocation = request.Latitude is not null || request.Longitude is not null ||
                             request.AccuracyMeters is not null || request.LocationCapturedAt is not null;
        if (!hasAnyLocation) return;

        if (request.Latitude is not >= -90 or not <= 90 ||
            request.Longitude is not >= -180 or not <= 180 ||
            request.AccuracyMeters is not >= 0 or > 10_000 ||
            request.LocationCapturedAt is null)
            throw new AppProblem(400, "invalid_location", "Dữ liệu vị trí không hợp lệ.");

        var capturedUtc = request.LocationCapturedAt.Value.UtcDateTime;
        if (capturedUtc < clock.UtcNow.AddMinutes(-30) || capturedUtc > clock.UtcNow.AddMinutes(5))
            throw new AppProblem(400, "stale_location", "Vị trí đã quá cũ; hãy lấy lại vị trí hiện tại.");
    }

    private static bool IsSafeHttpUrl(string value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
        uri.Scheme is "https" or "http" &&
        string.IsNullOrEmpty(uri.UserInfo);

    private static string? CleanTitle(string? value)
    {
        var cleaned = value?.Trim();
        if (string.IsNullOrEmpty(cleaned)) return null;
        return cleaned[..Math.Min(cleaned.Length, 120)];
    }

    private static AiConversationContext EmptyContext() =>
        new(null, null, null, [], [], null, []);

    private static AiConversationResponse ToConversation(AiConversation c) =>
        new(c.Id, c.CoupleId, c.CreatedByUserId, c.Title,
            c.CreatedAtUtc, c.UpdatedAtUtc, c.ArchivedAtUtc);

    private static AiMessageResponse ToMessage(AiMessage m)
    {
        AiAssistantData? data = null;
        if (!string.IsNullOrWhiteSpace(m.StructuredDataJson))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<AssistantEnvelope>(m.StructuredDataJson, JsonOptions);
                if (parsed?.Context is not null && parsed.Suggestions is not null)
                    data = new AiAssistantData(parsed.Context, parsed.Suggestions);
            }
            catch (JsonException)
            {
                data = null;
            }
        }

        return new AiMessageResponse(
            m.Id,
            m.ConversationId,
            m.SenderUserId,
            m.Role,
            m.Content,
            data,
            m.ReplyToMessageId,
            m.Provider,
            m.Model,
            m.CreatedAtUtc,
            m.Sources.Select(s => new AiMessageSourceResponse(
                s.Url, s.Title, s.StartIndex, s.EndIndex, s.CheckedAtUtc)).ToArray());
    }

    private sealed record AssistantEnvelope(
        string Reply,
        string? ConversationTitle,
        AiConversationContext Context,
        AiDateSuggestion[] Suggestions);
}
