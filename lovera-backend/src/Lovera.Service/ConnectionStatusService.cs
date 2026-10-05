using Lovera.Repository;

namespace Lovera.Service;

public sealed record SetConnectionStatusRequest(string Kind, DateTimeOffset ExpectedAvailableAt);
public sealed record ConnectionStatusResponse(Guid UserId, string Kind, DateTime? ExpectedAvailableAtUtc, DateTime? UpdatedAtUtc);

public sealed class ConnectionStatusService(IFeatureRepository repo, CoupleService couples, IClock clock)
{
    public static readonly string[] BusyKinds = ["Studying", "Working", "Sleeping", "OnTheRoad", "PersonalTime"];

    public async Task<ConnectionStatusResponse> Mine(Guid userId, CancellationToken ct)
    {
        await couples.RequireCouple(userId, ct);
        return await Read(userId, ct);
    }

    public async Task<ConnectionStatusResponse> Partner(Guid userId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var partnerId = couple.Members.Single(m => m.UserId != userId && m.LeftAtUtc is null).UserId;
        return await Read(partnerId, ct);
    }

    public async Task<ConnectionStatusResponse> Set(Guid userId, SetConnectionStatusRequest input, CancellationToken ct)
    {
        await couples.RequireCouple(userId, ct);
        if (!BusyKinds.Contains(input.Kind, StringComparer.Ordinal))
            throw new AppProblem(400, "invalid_status", "Trạng thái không thuộc danh sách cho phép.");
        var expected = input.ExpectedAvailableAt.UtcDateTime;
        if (expected <= clock.UtcNow) throw new AppProblem(400, "invalid_available_time", "Giờ dự kiến rảnh phải ở tương lai.");
        var status = await repo.Status(userId, ct);
        if (status is null) { status = new ConnectionStatus { UserId = userId }; repo.Add(status); }
        status.Kind = input.Kind;
        status.ExpectedAvailableAtUtc = expected;
        status.UpdatedAtUtc = clock.UtcNow;
        await repo.Save(ct);
        return ToResponse(status);
    }

    public async Task<ConnectionStatusResponse> Clear(Guid userId, CancellationToken ct)
    {
        await couples.RequireCouple(userId, ct);
        var status = await repo.Status(userId, ct);
        if (status is not null) { repo.Remove(status); await repo.Save(ct); }
        return new ConnectionStatusResponse(userId, "Available", null, null);
    }

    private async Task<ConnectionStatusResponse> Read(Guid userId, CancellationToken ct)
    {
        var status = await repo.Status(userId, ct);
        if (status is null) return new ConnectionStatusResponse(userId, "Available", null, null);
        if (status.ExpectedAvailableAtUtc <= clock.UtcNow)
        {
            repo.Remove(status);
            await repo.Save(ct);
            return new ConnectionStatusResponse(userId, "Available", null, null);
        }
        return ToResponse(status);
    }

    private static ConnectionStatusResponse ToResponse(ConnectionStatus status) =>
        new(status.UserId, status.Kind, status.ExpectedAvailableAtUtc, status.UpdatedAtUtc);
}
