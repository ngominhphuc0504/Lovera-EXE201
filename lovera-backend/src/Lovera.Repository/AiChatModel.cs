namespace Lovera.Repository;

public sealed class AiConversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CoupleId { get; set; }
    public Couple Couple { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }
    public UserAccount CreatedByUser { get; set; } = null!;
    public string? Title { get; set; }
    public string ContextJson { get; set; } = "{}";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? ArchivedAtUtc { get; set; }
    public List<AiMessage> Messages { get; set; } = [];
}

public sealed class AiMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public AiConversation Conversation { get; set; } = null!;
    public Guid? SenderUserId { get; set; }
    public UserAccount? SenderUser { get; set; }
    public string Role { get; set; } = "user";
    public string Content { get; set; } = "";
    public string? StructuredDataJson { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string? Provider { get; set; }
    public string? Model { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<AiMessageSource> Sources { get; set; } = [];
}

public sealed class AiMessageSource
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MessageId { get; set; }
    public AiMessage Message { get; set; } = null!;
    public string Url { get; set; } = "";
    public string Title { get; set; } = "";
    public int? StartIndex { get; set; }
    public int? EndIndex { get; set; }
    public DateTime CheckedAtUtc { get; set; }
}