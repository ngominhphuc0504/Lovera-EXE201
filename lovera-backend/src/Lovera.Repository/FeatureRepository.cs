using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Lovera.Repository;

public sealed record MemorySummary(Guid Id, Guid CoupleId, Guid CreatorUserId, string? Text,
    bool HasImage, DateTime CreatedAtUtc);

public interface IFeatureRepository
{
    Task<UserAccount?> User(Guid id, CancellationToken ct);
    Task<Couple?> ActiveCouple(Guid userId, CancellationToken ct);
    Task<PairingInvitation?> Invitation(string hash, CancellationToken ct);
    Task<PairingInvitation?> InvitationForUpdate(string hash, CancellationToken ct);
    Task<PairingInvitation?> PendingInvitation(Guid creatorId, DateTime now, CancellationToken ct);
    Task<IReadOnlyList<PairingInvitation>> PendingInvitations(Guid creatorId, DateTime now, CancellationToken ct);
    Task<Garden?> Garden(Guid coupleId, CancellationToken ct);
    Task<int> PointsEarned(Guid coupleId, DateOnly day, CancellationToken ct);
    Task<int> ActionCount(Guid coupleId, string action, DateTime sinceUtc, CancellationToken ct);
    Task<int> PlanCount(Guid coupleId, DateTime sinceUtc, CancellationToken ct);
    Task<bool> HasPointEvent(Guid coupleId, string action, DateOnly day, Guid? actorId, CancellationToken ct);
    Task<IReadOnlyList<PointEvent>> PointHistory(Guid coupleId, int take, CancellationToken ct);
    Task<DatePlan?> Plan(Guid planId, CancellationToken ct);
    Task<IReadOnlyList<DatePlan>> Plans(Guid coupleId, int take, CancellationToken ct);
    Task<LoveMemory?> Memory(Guid memoryId, CancellationToken ct);
    Task<IReadOnlyList<MemorySummary>> Memories(Guid coupleId, int take, CancellationToken ct);
    Task<ConnectionStatus?> Status(Guid userId, CancellationToken ct);
    void Add(object entity);
    void Remove(object entity);
    Task Save(CancellationToken ct);
    Task<IDbContextTransaction> LockUsers(Guid first, Guid second, CancellationToken ct);
    Task<IDbContextTransaction> LockCouple(Guid coupleId, CancellationToken ct);
}

public sealed class FeatureRepository(LoveraDbContext db) : IFeatureRepository
{
    public Task<UserAccount?> User(Guid id, CancellationToken ct) => db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<Couple?> ActiveCouple(Guid userId, CancellationToken ct) =>
        db.Couples.Include(c => c.Members)
            .SingleOrDefaultAsync(c => c.EndedAtUtc == null &&
                c.Members.Any(m => m.UserId == userId && m.LeftAtUtc == null), ct);

    public Task<PairingInvitation?> Invitation(string hash, CancellationToken ct) =>
        db.PairingInvitations.AsNoTracking().SingleOrDefaultAsync(i => i.CodeHash == hash, ct);

    public Task<PairingInvitation?> InvitationForUpdate(string hash, CancellationToken ct) =>
        db.PairingInvitations.SingleOrDefaultAsync(i => i.CodeHash == hash, ct);

    public Task<PairingInvitation?> PendingInvitation(Guid creatorId, DateTime now, CancellationToken ct) =>
        db.PairingInvitations.Where(i => i.CreatorUserId == creatorId && i.RedeemedAtUtc == null && i.CancelledAtUtc == null && i.ExpiresAtUtc > now)
            .OrderByDescending(i => i.CreatedAtUtc).FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<PairingInvitation>> PendingInvitations(Guid creatorId, DateTime now, CancellationToken ct) =>
        await db.PairingInvitations.Where(i => i.CreatorUserId == creatorId && i.RedeemedAtUtc == null &&
            i.CancelledAtUtc == null && i.ExpiresAtUtc > now).ToListAsync(ct);

    public Task<Garden?> Garden(Guid coupleId, CancellationToken ct) => db.Gardens.SingleOrDefaultAsync(g => g.CoupleId == coupleId, ct);
    public Task<int> PointsEarned(Guid coupleId, DateOnly day, CancellationToken ct) =>
        db.PointEvents.Where(e => e.CoupleId == coupleId && e.LocalDate == day).SumAsync(e => e.Points, ct);
    public Task<int> ActionCount(Guid coupleId, string action, DateTime sinceUtc, CancellationToken ct) =>
        db.PointEvents.CountAsync(e => e.CoupleId == coupleId && e.ActionType == action && e.OccurredAtUtc >= sinceUtc, ct);
    public Task<int> PlanCount(Guid coupleId, DateTime sinceUtc, CancellationToken ct) =>
        db.DatePlans.CountAsync(p => p.CoupleId == coupleId && p.CreatedAtUtc >= sinceUtc, ct);
    public Task<bool> HasPointEvent(Guid coupleId, string action, DateOnly day, Guid? actorId, CancellationToken ct) =>
        db.PointEvents.AnyAsync(e => e.CoupleId == coupleId && e.ActionType == action && e.LocalDate == day && (actorId == null || e.ActorUserId == actorId), ct);
    public async Task<IReadOnlyList<PointEvent>> PointHistory(Guid coupleId, int take, CancellationToken ct) =>
        await db.PointEvents.AsNoTracking().Where(e => e.CoupleId == coupleId).OrderByDescending(e => e.OccurredAtUtc).Take(take).ToListAsync(ct);
    public Task<DatePlan?> Plan(Guid planId, CancellationToken ct) => db.DatePlans.SingleOrDefaultAsync(p => p.Id == planId, ct);
    public async Task<IReadOnlyList<DatePlan>> Plans(Guid coupleId, int take, CancellationToken ct) =>
        await db.DatePlans.AsNoTracking().Where(p => p.CoupleId == coupleId).OrderByDescending(p => p.CreatedAtUtc).Take(take).ToListAsync(ct);
    public Task<LoveMemory?> Memory(Guid memoryId, CancellationToken ct) => db.Memories.SingleOrDefaultAsync(m => m.Id == memoryId, ct);
    public async Task<IReadOnlyList<MemorySummary>> Memories(Guid coupleId, int take, CancellationToken ct) =>
        await db.Memories.AsNoTracking().Where(m => m.CoupleId == coupleId)
            .OrderByDescending(m => m.CreatedAtUtc).Take(take)
            .Select(m => new MemorySummary(m.Id, m.CoupleId, m.CreatorUserId, m.Text,
                m.ImageBytes != null, m.CreatedAtUtc)).ToListAsync(ct);
    public Task<ConnectionStatus?> Status(Guid userId, CancellationToken ct) => db.ConnectionStatuses.SingleOrDefaultAsync(s => s.UserId == userId, ct);
    public void Add(object entity) => db.Add(entity);
    public void Remove(object entity) => db.Remove(entity);
    public Task Save(CancellationToken ct) => db.SaveChangesAsync(ct);

    public async Task<IDbContextTransaction> LockUsers(Guid first, Guid second, CancellationToken ct)
    {
        var tx = await db.Database.BeginTransactionAsync(ct);
        foreach (var id in new[] { first, second }.Distinct().Order())
            await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {id} FOR UPDATE").ToListAsync(ct);
        return tx;
    }

    public async Task<IDbContextTransaction> LockCouple(Guid coupleId, CancellationToken ct)
    {
        var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Couples.FromSqlInterpolated($"SELECT * FROM couples WHERE \"Id\" = {coupleId} FOR UPDATE").ToListAsync(ct);
        return tx;
    }
}
