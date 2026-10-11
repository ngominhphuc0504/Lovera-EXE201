namespace Lovera.Repository;

public sealed class Couple
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? EndedAtUtc { get; set; }
    public DateOnly? StartDate { get; set; }
    public List<CoupleMember> Members { get; set; } = [];
    public Garden Garden { get; set; } = null!;
}

public sealed class CoupleMember
{
    public Guid CoupleId { get; set; }
    public Couple Couple { get; set; } = null!;
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public DateTime JoinedAtUtc { get; set; }
    public DateTime? LeftAtUtc { get; set; }
}

public sealed class PairingInvitation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CreatorUserId { get; set; }
    public UserAccount Creator { get; set; } = null!;
    public string CodeHash { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? RedeemedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
}

public sealed class Garden
{
    public Guid CoupleId { get; set; }
    public Couple Couple { get; set; } = null!;
    public int TotalPoints { get; set; }
    public int Stage { get; set; } = 1;
    public DateTime? LastCareAtUtc { get; set; }
}

public sealed class PointEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CoupleId { get; set; }
    public Couple Couple { get; set; } = null!;
    public Guid ActorUserId { get; set; }
    public string ActionType { get; set; } = "";
    public int Points { get; set; }
    public DateOnly LocalDate { get; set; }
    public Guid? SourceId { get; set; }
    public DateTime OccurredAtUtc { get; set; }
}

public sealed class DatePlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CoupleId { get; set; }
    public Couple Couple { get; set; } = null!;
    public Guid CreatorUserId { get; set; }
    public decimal Budget { get; set; }
    public decimal EstimatedTotal { get; set; }
    public DateTime ScheduledAtUtc { get; set; }
    public string Location { get; set; } = "";
    public string? FoodPreference { get; set; }
    public string? ActivityPreference { get; set; }
    public string ItemsJson { get; set; } = "[]";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? SavedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}

public sealed class LoveMemory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CoupleId { get; set; }
    public Couple Couple { get; set; } = null!;
    public Guid CreatorUserId { get; set; }
    public string? Text { get; set; }
    public byte[]? ImageBytes { get; set; }
    public string? ImageContentType { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public sealed class ConnectionStatus
{
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public string Kind { get; set; } = "Available";
    public DateTime? ExpectedAvailableAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
