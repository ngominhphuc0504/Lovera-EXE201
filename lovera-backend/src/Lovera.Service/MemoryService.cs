using Lovera.Repository;

namespace Lovera.Service;

public sealed record MemoryResponse(Guid Id, Guid CoupleId, Guid CreatorUserId, string? Text,
    bool HasImage, string? ImageUrl, DateTime CreatedAtUtc);
public sealed record MemoryImage(byte[] Bytes, string ContentType);

public sealed class MemoryService(IFeatureRepository repo, CoupleService couples, GardenService garden, IClock clock)
{
    public const int MaxImageBytes = 5 * 1024 * 1024;

    public async Task<MemoryResponse> Create(Guid userId, string? text, Stream? image, CancellationToken ct)
    {
        var cleaned = string.IsNullOrWhiteSpace(text) ? null : text.Trim();
        if (cleaned?.Length > 5000) throw new AppProblem(400, "memory_text_too_long", "Ghi chú tối đa 5000 ký tự.");
        byte[]? bytes = null;
        string? contentType = null;
        if (image is not null)
        {
            await using var buffer = new MemoryStream();
            var chunk = new byte[81920];
            int read;
            while ((read = await image.ReadAsync(chunk, ct)) > 0)
            {
                if (buffer.Length + read > MaxImageBytes)
                    throw new AppProblem(400, "memory_image_too_large", "Ảnh không được vượt quá 5MB.");
                await buffer.WriteAsync(chunk.AsMemory(0, read), ct);
            }
            bytes = buffer.ToArray();
            contentType = DetectImageType(bytes) ?? throw new AppProblem(400, "invalid_memory_image", "Ảnh phải là PNG, JPEG hoặc WebP hợp lệ.");
        }
        if (cleaned is null && bytes is null)
            throw new AppProblem(400, "empty_memory", "Kỷ niệm cần có ghi chú hoặc ảnh.");
        var couple = await couples.RequireCouple(userId, ct);
        await using var tx = await repo.LockCouple(couple.Id, ct);
        var now = clock.UtcNow;
        var memory = new LoveMemory { CoupleId = couple.Id, CreatorUserId = userId, Text = cleaned,
            ImageBytes = bytes, ImageContentType = contentType, CreatedAtUtc = now };
        repo.Add(memory);
        var today = couples.LocalDay(now);
        if (!await repo.HasPointEvent(couple.Id, GardenService.MemorySaved, today, null, ct))
            await garden.AwardLocked(couple.Id, userId, GardenService.MemorySaved, 10, memory.Id, ct);
        await repo.Save(ct);
        await tx.CommitAsync(ct);
        return ToResponse(memory);
    }

    public async Task<IReadOnlyList<MemoryResponse>> Timeline(Guid userId, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var items = await repo.Memories(couple.Id, 100, ct);
        return items.Select(m => new MemoryResponse(m.Id, m.CoupleId, m.CreatorUserId,
            m.Text, m.HasImage, m.HasImage ? $"/api/memories/{m.Id}/image" : null, m.CreatedAtUtc)).ToArray();
    }

    public async Task<MemoryImage> Image(Guid userId, Guid id, CancellationToken ct)
    {
        var memory = await RequireAccessible(userId, id, ct);
        if (memory.ImageBytes is null || memory.ImageContentType is null)
            throw new AppProblem(404, "image_not_found", "Kỷ niệm không có ảnh.");
        return new MemoryImage(memory.ImageBytes, memory.ImageContentType);
    }

    public async Task Delete(Guid userId, Guid id, CancellationToken ct)
    {
        var memory = await RequireAccessible(userId, id, ct);
        // Earned points remain in the ledger; deleting and recreating a memory cannot earn them again.
        repo.Remove(memory);
        await repo.Save(ct);
    }

    private async Task<LoveMemory> RequireAccessible(Guid userId, Guid id, CancellationToken ct)
    {
        var couple = await couples.RequireCouple(userId, ct);
        var memory = await repo.Memory(id, ct);
        return memory is { } && memory.CoupleId == couple.Id ? memory :
            throw new AppProblem(404, "memory_not_found", "Không tìm thấy kỷ niệm.");
    }

    private static MemoryResponse ToResponse(LoveMemory memory) => new(memory.Id, memory.CoupleId,
        memory.CreatorUserId, memory.Text, memory.ImageBytes is not null,
        memory.ImageBytes is null ? null : $"/api/memories/{memory.Id}/image", memory.CreatedAtUtc);

    private static string? DetectImageType(ReadOnlySpan<byte> data)
    {
        if (data.Length >= 8 && data[..8].SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (data.Length >= 3 && data[0] == 255 && data[1] == 216 && data[2] == 255) return "image/jpeg";
        if (data.Length >= 12 && data[..4].SequenceEqual("RIFF"u8) && data.Slice(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
}
