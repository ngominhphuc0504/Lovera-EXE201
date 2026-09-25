using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Lovera.Service;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Lovera.Api;
public sealed class ProblemMiddleware(RequestDelegate next, ILogger<ProblemMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try { await next(context); }
        catch (AppProblem e) { context.Response.StatusCode = e.Status; await context.Response.WriteAsJsonAsync(new { code = e.Code, message = e.Message }); }
        catch (SmtpException) { context.Response.StatusCode = 503; await context.Response.WriteAsJsonAsync(new { code = "email_unavailable", message = "Không gửi được email. Vui lòng thử gửi lại mã sau." }); }
        catch (Exception e) { logger.LogError(e, "Request failed"); context.Response.StatusCode = 500; await context.Response.WriteAsJsonAsync(new { code = "server_error", message = "Lỗi máy chủ." }); }
    }
}
public sealed class SessionAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, AuthService service)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return AuthenticateResult.NoResult();
        var session = await service.Authenticate(header[7..].Trim(), Context.RequestAborted);
        if (session is null) return AuthenticateResult.Fail("Invalid or expired session");
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, session.UserId.ToString()), new Claim("session_id", session.Id.ToString()), new Claim("email_verified", session.User.EmailVerified ? "true" : "false") };
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name));
    }
}
public sealed class SmtpVerificationMail(IConfiguration config) : IVerificationMail
{
    public async Task Send(string email, string code, CancellationToken ct)
    {
        var host = config["Smtp:Host"] ?? throw new InvalidOperationException("Missing Smtp:Host");
        var from = config["Smtp:From"] ?? throw new InvalidOperationException("Missing Smtp:From");
        var port = int.Parse(config["Smtp:Port"] ?? "25");
        using var client = new SmtpClient(host, port) { EnableSsl = bool.Parse(config["Smtp:EnableSsl"] ?? "false") };
        if (!string.IsNullOrEmpty(config["Smtp:Username"])) client.Credentials = new NetworkCredential(config["Smtp:Username"], config["Smtp:Password"]);
        using var message = new MailMessage(from, email) { Subject = "LOVERA - Xác thực email", Body = $"Mã xác thực của bạn: {code}\nMã hết hạn sau 10 phút. Nếu bạn không đăng ký, hãy bỏ qua email này." };
        await client.SendMailAsync(message, ct);
    }
}
