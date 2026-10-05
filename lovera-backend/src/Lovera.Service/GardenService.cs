using Lovera.Repository;

namespace Lovera.Service;

public sealed record GardenResponse(Guid CoupleId, int TotalPoints, int Stage, int EligibleStage,
    bool CareAvailable, int PointsEarnedToday, int DailyRemaining);
public sealed record PointHistoryItem(string ActionType, int Points, DateTime OccurredAtUtc, Guid ActorUserId, Guid? SourceId);

public sealed class GardenService(IFeatureRepository repo, CoupleService couples, IClock clock)
{
    public const string CheckIn = "check_in";
    public const string PlanCreated = "date_plan_created";
    public const string PlanCompleted = "date_plan_completed";
    public const string MemorySaved = "memory_saved";
    public const int DailyCap = 50;

    public async Task<GardenResponse> Get(Guid userId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var garden = await repo.Garden(couple.Id, ct) ?? throw new InvalidOperationException("Garden is missing for couple.");
        return await ToResponse(garden, ct);
    }

    public async Task<GardenResponse> CheckInToday(Guid userId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        await using var tx = await repo.LockCouple(couple.Id, ct);
        var today = couples.LocalDay(clock.UtcNow);
        if (!await repo.HasPointEvent(couple.Id, CheckIn, today, userId, ct))
            await AwardLocked(couple.Id, userId, CheckIn, 5, null, ct);
        await repo.Save(ct);
        await tx.CommitAsync(ct);
        return await Get(userId, ct);
    }

    public async Task<GardenResponse> Care(Guid userId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        await using var tx = await repo.LockCouple(couple.Id, ct);
        var garden = await repo.Garden(couple.Id, ct) ?? throw new InvalidOperationException("Garden is missing for couple.");
        if (garden.Stage >= EligibleStage(garden.TotalPoints))
            throw new AppProblem(409, "care_not_available", "Khu vườn chưa đủ điểm để nâng cấp.");
        garden.Stage++;
        garden.LastCareAtUtc = clock.UtcNow;
        await repo.Save(ct);
        await tx.CommitAsync(ct);
        return await ToResponse(garden, ct);
    }

    public async Task<IReadOnlyList<PointHistoryItem>> History(Guid userId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var items = await repo.PointHistory(couple.Id, 100, ct);
        return items.Select(e => new PointHistoryItem(e.ActionType, e.Points, e.OccurredAtUtc, e.ActorUserId, e.SourceId)).ToArray();
    }

    // Caller holds the couple row lock and commits the transaction with its own action.
    public async Task<int> AwardLocked(Guid coupleId, Guid actorId, string action, int requested, Guid? sourceId, CancellationToken ct)
    {
        var garden = await repo.Garden(coupleId, ct) ?? throw new InvalidOperationException("Garden is missing for couple.");
        var today = couples.LocalDay(clock.UtcNow);
        var earned = await repo.PointsEarned(coupleId, today, ct);
        var awarded = Math.Min(requested, Math.Max(0, DailyCap - earned));
        if (awarded == 0) return 0;
        repo.Add(new PointEvent { CoupleId = coupleId, ActorUserId = actorId, ActionType = action,
            Points = awarded, LocalDate = today, SourceId = sourceId, OccurredAtUtc = clock.UtcNow });
        garden.TotalPoints += awarded;
        return awarded;
    }

    private async Task<GardenResponse> ToResponse(Garden garden, CancellationToken ct)
    {
        var earned = await repo.PointsEarned(garden.CoupleId, couples.LocalDay(clock.UtcNow), ct);
        var eligible = EligibleStage(garden.TotalPoints);
        return new GardenResponse(garden.CoupleId, garden.TotalPoints, garden.Stage, eligible,
            garden.Stage < eligible, earned, Math.Max(0, DailyCap - earned));
    }

    public static int EligibleStage(int totalPoints) => totalPoints >= 300 ? 3 : totalPoints >= 100 ? 2 : 1;
}
