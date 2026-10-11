using Lovera.Repository;
using Lovera.Service;
using Microsoft.EntityFrameworkCore.Storage;
using Moq;
using Xunit;

namespace Lovera.Tests;

public sealed class FeatureFlowTests
{
    [Fact]
    public async Task Pairing_requires_verified_email_and_rejects_expired_code()
    {
        var repo = new Mock<IFeatureRepository>();
        var clock = new FakeClock();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var users = new Dictionary<Guid, UserAccount>
        {
            [a] = new() { Id = a, EmailVerified = false },
            [b] = new() { Id = b, EmailVerified = true }
        };
        repo.Setup(r => r.User(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => users[id]);
        var service = new CoupleService(repo.Object, clock, TimeZoneInfo.Utc);
        Assert.Equal("email_unverified", (await Assert.ThrowsAsync<AppProblem>(() =>
            service.CreateInvitation(a, 24, default))).Code);

        users[a].EmailVerified = true;
        const string code = "AABBCCDDEEFF";
        repo.Setup(r => r.Invitation(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PairingInvitation { CreatorUserId = a, ExpiresAtUtc = clock.UtcNow.AddSeconds(-1) });
        Assert.Equal("pairing_code_expired", (await Assert.ThrowsAsync<AppProblem>(() =>
            service.Join(b, code, default))).Code);
    }

    [Fact]
    public async Task Love_days_uses_calendar_days_in_the_configured_timezone()
    {
        var h = new Harness();
        h.Clock.UtcNow = new DateTime(2028, 3, 1, 0, 30, 0, DateTimeKind.Utc);
        var service = h.Couples;
        var result = await service.SetStartDate(h.FirstUser, new DateOnly(2028, 2, 29), default);
        Assert.Equal(new DateOnly(2028, 3, 1), result.Today);
        Assert.Equal(2, result.TotalDays);
        Assert.Equal("future_start_date", (await Assert.ThrowsAsync<AppProblem>(() =>
            service.SetStartDate(h.FirstUser, new DateOnly(2028, 3, 2), default))).Code);
    }

    [Fact]
    public async Task Garden_caps_daily_points_and_advances_stage_only_after_care()
    {
        var h = new Harness();
        h.Garden.TotalPoints = 95;
        h.Events.Add(new PointEvent { CoupleId = h.Couple.Id, ActorUserId = h.FirstUser,
            ActionType = "other", Points = 48, LocalDate = h.Couples.LocalDay(h.Clock.UtcNow) });
        await h.Gardens.CheckInToday(h.FirstUser, default);
        Assert.Equal(97, h.Garden.TotalPoints);
        Assert.Equal(50, h.Events.Sum(e => e.Points));
        Assert.Equal(1, (await h.Gardens.Get(h.FirstUser, default)).Stage);
        Assert.Equal("care_not_available", (await Assert.ThrowsAsync<AppProblem>(() =>
            h.Gardens.Care(h.FirstUser, default))).Code);
        h.Garden.TotalPoints = 100;
        Assert.True((await h.Gardens.Get(h.FirstUser, default)).CareAvailable);
        Assert.Equal(2, (await h.Gardens.Care(h.FirstUser, default)).Stage);
        Assert.Equal("care_not_available", (await Assert.ThrowsAsync<AppProblem>(() =>
            h.Gardens.Care(h.FirstUser, default))).Code);
    }

    [Fact]
    public async Task Busy_status_is_visible_to_partner_and_expires()
    {
        var h = new Harness();
        var service = new ConnectionStatusService(h.Repo.Object, h.Couples, h.Clock);
        var until = h.Clock.UtcNow.AddHours(1);
        await service.Set(h.FirstUser, new SetConnectionStatusRequest("Working", until), default);
        Assert.Equal("Working", (await service.Partner(h.SecondUser, default)).Kind);
        h.Clock.UtcNow = until.AddSeconds(1);
        Assert.Equal("Available", (await service.Partner(h.SecondUser, default)).Kind);
        Assert.Equal("invalid_status", (await Assert.ThrowsAsync<AppProblem>(() =>
            service.Set(h.FirstUser, new SetConnectionStatusRequest("Hidden", until.AddDays(1)), default))).Code);
    }

    [Fact]
    public async Task Only_first_memory_in_a_day_earns_points_and_empty_memory_is_rejected()
    {
        var h = new Harness();
        var service = new MemoryService(h.Repo.Object, h.Couples, h.Gardens, h.Clock);
        Assert.Equal("empty_memory", (await Assert.ThrowsAsync<AppProblem>(() =>
            service.Create(h.FirstUser, "  ", null, default))).Code);
        await service.Create(h.FirstUser, "first", null, default);
        await service.Create(h.SecondUser, "second", null, default);
        Assert.Equal(10, h.Garden.TotalPoints);
        Assert.Single(h.Events, e => e.ActionType == GardenService.MemorySaved);
        Assert.Equal(2, (await service.Timeline(h.FirstUser, default)).Count);
    }

    [Fact]
    public async Task Generated_plan_respects_budget_and_completion_earns_points_once()
    {
        var h = new Harness();
        var generated = new GeneratedDatePlan([new DatePlanItem("Cafe", "Hà Nội", "Coffee",
            new DateTimeOffset(h.Clock.UtcNow.AddDays(1)), 60, 50_000)]);
        var generator = new Mock<IDatePlanGenerator>();
        generator.Setup(g => g.Generate(It.IsAny<GenerateDatePlanRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(generated);
        var service = new DatePlanService(h.Repo.Object, h.Couples, h.Gardens, generator.Object, h.Clock);
        var request = new GenerateDatePlanRequest(40_000, h.Clock.UtcNow.AddDays(1), "Hà Nội", null, null);
        Assert.Equal("fallback", (await service.Generate(h.FirstUser, request, default)).Status);
        Assert.Empty(h.Plans);

        var result = await service.Generate(h.FirstUser, request with { Budget = 100_000 }, default);
        Assert.Equal("created", result.Status);
        Assert.Equal(5, result.PointsEarned);
        var planId = result.Plan!.Id;
        Assert.Equal("plan_not_saved", (await Assert.ThrowsAsync<AppProblem>(() =>
            service.Complete(h.FirstUser, planId, default))).Code);
        await service.Save(h.FirstUser, planId, default);
        await service.Complete(h.SecondUser, planId, default);
        await service.Complete(h.FirstUser, planId, default);
        Assert.Equal(25, h.Garden.TotalPoints);
        Assert.Single(h.Events, e => e.ActionType == GardenService.PlanCompleted);
    }

    [Fact]
    public async Task Ai_timeout_or_malformed_result_falls_back_without_saving_plan()
    {
        var h = new Harness();
        var generator = new Mock<IDatePlanGenerator>();
        generator.SetupSequence(g => g.Generate(It.IsAny<GenerateDatePlanRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TaskCanceledException())
            .ReturnsAsync(new GeneratedDatePlan(null!));
        var service = new DatePlanService(h.Repo.Object, h.Couples, h.Gardens, generator.Object, h.Clock);
        var input = new GenerateDatePlanRequest(100_000, h.Clock.UtcNow.AddDays(1), "Hà Nội", null, null);
        Assert.Equal("fallback", (await service.Generate(h.FirstUser, input, default)).Status);
        Assert.Equal("fallback", (await service.Generate(h.FirstUser, input, default)).Status);
        Assert.Empty(h.Plans);
    }

    private sealed class FakeClock : IClock
    {
        public DateTime UtcNow { get; set; } = new(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc);
    }

    private sealed class Harness
    {
        public readonly Guid FirstUser = Guid.NewGuid();
        public readonly Guid SecondUser = Guid.NewGuid();
        public readonly FakeClock Clock = new();
        public readonly Mock<IFeatureRepository> Repo = new();
        public readonly Couple Couple = new();
        public readonly Garden Garden = new();
        public readonly List<PointEvent> Events = [];
        public readonly List<DatePlan> Plans = [];
        public readonly List<LoveMemory> Memories = [];
        public CoupleService Couples { get; }
        public GardenService Gardens { get; }
        private readonly Dictionary<Guid, ConnectionStatus> statuses = [];

        public Harness()
        {
            Couple.Members = [new CoupleMember { CoupleId = Couple.Id, UserId = FirstUser },
                new CoupleMember { CoupleId = Couple.Id, UserId = SecondUser }];
            Garden.CoupleId = Couple.Id;
            Repo.Setup(r => r.ActiveCouple(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid id, CancellationToken _) =>
                    id == FirstUser || id == SecondUser ? Couple : null);
            Repo.Setup(r => r.Garden(Couple.Id, It.IsAny<CancellationToken>())).ReturnsAsync(Garden);
            Repo.Setup(r => r.PointsEarned(Couple.Id, It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid _, DateOnly day, CancellationToken _) =>
                    Events.Where(e => e.LocalDate == day).Sum(e => e.Points));
            Repo.Setup(r => r.HasPointEvent(Couple.Id, It.IsAny<string>(), It.IsAny<DateOnly>(),
                    It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid _, string action, DateOnly day, Guid? actor, CancellationToken _) =>
                    Events.Any(e => e.ActionType == action && e.LocalDate == day && (actor is null || e.ActorUserId == actor)));
            Repo.Setup(r => r.PlanCount(Couple.Id, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid _, DateTime since, CancellationToken _) => Plans.Count(p => p.CreatedAtUtc >= since));
            Repo.Setup(r => r.Plan(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid id, CancellationToken _) => Plans.SingleOrDefault(p => p.Id == id));
            Repo.Setup(r => r.Memories(Couple.Id, It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid _, int _, CancellationToken _) => (IReadOnlyList<MemorySummary>)Memories
                    .OrderByDescending(m => m.CreatedAtUtc)
                    .Select(m => new MemorySummary(m.Id, m.CoupleId, m.CreatorUserId, m.Text,
                        m.ImageBytes is not null, m.CreatedAtUtc)).ToArray());
            Repo.Setup(r => r.Status(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid id, CancellationToken _) => statuses.GetValueOrDefault(id));
            Repo.Setup(r => r.Add(It.IsAny<object>())).Callback<object>(entity =>
            {
                switch (entity)
                {
                    case PointEvent point: Events.Add(point); break;
                    case DatePlan plan: Plans.Add(plan); break;
                    case LoveMemory memory: Memories.Add(memory); break;
                    case ConnectionStatus status: statuses[status.UserId] = status; break;
                }
            });
            Repo.Setup(r => r.Remove(It.IsAny<object>())).Callback<object>(entity =>
            {
                switch (entity)
                {
                    case LoveMemory memory: Memories.Remove(memory); break;
                    case ConnectionStatus status: statuses.Remove(status.UserId); break;
                }
            });
            Repo.Setup(r => r.Save(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
            var transaction = new Mock<IDbContextTransaction>();
            transaction.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
            transaction.Setup(t => t.DisposeAsync()).Returns(ValueTask.CompletedTask);
            Repo.Setup(r => r.LockCouple(Couple.Id, It.IsAny<CancellationToken>())).ReturnsAsync(transaction.Object);
            Couples = new CoupleService(Repo.Object, Clock, TimeZoneInfo.Utc);
            Gardens = new GardenService(Repo.Object, Couples, Clock);
        }
    }
}
