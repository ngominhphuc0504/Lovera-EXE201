namespace Lovera.Api;

public static class ClientAddress
{
    public static string Get(HttpContext context)
    {
        return context.Connection.RemoteIpAddress?.ToString()
               ?? "unknown";
    }
}