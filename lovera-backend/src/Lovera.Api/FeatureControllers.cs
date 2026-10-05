using System.Security.Claims;
using Lovera.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Lovera.Api;

public abstract class LoveraController : ControllerBase
{
    protected Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

public sealed record JoinPairingRequest(string Code);
public sealed record UnpairRequest(bool Confirmed);
public sealed record SetLoveStartRequest(DateOnly StartDate);

[ApiController]
[Authorize(Policy = "VerifiedEmail")]
[Route("api/couples")]
public sealed class CouplesController(CoupleService couples, IConfiguration config) : LoveraController
{
    [HttpGet("me")]
    public Task<PairingStatusResponse> Status(CancellationToken ct) => couples.Status(UserId, ct);

    [HttpPost("pairing-codes"), EnableRateLimiting("auth")]
    public Task<PairingCodeResponse> CreateCode(CancellationToken ct) =>
        couples.CreateInvitation(UserId, config.GetValue("Pairing:CodeHours", 24), ct);

    [HttpPost("join"), EnableRateLimiting("auth")]
    public Task<CoupleResponse> Join(JoinPairingRequest request, CancellationToken ct) => couples.Join(UserId, request.Code, ct);

    [HttpPost("unpair")]
    public async Task<IActionResult> Unpair(UnpairRequest request, CancellationToken ct)
    {
        await couples.Unpair(UserId, request.Confirmed, ct);
        return NoContent();
    }

    [HttpGet("love-days")]
    public Task<LoveDaysResponse> LoveDays(CancellationToken ct) => couples.GetLoveDays(UserId, ct);

    [HttpPut("love-days")]
    public Task<LoveDaysResponse> SetLoveDays(SetLoveStartRequest request, CancellationToken ct) =>
        couples.SetStartDate(UserId, request.StartDate, ct);
}

[ApiController]
[Authorize]
[Route("api/garden")]
public sealed class GardenController(GardenService garden) : LoveraController
{
    [HttpGet]
    public Task<GardenResponse> Get(CancellationToken ct) => garden.Get(UserId, ct);
    [HttpPost("check-in")]
    public Task<GardenResponse> CheckIn(CancellationToken ct) => garden.CheckInToday(UserId, ct);
    [HttpPost("care")]
    public Task<GardenResponse> Care(CancellationToken ct) => garden.Care(UserId, ct);
    [HttpGet("points")]
    public Task<IReadOnlyList<PointHistoryItem>> History(CancellationToken ct) => garden.History(UserId, ct);
}

[ApiController]
[Authorize]
[Route("api/connection-status")]
public sealed class ConnectionStatusController(ConnectionStatusService statuses) : LoveraController
{
    [HttpGet("me")]
    public Task<ConnectionStatusResponse> Mine(CancellationToken ct) => statuses.Mine(UserId, ct);
    [HttpGet("partner")]
    public Task<ConnectionStatusResponse> Partner(CancellationToken ct) => statuses.Partner(UserId, ct);
    [HttpPut("me")]
    public Task<ConnectionStatusResponse> Set(SetConnectionStatusRequest request, CancellationToken ct) => statuses.Set(UserId, request, ct);
    [HttpDelete("me")]
    public Task<ConnectionStatusResponse> Clear(CancellationToken ct) => statuses.Clear(UserId, ct);
}

[ApiController]
[Authorize]
[Route("api/memories")]
public sealed class MemoriesController(MemoryService memories) : LoveraController
{
    [HttpGet]
    public Task<IReadOnlyList<MemoryResponse>> Timeline(CancellationToken ct) => memories.Timeline(UserId, ct);

    [HttpPost, Consumes("multipart/form-data"), RequestSizeLimit(MemoryService.MaxImageBytes + 65536)]
    public Task<MemoryResponse> Create([FromForm] string? text, IFormFile? image, CancellationToken ct) =>
        memories.Create(UserId, text, image?.OpenReadStream(), ct);

    [HttpGet("{id:guid}/image")]
    public async Task<IActionResult> Image(Guid id, CancellationToken ct)
    {
        var image = await memories.Image(UserId, id, ct);
        Response.Headers["Cache-Control"] = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(image.Bytes, image.ContentType);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await memories.Delete(UserId, id, ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/date-plans")]
public sealed class DatePlansController(DatePlanService plans) : LoveraController
{
    [HttpPost("generate"), EnableRateLimiting("auth")]
    public Task<DatePlanGenerationResponse> Generate(GenerateDatePlanRequest request, CancellationToken ct) =>
        plans.Generate(UserId, request, ct);
    [HttpGet]
    public Task<IReadOnlyList<DatePlanResponse>> Saved(CancellationToken ct) => plans.SavedPlans(UserId, ct);
    [HttpGet("{id:guid}")]
    public Task<DatePlanResponse> Get(Guid id, CancellationToken ct) => plans.Get(UserId, id, ct);
    [HttpPost("{id:guid}/save")]
    public Task<DatePlanResponse> Save(Guid id, CancellationToken ct) => plans.Save(UserId, id, ct);
    [HttpPost("{id:guid}/complete")]
    public Task<DatePlanResponse> Complete(Guid id, CancellationToken ct) => plans.Complete(UserId, id, ct);
}
