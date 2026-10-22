using System.Net;
using System.Net.Http.Json;
using Lovera.Service;

namespace Lovera.Api;

public sealed class BrevoVerificationMail(
    HttpClient http,
    IConfiguration config,
    ILogger<BrevoVerificationMail> logger) : IVerificationMail
{
    public Task Send(string email, string code, CancellationToken ct) =>
        SendCore(
            email,
            "LOVERA - Xác thực email",
            $"Mã xác thực email: {code}\nMã hết hạn sau 10 phút.",
            ct);

    public async Task SendPasswordReset(
        string email, string code, CancellationToken ct)
    {
        try
        {
            await SendCore(
                email,
                "LOVERA - Đặt lại mật khẩu",
                $"Mã đặt lại mật khẩu: {code}\nMã hết hạn sau 10 phút.",
                ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            // Không tiết lộ email nào có tài khoản; không ghi OTP hoặc API key vào log.
            logger.LogWarning(
                "Password reset email delivery failed ({ErrorType}).",
                ex.GetType().Name);
        }
    }

    private async Task SendCore(
        string email, string subject, string body, CancellationToken ct)
    {
        var apiKey = config["Brevo:ApiKey"];
        var from = config["Brevo:From"];

        if (string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(from))
            throw EmailUnavailable();

        using var request = new HttpRequestMessage(
            HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");

        request.Headers.Add("api-key", apiKey);
        request.Content = JsonContent.Create(new
        {
            sender = new { email = from, name = "LOVERA" },
            to = new[] { new { email } },
            subject,
            textContent = body,
            htmlContent = "<p>" +
                WebUtility.HtmlEncode(body).Replace("\n", "<br>") +
                "</p>"
        });

        try
        {
            using var response = await http.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
                throw EmailUnavailable();
        }
        catch (HttpRequestException)
        {
            throw EmailUnavailable();
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            throw EmailUnavailable();
        }
    }

    private static AppProblem EmailUnavailable() =>
        new(503, "email_unavailable",
            "Không gửi được email. Vui lòng thử lại sau.");
}