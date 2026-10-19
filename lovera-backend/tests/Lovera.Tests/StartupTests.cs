using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Lovera.Tests;

public sealed class StartupTests
{
    [Fact]
    public void Api_refuses_to_start_without_postgresql()
    {
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(webHost => webHost
                .UseSetting("ConnectionStrings:Default", "Host=127.0.0.1;Port=1;Database=unused;Username=unused;Password=unused;Timeout=1")
                .UseSetting("Otp:Pepper", new string('x', 32))
                .UseSetting("Database:SkipStartupCheck", "false"));
        var error = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());
        Assert.Contains("PostgreSQL", error.Message);
    }

    [Fact]
    public async Task Admin_can_disable_public_registration()
    {
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(webHost => webHost
                .UseSetting("ConnectionStrings:Default", "Host=localhost;Database=unused;Username=unused;Password=unused")
                .UseSetting("Otp:Pepper", new string('x', 32))
                .UseSetting("Database:SkipStartupCheck", "true")
                .UseSetting("Auth:AllowPublicRegistration", "false"));
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "user@example.com", password = "abcdef", displayName = "User"
        });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Contains("registration_disabled", await response.Content.ReadAsStringAsync());
    }
}
