using System.Text;
using System.Text.Json;
using Lovera.Service;

namespace Lovera.Api;

public sealed class GeminiDateAssistant(
    HttpClient http,
    IConfiguration config) : IAiDateAssistant
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private const string SystemInstruction = """
        Bạn là agent gợi ý hẹn hò của LOVERA, phục vụ người dùng tại Việt Nam.
        Chỉ gợi ý địa điểm hoặc hoạt động; không tự đặt chỗ, mua vé, thanh toán hay khẳng định còn chỗ.
        Hãy sử dụng thông tin đã có trong context và lịch sử. Chỉ hỏi tối đa 1-2 câu thật sự cần thiết.
        Khi người dùng đổi một điều kiện, chỉ cập nhật điều kiện đó và giữ các điều kiện còn lại.
        Không tạo trí nhớ ngoài cuộc trò chuyện hiện tại.
        Nếu có tọa độ hiện tại hợp lệ thì ưu tiên tọa độ đó; không hỏi lại người dùng đang ở đâu.
        Nếu người dùng chỉ định khu vực khác trong hội thoại thì ưu tiên khu vực được chỉ định.
        Không suy đoán vị trí và không theo dõi sự di chuyển.
        Khi đủ thông tin, mặc định đưa 2-3 lựa chọn có căn cứ; không thêm lựa chọn thiếu căn cứ chỉ để đủ số lượng.
        Không bịa tên địa điểm, địa chỉ, chi nhánh, tọa độ, giá, giờ mở cửa, khoảng cách hoặc nguồn.
        Dữ kiện không có nguồn phải để null hoặc ghi chưa xác minh và verificationStatus=unverified.
        Bài review hoặc mạng xã hội chỉ dùng để khám phá ý tưởng, không mặc định là dữ liệu còn chính xác.
        Giá phải có đơn vị rõ ràng. Giá 'từ' phải giữ nguyên là giá 'từ'.
        Không khẳng định phù hợp ngân sách nếu còn khoản bắt buộc chưa xác định.
        Nếu các nguồn mâu thuẫn hoặc quá cũ, nêu rõ trong reply và dùng partially_verified hoặc unverified.
        Không đưa tọa độ chính xác của người dùng vào reply.
        Trả đúng JSON theo schema. reply là câu trả lời tự nhiên bằng tiếng Việt.
        context phải chứa toàn bộ điều kiện hiện đang biết trong cuộc trò chuyện.
        suggestions phải là mảng rỗng nếu đang cần hỏi thêm thông tin.
        """;

    private const string ResearchInstruction = """
        Bạn là bước nghiên cứu dữ liệu cho agent gợi ý hẹn hò tại Việt Nam.
        Dùng Google Search để tìm địa điểm hoặc hoạt động thật, phù hợp với toàn bộ điều kiện trong đầu vào.
        Ưu tiên nguồn chính thức của địa điểm; nguồn nền tảng uy tín chỉ dùng bổ sung.
        Với mỗi ứng viên, ghi rõ tên, địa chỉ/chi nhánh, giá kèm đơn vị và điều kiện, giờ mở cửa,
        ngày đăng hoặc ngày cập nhật nếu tìm được, cùng URL nguồn.
        Không bịa dữ liệu. Nếu nguồn mâu thuẫn, cũ hoặc không xác minh được thì phải nói rõ.
        Chỉ trả ghi chú nghiên cứu ngắn gọn, không thay người dùng đặt chỗ hay thanh toán.
        """;

    private static readonly JsonElement ResponseSchema = JsonDocument.Parse("""
        {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "reply": { "type": "string" },
            "conversationTitle": { "type": ["string", "null"] },
            "context": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "area": { "type": ["string", "null"] },
                "budgetVnd": { "type": ["number", "null"] },
                "desiredDateTime": { "type": ["string", "null"] },
                "foodPreferences": { "type": "array", "items": { "type": "string" } },
                "activityPreferences": { "type": "array", "items": { "type": "string" } },
                "maxTravelDistanceKm": { "type": ["number", "null"] },
                "otherConstraints": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["area", "budgetVnd", "desiredDateTime", "foodPreferences", "activityPreferences", "maxTravelDistanceKm", "otherConstraints"]
            },
            "suggestions": {
              "type": "array",
              "maxItems": 3,
              "items": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "name": { "type": "string" },
                  "type": { "type": "string" },
                  "summary": { "type": "string" },
                  "reason": { "type": "string" },
                  "address": { "type": ["string", "null"] },
                  "latitude": { "type": ["number", "null"] },
                  "longitude": { "type": ["number", "null"] },
                  "distanceKm": { "type": ["number", "null"] },
                  "priceText": { "type": ["string", "null"] },
                  "priceMinVnd": { "type": ["number", "null"] },
                  "priceMaxVnd": { "type": ["number", "null"] },
                  "priceUnit": { "type": ["string", "null"] },
                  "openingHours": { "type": ["string", "null"] },
                  "verificationStatus": { "type": "string", "enum": ["verified", "partially_verified", "unverified"] },
                  "missingInformation": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["name", "type", "summary", "reason", "address", "latitude", "longitude", "distanceKm", "priceText", "priceMinVnd", "priceMaxVnd", "priceUnit", "openingHours", "verificationStatus", "missingInformation"]
              }
            }
          },
          "required": ["reply", "conversationTitle", "context", "suggestions"]
        }
        """).RootElement.Clone();

    public async Task<AiAssistantResult> Reply(AiAssistantRequest input, CancellationToken ct)
    {
        var endpoint = config["Ai:InteractionsUrl"] ??
                       "https://generativelanguage.googleapis.com/v1beta/interactions";
        var model = config["Ai:Model"];
        var apiKey = config["Ai:ApiKey"];
        var enableGoogleSearch = config.GetValue("Ai:EnableGoogleSearch", false);

        if (string.IsNullOrWhiteSpace(model) || string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Missing Ai:Model or Ai:ApiKey.");
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && uri.Host is not ("localhost" or "127.0.0.1")))
            throw new InvalidOperationException("Ai:InteractionsUrl must be HTTPS or a local test endpoint.");

        var originalInput = BuildInput(input);
        string? research = null;
        IReadOnlyList<AiCitation> citations = [];

        if (enableGoogleSearch)
        {
            var researchResponse = await Send(uri, apiKey, new
            {
                model,
                store = false,
                system_instruction = ResearchInstruction,
                input = originalInput,
                tools = new object[] { new { type = "google_search" } }
            }, ct);
            var researchOutput = ReadCompletedOutput(researchResponse);
            research = researchOutput.Text;
            citations = researchOutput.Citations;
        }

        using var originalDocument = JsonDocument.Parse(originalInput);
        var finalInput = research is null
            ? originalInput
            : JsonSerializer.Serialize(new
            {
                request = originalDocument.RootElement.Clone(),
                groundedResearch = research,
                sources = citations.Select(c => new { c.Title, c.Url })
            }, JsonOptions);

        var finalResponse = await Send(uri, apiKey, new
        {
            model,
            store = false,
            system_instruction = SystemInstruction,
            input = finalInput,
            response_format = new
            {
                type = "text",
                mime_type = "application/json",
                schema = ResponseSchema
            }
        }, ct);
        var rawJson = ReadCompletedOutput(finalResponse).Text;
        var envelope = JsonSerializer.Deserialize<AssistantEnvelope>(rawJson, JsonOptions)
                       ?? throw new JsonException("Gemini JSON is empty.");
        if (string.IsNullOrWhiteSpace(envelope.Reply) || envelope.Context is null ||
            envelope.Suggestions is null || envelope.Suggestions.Length > 3)
            throw new JsonException("Gemini JSON does not match the required shape.");

        if (citations.Count == 0)
        {
            envelope = envelope with
            {
                Suggestions = envelope.Suggestions.Select(s => s with
                {
                    VerificationStatus = "unverified"
                }).ToArray()
            };
            rawJson = JsonSerializer.Serialize(envelope, JsonOptions);
        }

        return new AiAssistantResult(
            envelope.Reply,
            envelope.ConversationTitle,
            new AiAssistantData(envelope.Context, envelope.Suggestions),
            rawJson,
            "Google Gemini",
            model,
            citations);
    }

    private async Task<string> Send(
        Uri uri, string apiKey, object payload, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, uri);
        request.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        using var response = await http.SendAsync(
            request, HttpCompletionOption.ResponseHeadersRead, ct);
        var responseText = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException(
                $"Gemini returned HTTP {(int)response.StatusCode}.", null, response.StatusCode);
        return responseText;
    }

    private static CompletedOutput ReadCompletedOutput(string responseText)
    {
        using var document = JsonDocument.Parse(responseText);
        var root = document.RootElement;
        if (!root.TryGetProperty("status", out var status) || status.GetString() != "completed" ||
            !root.TryGetProperty("steps", out var steps) || steps.ValueKind != JsonValueKind.Array)
            throw new JsonException("Gemini interaction did not complete.");

        JsonElement? textBlock = null;
        foreach (var step in steps.EnumerateArray().Reverse())
        {
            if (!step.TryGetProperty("type", out var type) || type.GetString() != "model_output" ||
                !step.TryGetProperty("content", out var content) ||
                content.ValueKind != JsonValueKind.Array) continue;

            foreach (var block in content.EnumerateArray().Reverse())
            {
                if (!block.TryGetProperty("type", out var blockType) ||
                    blockType.GetString() != "text" ||
                    !block.TryGetProperty("text", out _)) continue;

                textBlock = block.Clone();
                break;
            }
            if (textBlock is not null) break;
        }

        if (textBlock is null ||
            !textBlock.Value.TryGetProperty("text", out var textElement) ||
            textElement.ValueKind != JsonValueKind.String ||
            string.IsNullOrWhiteSpace(textElement.GetString()))
            throw new JsonException("Gemini response has no text output.");

        return new CompletedOutput(
            textElement.GetString()!, ReadCitations(textBlock.Value));
    }

    private static string BuildInput(AiAssistantRequest input)
    {
        JsonElement context;
        try
        {
            context = JsonDocument.Parse(input.ContextJson).RootElement.Clone();
        }
        catch (JsonException)
        {
            context = JsonDocument.Parse("{}").RootElement.Clone();
        }

        var location = input.Latitude is not null && input.Longitude is not null
            ? new
            {
                latitude = input.Latitude,
                longitude = input.Longitude,
                accuracyMeters = input.AccuracyMeters,
                capturedAt = input.LocationCapturedAt
            }
            : null;

        return JsonSerializer.Serialize(new
        {
            currentTime = DateTimeOffset.UtcNow,
            savedContext = context,
            currentLocation = location,
            conversation = input.History.Select(m => new
            {
                role = m.Role,
                senderUserId = m.SenderUserId,
                content = m.Content
            })
        }, JsonOptions);
    }

    private static IReadOnlyList<AiCitation> ReadCitations(JsonElement textBlock)
    {
        if (!textBlock.TryGetProperty("annotations", out var annotations) ||
            annotations.ValueKind != JsonValueKind.Array)
            return [];

        var result = new List<AiCitation>();
        foreach (var annotation in annotations.EnumerateArray())
        {
            if (!annotation.TryGetProperty("type", out var type) ||
                type.GetString() != "url_citation") continue;

            var url = ReadString(annotation, "url") ??
                      ReadString(annotation, "uri") ??
                      ReadString(annotation, "source");
            if (string.IsNullOrWhiteSpace(url)) continue;
            result.Add(new AiCitation(
                url,
                ReadString(annotation, "title") ?? "Nguồn tham khảo",
                ReadInt(annotation, "start_index"),
                ReadInt(annotation, "end_index")));
        }
        return result;
    }

    private static string? ReadString(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static int? ReadInt(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.TryGetInt32(out var number)
            ? number
            : null;

    private sealed record AssistantEnvelope(
        string Reply,
        string? ConversationTitle,
        AiConversationContext Context,
        AiDateSuggestion[] Suggestions);

    private sealed record CompletedOutput(
        string Text,
        IReadOnlyList<AiCitation> Citations);
}
