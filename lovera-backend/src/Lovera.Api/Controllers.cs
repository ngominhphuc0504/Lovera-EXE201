using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Lovera.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Lovera.Api;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    AuthService service,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("register")]
    [EnableRateLimiting("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request,
        CancellationToken ct)
    {
        if (!configuration.GetValue(
                "Auth:AllowPublicRegistration",
                true))
        {
            throw new AppProblem(
                403,
                "registration_disabled",
                "Hệ thống hiện chỉ cho phép tài khoản được cấp sẵn.");
        }

        await service.Register(request, ct);

        return Ok(new
        {
            message =
                "Đã đăng ký. Hãy kiểm tra email để lấy mã OTP xác thực."
        });
    }

    [HttpPost("verify")]
    [EnableRateLimiting("otp")]
    public async Task<IActionResult> Verify(
        VerifyRequest request,
        CancellationToken ct)
    {
        await service.Verify(request, ct);
        return NoContent();
    }

    [HttpPost("resend-verification")]
    [EnableRateLimiting("email")]
    public async Task<IActionResult> Resend(
        EmailRequest request,
        CancellationToken ct)
    {
        await service.Resend(request.Email, ct);
        return Accepted();
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request,
        CancellationToken ct) =>
        Ok(await service.Login(request, ct));

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var authorization =
            Request.Headers.Authorization.ToString();

        if (!authorization.StartsWith(
                "Bearer ",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new AppProblem(
                401,
                "unauthorized",
                "Thiếu access token.");
        }

        var token =
            authorization["Bearer ".Length..].Trim();

        var session = await service.Authenticate(token, ct)
            ?? throw new AppProblem(
                401,
                "unauthorized",
                "Phiên không hợp lệ.");

        await service.Logout(session, ct);

        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("email")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken ct)
    {
        await service.RequestPasswordReset(request.Email, ct);

        return Accepted(new
        {
            message =
                "Nếu tài khoản hợp lệ, mã đặt lại mật khẩu đã được gửi tới email."
        });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("otp")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken ct)
    {
        await service.ResetPassword(request, ct);

        return Ok(new
        {
            message =
                "Đã đặt mật khẩu mới. Vui lòng đăng nhập lại."
        });
    }
}

public sealed record EmailRequest(
    [Required, EmailAddress] string Email);

[ApiController]
[Authorize]
[Route("api/profile")]
public sealed class ProfileController(
    AuthService service) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> Get(
        CancellationToken ct) =>
        Ok(await service.GetProfile(UserId, ct));

    [HttpPut("me")]
    [EnableRateLimiting("profile-write")]
    public async Task<ActionResult<ProfileResponse>> Put(
        UpdateProfileRequest request,
        CancellationToken ct) =>
        Ok(await service.UpdateProfile(
            UserId,
            request,
            ct));

    [HttpPut("me/avatar")]
    [EnableRateLimiting("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5 * 1024 * 1024 + 65536)]
    public async Task<ActionResult<ProfileResponse>> UploadAvatar(
        IFormFile file,
        CancellationToken ct)
    {
        if (file is null)
        {
            throw new AppProblem(
                400,
                "invalid_avatar_file",
                "Cần chọn ảnh avatar.");
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            throw new AppProblem(
                400,
                "avatar_too_large",
                "Ảnh avatar không được vượt quá 5MB.");
        }

        await using var stream = file.OpenReadStream();

        return Ok(await service.UploadAvatar(
            UserId,
            stream,
            ct));
    }

    [HttpGet("me/avatar")]
    public async Task<IActionResult> GetAvatar(
        CancellationToken ct)
    {
        var avatar = await service.ReadAvatar(
            UserId,
            ct);

        Response.Headers["Cache-Control"] =
            "private, max-age=300";
        Response.Headers["Vary"] =
            "Authorization";
        Response.Headers["X-Content-Type-Options"] =
            "nosniff";

        return File(
            avatar.Bytes,
            avatar.ContentType);
    }
    
    [HttpDelete("me")]
    [EnableRateLimiting("dangerous")]
    public async Task<IActionResult> DeleteMe(
        [FromBody] DeleteAccountRequest request,
        CancellationToken ct)
    {
        await service.DeleteAccount(
            UserId,
            request.Password,
            ct);

        return NoContent();
    }
}