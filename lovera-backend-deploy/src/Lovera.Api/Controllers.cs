using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Lovera.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Lovera.Api;
[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService service) : ControllerBase
{
    [HttpPost("register"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct) { await service.Register(request, ct); return Accepted(new { message = "Đã gửi mã xác thực tới email. Mã có hiệu lực 10 phút." }); }
    [HttpPost("resend-verification"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Resend(EmailRequest request, CancellationToken ct) { await service.Resend(request.Email, ct); return Accepted(new { message = "Nếu tài khoản cần xác thực, mã mới đã được gửi." }); }
    [HttpPost("verify-email"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Verify(VerifyRequest request, CancellationToken ct) { await service.Verify(request, ct); return Ok(new { message = "Email đã được xác thực." }); }
    [HttpPost("login"), EnableRateLimiting("auth")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct) => Ok(await service.Login(request, ct));
    [HttpPost("logout"), Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var token = Request.Headers.Authorization.ToString()[7..].Trim();
        var session = await service.Authenticate(token, ct) ?? throw new AppProblem(401, "unauthorized", "Phiên không hợp lệ.");
        await service.Logout(session, ct);
        return NoContent();
    }
}
public sealed record EmailRequest([Required, EmailAddress] string Email);
[ApiController]
[Authorize]
[Route("api/profile")]
public sealed class ProfileController(AuthService service) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> Get(CancellationToken ct) => Ok(await service.GetProfile(UserId, ct));
    [HttpPut("me")]
    public async Task<ActionResult<ProfileResponse>> Put(UpdateProfileRequest request, CancellationToken ct) => Ok(await service.UpdateProfile(UserId, request, ct));
    [HttpPut("me/avatar"), Consumes("multipart/form-data"), RequestSizeLimit(5 * 1024 * 1024 + 65536)]
    public async Task<ActionResult<ProfileResponse>> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        if (file is null) throw new AppProblem(400, "invalid_avatar_file", "Cần chọn ảnh avatar.");
        if (file.Length > 5 * 1024 * 1024) throw new AppProblem(400, "avatar_too_large", "Ảnh avatar không được vượt quá 5MB.");
        await using var stream = file.OpenReadStream();
        return Ok(await service.UploadAvatar(UserId, stream, ct));
    }
    [HttpGet("me/avatar")]
    public async Task<IActionResult> GetAvatar(CancellationToken ct)
    {
        var avatar = await service.ReadAvatar(UserId, ct);
        Response.Headers["Cache-Control"] = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(avatar.Bytes, avatar.ContentType);
    }
}
