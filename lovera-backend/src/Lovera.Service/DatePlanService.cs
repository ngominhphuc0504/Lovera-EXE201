using System.Text.Json;
using Lovera.Repository;

namespace Lovera.Service;

public sealed record GenerateDatePlanRequest(decimal Budget, DateTimeOffset ScheduledAt,
    string Location, string? FoodPreference, string? ActivityPreference);
public sealed record DatePlanItem(string PlaceName, string Address, string Activity,
    DateTimeOffset StartsAt, int DurationMinutes, decimal EstimatedCost);
public sealed record GeneratedDatePlan(IReadOnlyList<DatePlanItem> Items);
public sealed record DatePlanResponse(Guid Id, Guid CoupleId, decimal Budget, decimal EstimatedTotal,
    string Location, IReadOnlyList<DatePlanItem> Items, DateTime CreatedAtUtc,
    DateTime? SavedAtUtc, DateTime? CompletedAtUtc);
public sealed record DatePlanGenerationResponse(string Status, string? Message, DatePlanResponse? Plan, int PointsEarned);

public interface IDatePlanGenerator
{
    Task<GeneratedDatePlan?> Generate(GenerateDatePlanRequest input, CancellationToken ct);
}

public sealed class DatePlanService(IFeatureRepository repo, CoupleService couples, GardenService garden,
    IDatePlanGenerator generator, IClock clock)
{
    public async Task<DatePlanGenerationResponse> Generate(Guid userId, GenerateDatePlanRequest input, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        ValidateInput(input);
        if (input.Budget < 20000)
            return Fallback("Ngân sách quá thấp; hãy tăng ngân sách hoặc chọn khu vực khác.");
        GeneratedDatePlan? generated;
        try { generated = await generator.Generate(input, ct); }
        catch (Exception e) when (e is HttpRequestException or TimeoutException or TaskCanceledException or JsonException)
        { return Fallback("Không tạo được lịch trình lúc này; hãy thử lại hoặc đổi ngân sách/khu vực."); }
        if (generated?.Items is not { } items) return Fallback("Không tìm thấy lịch trình phù hợp; hãy tăng ngân sách hoặc đổi khu vực.");
        if (items.Count is < 1 or > 10 || items.Any(i => i is null || string.IsNullOrWhiteSpace(i.PlaceName)
            || string.IsNullOrWhiteSpace(i.Address) || string.IsNullOrWhiteSpace(i.Activity)
            || i.DurationMinutes is < 15 or > 720 || i.EstimatedCost < 0
            || i.StartsAt.UtcDateTime < input.ScheduledAt.UtcDateTime))
            return Fallback("Kết quả gợi ý không hợp lệ; hãy thử lại.");
        decimal total;
        try { total = items.Sum(i => i.EstimatedCost); }
        catch (OverflowException) { return Fallback("Chi phí gợi ý không hợp lệ; hãy thử lại."); }
        if (total > input.Budget) return Fallback("Chi phí gợi ý vượt ngân sách; hãy tăng ngân sách hoặc đổi khu vực.");
        var now = clock.UtcNow;
        await using var tx = await repo.LockCouple(couple.Id, ct);
        // Count generated plans, including plans that did not earn points because the daily cap was reached.
        var recent = await repo.PlanCount(couple.Id, now.AddHours(-1), ct);
        var plan = new DatePlan { CoupleId = couple.Id, CreatorUserId = userId, Budget = input.Budget,
            EstimatedTotal = total, ScheduledAtUtc = input.ScheduledAt.UtcDateTime, Location = input.Location.Trim(),
            FoodPreference = input.FoodPreference?.Trim(), ActivityPreference = input.ActivityPreference?.Trim(),
            ItemsJson = JsonSerializer.Serialize(items), CreatedAtUtc = now };
        repo.Add(plan);
        var earned = recent < 3 ? await garden.AwardLocked(couple.Id, userId, GardenService.PlanCreated, 5, plan.Id, ct) : 0;
        await repo.Save(ct);
        await tx.CommitAsync(ct);
        return new DatePlanGenerationResponse("created", null, ToResponse(plan), earned);
    }

    public async Task<DatePlanResponse> Save(Guid userId, Guid planId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var plan = await repo.Plan(planId, ct);
        if (plan is null || plan.CoupleId != couple.Id) throw NotFound();
        if (plan.SavedAtUtc is null) { plan.SavedAtUtc = clock.UtcNow; await repo.Save(ct); }
        return ToResponse(plan);
    }

    public async Task<DatePlanResponse> Complete(Guid userId, Guid planId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        await using var tx = await repo.LockCouple(couple.Id, ct);
        var plan = await repo.Plan(planId, ct);
        if (plan is null || plan.CoupleId != couple.Id) throw NotFound();
        if (plan.SavedAtUtc is null) throw new AppProblem(409, "plan_not_saved", "Cần lưu lịch trình trước khi hoàn thành.");
        if (plan.CompletedAtUtc is null)
        {
            plan.CompletedAtUtc = clock.UtcNow;
            await garden.AwardLocked(couple.Id, userId, GardenService.PlanCompleted, 20, plan.Id, ct);
            await repo.Save(ct);
        }
        await tx.CommitAsync(ct);
        return ToResponse(plan);
    }

    public async Task<IReadOnlyList<DatePlanResponse>> SavedPlans(Guid userId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var plans = await repo.Plans(couple.Id, 100, ct);
        return plans.Where(p => p.SavedAtUtc is not null).Select(ToResponse).ToArray();
    }

    public async Task<DatePlanResponse> Get(Guid userId, Guid planId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var plan = await repo.Plan(planId, ct);
        return plan is null || plan.CoupleId != couple.Id ? throw NotFound() : ToResponse(plan);
    }

    private static DatePlanGenerationResponse Fallback(string message) => new("fallback", message, null, 0);
    private static AppProblem NotFound() => new(404, "plan_not_found", "Không tìm thấy lịch trình.");
    private static DatePlanResponse ToResponse(DatePlan p) => new(p.Id, p.CoupleId, p.Budget, p.EstimatedTotal,
        p.Location, JsonSerializer.Deserialize<DatePlanItem[]>(p.ItemsJson) ?? [], p.CreatedAtUtc, p.SavedAtUtc, p.CompletedAtUtc);

    private static void ValidateInput(GenerateDatePlanRequest input)
    {
        if (input.Budget <= 0 || input.Budget > 1_000_000_000)
            throw new AppProblem(400, "invalid_budget", "Ngân sách phải lớn hơn 0 và tối đa 1 tỷ VNĐ.");
        if (input.ScheduledAt == default) throw new AppProblem(400, "invalid_time", "Cần chọn thời gian hẹn hò.");
        if (string.IsNullOrWhiteSpace(input.Location) || input.Location.Length > 160)
            throw new AppProblem(400, "invalid_location", "Khu vực không hợp lệ.");
        if (input.FoodPreference?.Length > 300 || input.ActivityPreference?.Length > 300)
            throw new AppProblem(400, "invalid_preference", "Sở thích tối đa 300 ký tự.");
    }
}
