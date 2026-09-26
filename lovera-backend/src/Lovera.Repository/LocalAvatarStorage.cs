namespace Lovera.Repository;

public interface IAvatarStorage
{
    Task Save(Guid userId, byte[] bytes, CancellationToken ct);
    Task<byte[]?> Read(Guid userId, CancellationToken ct);
    Task Delete(Guid userId, CancellationToken ct);
}

public sealed class LocalAvatarStorage(string directory) : IAvatarStorage
{
    private readonly string directory = Path.GetFullPath(directory);
    private string PathFor(Guid userId) => Path.Combine(directory, userId.ToString("N"));

    public async Task Save(Guid userId, byte[] bytes, CancellationToken ct)
    {
        Directory.CreateDirectory(directory);
        var temp = Path.Combine(directory, $".{userId:N}.{Guid.NewGuid():N}.tmp");
        try
        {
            await File.WriteAllBytesAsync(temp, bytes, ct);
            File.Move(temp, PathFor(userId), true);
        }
        finally { if (File.Exists(temp)) File.Delete(temp); }
    }
    public async Task<byte[]?> Read(Guid userId, CancellationToken ct)
    {
        var path = PathFor(userId);
        return File.Exists(path) ? await File.ReadAllBytesAsync(path, ct) : null;
    }
    public Task Delete(Guid userId, CancellationToken ct)
    {
        File.Delete(PathFor(userId));
        return Task.CompletedTask;
    }
}
