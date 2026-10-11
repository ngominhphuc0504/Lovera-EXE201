using System.Security.Cryptography;
using System.Text;
using Lovera.Repository;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Lovera.Service;

public sealed record PairingCodeResponse(string Code, DateTime ExpiresAtUtc);
public sealed record CoupleResponse(Guid CoupleId, Guid[] UserIds, DateTime CreatedAtUtc, DateOnly? StartDate, bool IsActive);
public sealed record PairingStatusResponse(string State, CoupleResponse? Couple, DateTime? PendingUntilUtc);
public sealed record LoveDaysResponse(Guid CoupleId, DateOnly? StartDate, DateOnly Today, int? TotalDays, string TimeZone);

public sealed class CoupleService(IFeatureRepository repo, IClock clock, TimeZoneInfo timeZone)
{
    private static string HashCode(string code) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code))).ToLowerInvariant();

    public async Task<PairingCodeResponse> CreateInvitation(Guid userId, int lifetimeHours, CancellationToken ct)
    {
        await RequireVerified(userId, ct);
        if (lifetimeHours is < 1 or > 168) throw new InvalidOperationException("Pairing:CodeHours must be between 1 and 168.");
        await using var tx = await repo.LockUsers(userId, userId, ct);
        if (await repo.ActiveCouple(userId, ct) is not null) throw new AppProblem(409, "already_paired", "Tài khoản đã ghép đôi.");
        var now = clock.UtcNow;
        foreach (var previous in await repo.PendingInvitations(userId, now, ct)) previous.CancelledAtUtc = now;
        var code = Convert.ToHexString(RandomNumberGenerator.GetBytes(6));
        repo.Add(new PairingInvitation { CreatorUserId = userId, CodeHash = HashCode(code), CreatedAtUtc = now, ExpiresAtUtc = now.AddHours(lifetimeHours) });
        await repo.Save(ct);
        await tx.CommitAsync(ct);
        return new PairingCodeResponse(code, now.AddHours(lifetimeHours));
    }

    public async Task<PairingStatusResponse> Status(Guid userId, CancellationToken ct)
    {
        var couple = await repo.ActiveCouple(userId, ct);
        if (couple is not null) return new PairingStatusResponse("paired", ToResponse(couple), null);
        var invitation = await repo.PendingInvitation(userId, clock.UtcNow, ct);
        return invitation is null ? new PairingStatusResponse("single", null, null) : new PairingStatusResponse("pending", null, invitation.ExpiresAtUtc);
    }

    public async Task<CoupleResponse> Join(Guid userId, string code, CancellationToken ct)
    {
        await RequireVerified(userId, ct);
        if (string.IsNullOrWhiteSpace(code) || code.Length != 12 || !code.All(Uri.IsHexDigit))
            throw new AppProblem(400, "invalid_pairing_code", "Mã ghép đôi không hợp lệ.");
        var invitation = await repo.Invitation(HashCode(code.ToUpperInvariant()), ct)
            ?? throw new AppProblem(400, "invalid_pairing_code", "Mã ghép đôi không hợp lệ.");
        if (invitation.ExpiresAtUtc <= clock.UtcNow) throw new AppProblem(410, "pairing_code_expired", "Mã ghép đôi đã hết hạn.");
        if (invitation.RedeemedAtUtc is not null || invitation.CancelledAtUtc is not null)
            throw new AppProblem(400, "invalid_pairing_code", "Mã ghép đôi không hợp lệ.");
        if (invitation.CreatorUserId == userId) throw new AppProblem(400, "self_pairing", "Không thể ghép đôi với chính mình.");

        await using var tx = await repo.LockUsers(invitation.CreatorUserId, userId, ct);
        invitation = await repo.InvitationForUpdate(HashCode(code.ToUpperInvariant()), ct)
            ?? throw new AppProblem(400, "invalid_pairing_code", "Mã ghép đôi không hợp lệ.");
        if (invitation.ExpiresAtUtc <= clock.UtcNow) throw new AppProblem(410, "pairing_code_expired", "Mã ghép đôi đã hết hạn.");
        if (invitation.RedeemedAtUtc is not null || invitation.CancelledAtUtc is not null)
            throw new AppProblem(400, "invalid_pairing_code", "Mã ghép đôi không hợp lệ.");
        await RequireVerified(invitation.CreatorUserId, ct);
        if (await repo.ActiveCouple(userId, ct) is not null || await repo.ActiveCouple(invitation.CreatorUserId, ct) is not null)
            throw new AppProblem(409, "already_paired", "Một trong hai tài khoản đã ghép đôi.");
        var now = clock.UtcNow;
        var couple = new Couple { CreatedAtUtc = now };
        couple.Members = [new CoupleMember { CoupleId = couple.Id, UserId = invitation.CreatorUserId, JoinedAtUtc = now },
            new CoupleMember { CoupleId = couple.Id, UserId = userId, JoinedAtUtc = now }];
        couple.Garden = new Garden { CoupleId = couple.Id, Stage = 1 };
        invitation.RedeemedAtUtc = now;
        foreach (var owner in new[] { invitation.CreatorUserId, userId })
            foreach (var pending in await repo.PendingInvitations(owner, now, ct))
                if (pending.Id != invitation.Id) pending.CancelledAtUtc = now;
        repo.Add(couple);
        try { await repo.Save(ct); await tx.CommitAsync(ct); }
        catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        { throw new AppProblem(409, "already_paired", "Một trong hai tài khoản đã ghép đôi."); }
        return ToResponse(couple);
    }

    public async Task Unpair(Guid userId, bool confirmed, CancellationToken ct)
    {
        if (!confirmed) throw new AppProblem(400, "confirmation_required", "Cần xác nhận trước khi hủy ghép đôi.");
        var couple = await RequireCouple(userId, ct);
        await using var tx = await repo.LockCouple(couple.Id, ct);
        couple = await RequireCouple(userId, ct);
        var now = clock.UtcNow;
        couple.EndedAtUtc = now;
        foreach (var member in couple.Members) member.LeftAtUtc = now;
        foreach (var member in couple.Members)
        {
            var status = await repo.Status(member.UserId, ct);
            if (status is not null) repo.Remove(status);
        }
        await repo.Save(ct);
        await tx.CommitAsync(ct);
    }

    public async Task<LoveDaysResponse> GetLoveDays(Guid userId, CancellationToken ct)
    {
        var couple = await RequireCouple(userId, ct);
        return ToLoveDays(couple);
    }

    public async Task<LoveDaysResponse> SetStartDate(Guid userId, DateOnly startDate, CancellationToken ct)
    {
        var couple = await RequireCouple(userId, ct);
        var today = LocalDay(clock.UtcNow);
        if (startDate > today) throw new AppProblem(400, "future_start_date", "Ngày bắt đầu yêu không được ở tương lai.");
        couple.StartDate = startDate;
        await repo.Save(ct);
        return ToLoveDays(couple);
    }

    public async Task<Couple> RequireCouple(Guid userId, CancellationToken ct) =>
        await repo.ActiveCouple(userId, ct) ?? throw new AppProblem(403, "couple_required", "Cần ghép đôi để dùng chức năng này.");

    public DateOnly LocalDay(DateTime utc) => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utc, timeZone));

    private LoveDaysResponse ToLoveDays(Couple couple)
    {
        var today = LocalDay(clock.UtcNow);
        return new LoveDaysResponse(couple.Id, couple.StartDate, today,
            couple.StartDate is { } start ? today.DayNumber - start.DayNumber + 1 : null, timeZone.Id);
    }

    private async Task RequireVerified(Guid userId, CancellationToken ct)
    {
        if (await repo.User(userId, ct) is not { EmailVerified: true })
            throw new AppProblem(403, "email_unverified", "Cần xác thực email trước khi ghép đôi.");
    }

    private static CoupleResponse ToResponse(Couple c) =>
        new(c.Id, c.Members.Select(m => m.UserId).ToArray(), c.CreatedAtUtc, c.StartDate, c.EndedAtUtc is null);
}
