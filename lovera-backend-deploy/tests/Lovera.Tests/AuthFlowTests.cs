using Lovera.Repository;
using Lovera.Service;
using Xunit;

namespace Lovera.Tests;
public sealed class AuthFlowTests
{
    [Fact]
    public async Task Register_verify_login_profile_logout_flow()
    {
        var repo = new MemoryUsers(); var mail = new MemoryMail(); var clock = new TestClock();
        var service = new AuthService(repo, mail, clock, new MemoryAvatars(), new string('p', 32));
        await service.Register(new("A@Example.com", "long-secure-password", " Alice "), default);
        Assert.Equal("a@example.com", mail.Address);
        Assert.NotEqual("long-secure-password", repo.User!.PasswordHash);
        Assert.False(repo.User.EmailVerified);
        var blocked = await Assert.ThrowsAsync<AppProblem>(() => service.Login(new("a@example.com", "long-secure-password"), default));
        Assert.Equal("email_unverified", blocked.Code);
        await service.Verify(new("a@example.com", mail.Code!), default);
        var login = await service.Login(new("a@example.com", "long-secure-password"), default);
        Assert.Equal(repo.User.Id, (await service.Authenticate(login.AccessToken, default))!.UserId);
        var profile = await service.UpdateProfile(repo.User.Id, new("Alice B", "https://example.com/avatar.png"), default);
        Assert.Equal("Alice B", (await service.GetProfile(repo.User.Id, default)).DisplayName);
        Assert.Equal("https://example.com/avatar.png", profile.AvatarUrl);
        await service.Logout((await service.Authenticate(login.AccessToken, default))!, default);
        Assert.Null(await service.Authenticate(login.AccessToken, default));
    }
    [Fact]
    public async Task Duplicate_email_wrong_password_and_invalid_avatar_have_clear_codes()
    {
        var repo = new MemoryUsers(); var mail = new MemoryMail(); var service = new AuthService(repo, mail, new TestClock(), new MemoryAvatars(), new string('p', 32));
        await service.Register(new("A@Example.com", "long-secure-password", "Alice"), default);
        Assert.Equal("email_exists", (await Assert.ThrowsAsync<AppProblem>(() => service.Register(new("a@example.com", "another-password", "Bob"), default))).Code);
        Assert.Equal("invalid_credentials", (await Assert.ThrowsAsync<AppProblem>(() => service.Login(new("a@example.com", "wrong-password"), default))).Code);
        Assert.Equal("invalid_avatar_url", (await Assert.ThrowsAsync<AppProblem>(() => service.UpdateProfile(repo.User!.Id, new("Alice", "http://example.com/a"), default))).Code);
    }
    [Fact]
    public async Task Otp_expires_and_five_wrong_attempts_exhaust_it()
    {
        var repo = new MemoryUsers(); var mail = new MemoryMail(); var clock = new TestClock(); var service = new AuthService(repo, mail, clock, new MemoryAvatars(), new string('p', 32));
        await service.Register(new("a@example.com", "long-secure-password", "Alice"), default);
        for (var i = 0; i < 5; i++) await Assert.ThrowsAsync<AppProblem>(() => service.Verify(new("a@example.com", "999999" == mail.Code ? "888888" : "999999"), default));
        Assert.Equal("invalid_code", (await Assert.ThrowsAsync<AppProblem>(() => service.Verify(new("a@example.com", mail.Code!), default))).Code);
        clock.UtcNow = clock.UtcNow.AddMinutes(11);
        await service.Resend("a@example.com", default);
        clock.UtcNow = clock.UtcNow.AddMinutes(11);
        Assert.Equal("invalid_code", (await Assert.ThrowsAsync<AppProblem>(() => service.Verify(new("a@example.com", mail.Code!), default))).Code);
    }
    [Fact]
    public async Task Five_bad_passwords_temporarily_lock_account()
    {
        var repo = new MemoryUsers(); var mail = new MemoryMail(); var clock = new TestClock(); var service = new AuthService(repo, mail, clock, new MemoryAvatars(), new string('p', 32));
        await service.Register(new("a@example.com", "long-secure-password", "Alice"), default);
        await service.Verify(new("a@example.com", mail.Code!), default);
        for (var i = 0; i < 5; i++) await Assert.ThrowsAsync<AppProblem>(() => service.Login(new("a@example.com", "bad"), default));
        Assert.Equal("login_locked", (await Assert.ThrowsAsync<AppProblem>(() => service.Login(new("a@example.com", "long-secure-password"), default))).Code);
        clock.UtcNow = clock.UtcNow.AddMinutes(16);
        Assert.NotNull((await service.Login(new("a@example.com", "long-secure-password"), default)).AccessToken);
    }
    [Fact]
    public async Task Uploaded_avatar_is_available_only_for_the_user_and_can_be_cleared()
    {
        var repo = new MemoryUsers(); var mail = new MemoryMail(); var avatars = new MemoryAvatars();
        var service = new AuthService(repo, mail, new TestClock(), avatars, new string('p', 32));
        await service.Register(new("a@example.com", "long-secure-password", "Alice"), default);
        var bytes = new byte[] { 137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3 };
        var profile = await service.UploadAvatar(repo.User!.Id, new MemoryStream(bytes), default);
        Assert.Equal(AuthService.UploadedAvatarPath, profile.AvatarUrl);
        var file = await service.ReadAvatar(repo.User.Id, default);
        Assert.Equal("image/png", file.ContentType);
        Assert.Equal(bytes, file.Bytes);
        Assert.Equal("not_found", (await Assert.ThrowsAsync<AppProblem>(() => service.ReadAvatar(Guid.NewGuid(), default))).Code);
        await service.UpdateProfile(repo.User.Id, new("Alice", null), default);
        Assert.Equal("avatar_not_found", (await Assert.ThrowsAsync<AppProblem>(() => service.ReadAvatar(repo.User.Id, default))).Code);
        Assert.Null(avatars.Bytes);
    }
    [Fact]
    public async Task Avatar_upload_rejects_invalid_format_and_large_file()
    {
        var repo = new MemoryUsers(); var mail = new MemoryMail();
        var service = new AuthService(repo, mail, new TestClock(), new MemoryAvatars(), new string('p', 32));
        await service.Register(new("a@example.com", "long-secure-password", "Alice"), default);
        Assert.Equal("invalid_avatar_file", (await Assert.ThrowsAsync<AppProblem>(() => service.UploadAvatar(repo.User!.Id, new MemoryStream("not an image"u8.ToArray()), default))).Code);
        var large = new byte[5 * 1024 * 1024 + 1];
        Assert.Equal("avatar_too_large", (await Assert.ThrowsAsync<AppProblem>(() => service.UploadAvatar(repo.User!.Id, new MemoryStream(large), default))).Code);
    }
    private sealed class MemoryAvatars : IAvatarStorage
    {
        public byte[]? Bytes;
        public Task Save(Guid userId, byte[] bytes, CancellationToken ct) { Bytes = bytes; return Task.CompletedTask; }
        public Task<byte[]?> Read(Guid userId, CancellationToken ct) => Task.FromResult(Bytes);
        public Task Delete(Guid userId, CancellationToken ct) { Bytes = null; return Task.CompletedTask; }
    }
    private sealed class TestClock : IClock { public DateTime UtcNow { get; set; } = new(2026, 9, 23, 0, 0, 0, DateTimeKind.Utc); }
    private sealed class MemoryMail : IVerificationMail
    {
        public string? Address, Code;
        public Task Send(string email, string code, CancellationToken ct) { Address = email; Code = code; return Task.CompletedTask; }
    }
    private sealed class MemoryUsers : IUsersRepository
    {
        public UserAccount? User;
        private readonly List<VerificationCode> codes = [];
        private readonly List<UserSession> sessions = [];
        public Task<UserAccount?> FindByEmail(string email, CancellationToken ct) => Task.FromResult(User?.Email == email ? User : null);
        public Task<UserAccount?> FindById(Guid id, CancellationToken ct) => Task.FromResult(User?.Id == id ? User : null);
        public Task<UserSession?> FindSession(string hash, CancellationToken ct) => Task.FromResult(sessions.SingleOrDefault(x => x.TokenHash == hash));
        public Task<VerificationCode?> LatestCode(Guid userId, CancellationToken ct) => Task.FromResult(codes.Where(x => x.UserId == userId && x.ConsumedAtUtc is null).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefault());
        public void AddUser(UserAccount user) => User = user;
        public void AddCode(VerificationCode code) => codes.Add(code);
        public void AddSession(UserSession session) { session.User = User!; sessions.Add(session); }
        public Task Save(CancellationToken ct) => Task.CompletedTask;
    }
}
