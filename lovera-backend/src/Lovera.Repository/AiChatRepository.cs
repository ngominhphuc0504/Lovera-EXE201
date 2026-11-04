using Microsoft.EntityFrameworkCore;

namespace Lovera.Repository;

public interface IAiChatRepository
{
    Task<AiConversation?> Conversation(Guid id, CancellationToken ct);
    Task<IReadOnlyList<AiConversation>> Conversations(Guid coupleId, int take, CancellationToken ct);
    Task<IReadOnlyList<AiMessage>> Messages(Guid conversationId, int take, CancellationToken ct);
    void Add(object entity);
    Task Save(CancellationToken ct);
}

public sealed class AiChatRepository(LoveraDbContext db) : IAiChatRepository
{
    public Task<AiConversation?> Conversation(Guid id, CancellationToken ct) =>
        db.AiConversations.SingleOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<AiConversation>> Conversations(
        Guid coupleId, int take, CancellationToken ct) =>
        await db.AiConversations.AsNoTracking()
            .Where(c => c.CoupleId == coupleId)
            .OrderByDescending(c => c.UpdatedAtUtc)
            .Take(take)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<AiMessage>> Messages(
        Guid conversationId, int take, CancellationToken ct)
    {
        var newest = await db.AiMessages.AsNoTracking()
            .Include(m => m.Sources)
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAtUtc)
            .ThenByDescending(m => m.Id)
            .Take(take)
            .ToListAsync(ct);

        newest.Reverse();
        return newest;
    }

    public void Add(object entity) => db.Add(entity);
    public Task Save(CancellationToken ct) => db.SaveChangesAsync(ct);
}