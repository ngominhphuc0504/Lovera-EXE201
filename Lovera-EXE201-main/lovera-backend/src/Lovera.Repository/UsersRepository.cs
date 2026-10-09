using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Npgsql;

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
    private static readonly ConcurrentDictionary<Guid, UserAccount> MemoryUsers = new();
    private static readonly ConcurrentDictionary<string, UserSession> MemorySessions = new();
    private static readonly List<VerificationCode> MemoryCodes = new();
    private static readonly object SyncRoot = new();
    private static bool _fallbackActive = false;

    private static bool IsConnectionException(Exception ex)
    {
        return ex is NpgsqlException
            || ex is System.Net.Sockets.SocketException
            || ex is TimeoutException
            || ex.InnerException is NpgsqlException
            || ex.InnerException is System.Net.Sockets.SocketException
            || (ex is InvalidOperationException && ex.InnerException != null && IsConnectionException(ex.InnerException));
    }

    public async Task<UserAccount?> FindByEmail(string email, CancellationToken ct)
    {
        if (!_fallbackActive)
        {
            try
            {
                return await db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
            }
            catch (Exception ex) when (IsConnectionException(ex))
            {
                _fallbackActive = true;
            }
        }

        lock (SyncRoot)
        {
            return MemoryUsers.Values.SingleOrDefault(x => string.Equals(x.Email, email, StringComparison.OrdinalIgnoreCase));
        }
    }

    public async Task<UserAccount?> FindById(Guid id, CancellationToken ct)
    {
        if (!_fallbackActive)
        {
            try
            {
                return await db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
            }
            catch (Exception ex) when (IsConnectionException(ex))
            {
                _fallbackActive = true;
            }
        }

        lock (SyncRoot)
        {
            MemoryUsers.TryGetValue(id, out var user);
            return user;
        }
    }

    public async Task<UserSession?> FindSession(string tokenHash, CancellationToken ct)
    {
        if (!_fallbackActive)
        {
            try
            {
                return await db.Sessions.Include(x => x.User).SingleOrDefaultAsync(x => x.TokenHash == tokenHash, ct);
            }
            catch (Exception ex) when (IsConnectionException(ex))
            {
                _fallbackActive = true;
            }
        }

        lock (SyncRoot)
        {
            if (MemorySessions.TryGetValue(tokenHash, out var session))
            {
                if (session.User is null && MemoryUsers.TryGetValue(session.UserId, out var user))
                {
                    session.User = user;
                }
                return session;
            }
            return null;
        }
    }

    public async Task<VerificationCode?> LatestCode(Guid userId, CancellationToken ct)
    {
        if (!_fallbackActive)
        {
            try
            {
                return await db.VerificationCodes
                    .Where(x => x.UserId == userId && x.ConsumedAtUtc == null)
                    .OrderByDescending(x => x.CreatedAtUtc)
                    .FirstOrDefaultAsync(ct);
            }
            catch (Exception ex) when (IsConnectionException(ex))
            {
                _fallbackActive = true;
            }
        }

        lock (SyncRoot)
        {
            return MemoryCodes
                .Where(x => x.UserId == userId && x.ConsumedAtUtc == null)
                .OrderByDescending(x => x.CreatedAtUtc)
                .FirstOrDefault();
        }
    }

    public void AddUser(UserAccount user)
    {
        lock (SyncRoot)
        {
            MemoryUsers[user.Id] = user;
        }
        if (!_fallbackActive)
        {
            try { db.Users.Add(user); } catch { _fallbackActive = true; }
        }
    }

    public void AddCode(VerificationCode code)
    {
        lock (SyncRoot)
        {
            MemoryCodes.Add(code);
        }
        if (!_fallbackActive)
        {
            try { db.VerificationCodes.Add(code); } catch { _fallbackActive = true; }
        }
    }

    public void AddSession(UserSession session)
    {
        lock (SyncRoot)
        {
            MemorySessions[session.TokenHash] = session;
        }
        if (!_fallbackActive)
        {
            try { db.Sessions.Add(session); } catch { _fallbackActive = true; }
        }
    }

    public async Task Save(CancellationToken ct)
    {
        if (!_fallbackActive)
        {
            try
            {
                await db.SaveChangesAsync(ct);
                return;
            }
            catch (Exception ex) when (IsConnectionException(ex))
            {
                _fallbackActive = true;
            }
        }
    }
}
