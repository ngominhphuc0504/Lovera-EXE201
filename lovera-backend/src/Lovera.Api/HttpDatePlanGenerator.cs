using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Lovera.Service;

namespace Lovera.Api;

// A configurable Chat Completions adapter. It never sends the credential or raw response to logs.
public sealed class HttpDatePlanGenerator(HttpClient http, IConfiguration config) : IDatePlanGenerator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<GeneratedDatePlan?> Generate(GenerateDatePlanRequest input, CancellationToken ct)
    {
        var endpoint = config["Ai:ChatCompletionsUrl"];
        var model = config["Ai:Model"];
        var key = config["Ai:ApiKey"];
        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(model) || string.IsNullOrWhiteSpace(key))
            return null;

        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && uri.Host is not ("localhost" or "127.0.0.1")))
            throw new InvalidOperationException("Ai:ChatCompletionsUrl must be HTTPS or a local test endpoint.");

        var userContent = JsonSerializer.Serialize(new
        {
            budgetVnd = input.Budget,
            scheduledAt = input.ScheduledAt,
            location = input.Location,
            foodPreference = input.FoodPreference,
            activityPreference = input.ActivityPreference
        }, JsonOptions);
        var payload = JsonSerializer.Serialize(new
        {
            model,
            store = false,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = "Return only a JSON object with an items array. Each item has placeName, address, activity, startsAt (ISO 8601 with timezone), durationMinutes, estimatedCost (VND number). Suggest 1 to 10 realistic date activities near the requested location, aligned to the selected time and preferences. Total estimatedCost must not exceed budgetVnd. Do not claim confirmed booking, live opening hours, or verified prices." },
                new { role = "user", content = userContent }
            }
        }, JsonOptions);

        using var request = new HttpRequestMessage(HttpMethod.Post, uri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
        request.Content = new StringContent(payload, Encoding.UTF8, "application/json");
        using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        if (document.RootElement.ValueKind != JsonValueKind.Object ||
            !document.RootElement.TryGetProperty("choices", out var choices) ||
            choices.ValueKind != JsonValueKind.Array || choices.GetArrayLength() == 0 ||
            choices[0].ValueKind != JsonValueKind.Object ||
            !choices[0].TryGetProperty("message", out var message) ||
            message.ValueKind != JsonValueKind.Object ||
            !message.TryGetProperty("content", out var contentElement) ||
            contentElement.ValueKind != JsonValueKind.String) return null;
        var content = contentElement.GetString();
        if (string.IsNullOrWhiteSpace(content)) return null;
        var plan = JsonSerializer.Deserialize<GeneratedDatePlan>(content, JsonOptions);
        return plan?.Items is { Count: > 0 } ? plan : null;
    }
}
