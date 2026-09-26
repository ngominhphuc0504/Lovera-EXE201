using Microsoft.EntityFrameworkCore;

namespace Lovera.Repository;
public interface IUsersRepository
{
    Task<UserAccount?> FindByEmail(string email, CancellationToken ct);
    Task<UserAccount?> FindById(Guid id, CancellationToken ct);
    Task<UserSession?> FindSession(string tokenHash, CancellationToken ct);
    Task<VerificationCode?> LatestCode(Guid userId, CancellationToken ct);
    void AddUser(UserAccount user);
    void AddCode(VerificationCode code);
    void AddSession(UserSession session);
    Task Save(CancellationToken ct);
}
public sealed class UsersRepository(LoveraDbContext db) : IUsersRepository
{
    public Task<UserAccount?> FindByEmail(string email, CancellationToken ct) => db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
    public Task<UserAccount?> FindById(Guid id, CancellationToken ct) => db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
    public Task<UserSession?> FindSession(string tokenHash, CancellationToken ct) => db.Sessions.Include(x => x.User).SingleOrDefaultAsync(x => x.TokenHash == tokenHash, ct);
    public Task<VerificationCode?> LatestCode(Guid userId, CancellationToken ct) => db.VerificationCodes.Where(x => x.UserId == userId && x.ConsumedAtUtc == null).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(ct);
    public void AddUser(UserAccount user) => db.Users.Add(user);
    public void AddCode(VerificationCode code) => db.VerificationCodes.Add(code);
    public void AddSession(UserSession session) => db.Sessions.Add(session);
    public Task Save(CancellationToken ct) => db.SaveChangesAsync(ct);
}
