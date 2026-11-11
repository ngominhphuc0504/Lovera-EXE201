using System.Security.Claims;
using System.Threading.RateLimiting;

namespace Lovera.Api;

public static class RateLimitPolicies
{
    public static RateLimitPartition<string> Fixed(
        HttpContext context,
        string policy,
        int permitLimit,
        TimeSpan window,
        bool preferAuthenticatedUser = true)
    {
        var userId = context.User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var identity = preferAuthenticatedUser &&
                       !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : $"ip:{ClientAddress.Get(context)}";

        return RateLimitPartition.GetFixedWindowLimiter(
            $"{policy}:{identity}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = window,
                QueueLimit = 0,
                AutoReplenishment = true
            });
    }
}