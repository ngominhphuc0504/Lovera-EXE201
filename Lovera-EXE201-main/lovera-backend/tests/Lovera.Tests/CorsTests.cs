using System.Net;
using Lovera.Api;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Lovera.Tests;

public sealed class CorsTests
{
    [Fact]
    public async Task Preflight_allows_only_configured_frontend_origin()
    {
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(webHost => webHost
                .UseSetting("ConnectionStrings:Default", "Host=localhost;Database=unused;Username=unused;Password=unused")
                .UseSetting("Otp:Pepper", new string('x', 32))
                .UseSetting("Cors:AllowedOrigins", "https://app.example.com"));
        using var client = factory.CreateClient();

        using var allowed = await client.SendAsync(Preflight("https://app.example.com"));
        Assert.Equal(HttpStatusCode.NoContent, allowed.StatusCode);
        Assert.Equal("https://app.example.com", allowed.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.Contains("POST", allowed.Headers.GetValues("Access-Control-Allow-Methods").Single());

        using var denied = await client.SendAsync(Preflight("https://other.example.com"));
        Assert.False(denied.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private static HttpRequestMessage Preflight(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/auth/login");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "authorization,content-type");
        return request;
    }
}
