using Lovera.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Lovera.Api;

[ApiController]
[Authorize(Policy = "VerifiedEmail")]
[Route("api/ai-conversations")]
public sealed class AiConversationsController(
    AiChatService chats) : LoveraController
{
    [HttpPost]
    [EnableRateLimiting("ai-conversation")]
    public Task<AiConversationResponse> Create(
        CreateAiConversationRequest request,
        CancellationToken ct) =>
        chats.Create(UserId, request, ct);

    [HttpGet]
    public Task<IReadOnlyList<AiConversationResponse>> List(
        [FromQuery] int take = 20,
        CancellationToken ct = default) =>
        chats.List(UserId, take, ct);

    [HttpGet("{conversationId:guid}/messages")]
    public Task<IReadOnlyList<AiMessageResponse>> Messages(
        Guid conversationId,
        [FromQuery] int take = 50,
        CancellationToken ct = default) =>
        chats.Messages(
            UserId,
            conversationId,
            take,
            ct);

    [HttpPost("{conversationId:guid}/messages")]
    [EnableRateLimiting("ai-message")]
    public Task<SendAiMessageResponse> Send(
        Guid conversationId,
        SendAiMessageRequest request,
        CancellationToken ct) =>
        chats.Send(
            UserId,
            conversationId,
            request,
            ct);

    [HttpPost("{conversationId:guid}/archive")]
    [EnableRateLimiting("ai-conversation")]
    public Task<AiConversationResponse> Archive(
        Guid conversationId,
        CancellationToken ct) =>
        chats.Archive(
            UserId,
            conversationId,
            ct);
}