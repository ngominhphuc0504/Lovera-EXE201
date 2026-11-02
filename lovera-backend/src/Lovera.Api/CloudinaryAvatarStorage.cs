using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Lovera.Repository;
using Lovera.Service;

namespace Lovera.Api;

public sealed class CloudinaryAvatarStorage(
    HttpClient http,
    IConfiguration config) : IAvatarStorage
{
    private const int MaxAvatarBytes = 5 * 1024 * 1024;

    private string CloudName => Required("Cloudinary:CloudName");
    private string ApiKey => Required("Cloudinary:ApiKey");
    private string ApiSecret => Required("Cloudinary:ApiSecret");

    private string Required(string key) =>
        !string.IsNullOrWhiteSpace(config[key])
            ? config[key]!
            : throw Unavailable();

    private string ApiBase =>
        $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(CloudName)}";

    private static string PublicId(Guid userId) =>
        $"lovera_avatar_{userId:N}";

    private HttpRequestMessage Authorized(HttpMethod method, string url)
    {
        var request = new HttpRequestMessage(method, url);
        var credentials = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{ApiKey}:{ApiSecret}"));
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);
        return request;
    }

    private async Task<HttpResponseMessage> Send(
        HttpRequestMessage request, CancellationToken ct)
    {
        try
        {
            return await http.SendAsync(
                request, HttpCompletionOption.ResponseHeadersRead, ct);
        }
        catch (HttpRequestException)
        {
            throw Unavailable();
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            throw Unavailable();
        }
    }

    public async Task Save(Guid userId, byte[] bytes, CancellationToken ct)
    {
        var extension = bytes.Length >= 8 && bytes[0] == 137
            ? "png"
            : bytes.Length >= 12 &&
              bytes[0] == (byte)'R' && bytes[1] == (byte)'I'
                ? "webp"
                : "jpg";

        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(
            extension == "jpg" ? "image/jpeg" : $"image/{extension}");

        form.Add(file, "file", $"avatar.{extension}");
        form.Add(new StringContent(PublicId(userId)), "public_id");
        form.Add(new StringContent("true"), "overwrite");
        form.Add(new StringContent("true"), "invalidate");

        using var request = Authorized(
            HttpMethod.Post, $"{ApiBase}/image/upload");
        request.Content = form;

        using var response = await Send(request, ct);
        if (!response.IsSuccessStatusCode)
            throw Unavailable();

        await using var responseStream =
            await response.Content.ReadAsStreamAsync(ct);
        using var json = await JsonDocument.ParseAsync(
            responseStream, cancellationToken: ct);

        if (!json.RootElement.TryGetProperty(
                "public_id", out var returnedId) ||
            returnedId.GetString() != PublicId(userId))
            throw Unavailable();
    }

    public async Task<byte[]?> Read(Guid userId, CancellationToken ct)
    {
        using var detailsRequest = Authorized(
            HttpMethod.Get,
            $"{ApiBase}/resources/image/upload/{PublicId(userId)}");

        using var detailsResponse = await Send(detailsRequest, ct);
        if (detailsResponse.StatusCode == HttpStatusCode.NotFound)
            return null;
        if (!detailsResponse.IsSuccessStatusCode)
            throw Unavailable();

        await using var detailsStream =
            await detailsResponse.Content.ReadAsStreamAsync(ct);
        using var json = await JsonDocument.ParseAsync(
            detailsStream, cancellationToken: ct);

        if (!json.RootElement.TryGetProperty(
                "secure_url", out var urlValue) ||
            !Uri.TryCreate(
                urlValue.GetString(), UriKind.Absolute, out var url) ||
            url.Scheme != Uri.UriSchemeHttps ||
            !url.Host.Equals(
                "res.cloudinary.com",
                StringComparison.OrdinalIgnoreCase))
            throw Unavailable();

        using var imageRequest =
            new HttpRequestMessage(HttpMethod.Get, url);
        using var imageResponse = await Send(imageRequest, ct);

        if (!imageResponse.IsSuccessStatusCode ||
            imageResponse.Content.Headers.ContentLength > MaxAvatarBytes)
            throw Unavailable();

        await using var imageStream =
            await imageResponse.Content.ReadAsStreamAsync(ct);
        using var output = new MemoryStream();
        var buffer = new byte[81920];
        int count;

        while ((count = await imageStream.ReadAsync(buffer, ct)) > 0)
        {
            if (output.Length + count > MaxAvatarBytes)
                throw Unavailable();
            await output.WriteAsync(buffer.AsMemory(0, count), ct);
        }

        return output.ToArray();
    }

    public async Task Delete(Guid userId, CancellationToken ct)
    {
        using var request = Authorized(
            HttpMethod.Post, $"{ApiBase}/image/destroy");

        request.Content = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["public_id"] = PublicId(userId),
                ["invalidate"] = "true"
            });

        using var response = await Send(request, ct);
        if (!response.IsSuccessStatusCode)
            throw Unavailable();
    }

    private static AppProblem Unavailable() =>
        new(503, "avatar_storage_unavailable",
            "Không truy cập được nơi lưu avatar. Vui lòng thử lại sau.");
}