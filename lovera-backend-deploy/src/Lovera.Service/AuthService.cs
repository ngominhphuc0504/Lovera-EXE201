using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using Lovera.Repository;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Lovera.Service;
public sealed record RegisterRequest([Required, EmailAddress, MaxLength(320)] string Email, [Required, MinLength(12), MaxLength(128)] string Password, [Required, MinLength(1), MaxLength(80)] string DisplayName);
public sealed record VerifyRequest([Required, EmailAddress] string Email, [Required, RegularExpression("^[0-9]{6}$")] string Code);
public sealed record LoginRequest([Required, EmailAddress] string Email, [Required, MaxLength(128)] string Password);
public sealed record UpdateProfileRequest([Required, MinLength(1), MaxLength(80)] string DisplayName, string? AvatarUrl);
public sealed record ProfileResponse(Guid Id, string Email, bool EmailVerified, string DisplayName, string? AvatarUrl);
public sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc, ProfileResponse Profile);
public sealed class AppProblem(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}
public interface IVerificationMail { Task Send(string email, string code, CancellationToken ct); }
public interface IClock { DateTime UtcNow { get; } }
public sealed class SystemClock : IClock { public DateTime UtcNow => DateTime.UtcNow; }
public sealed class AuthService(IUsersRepository users, IVerificationMail mail, IClock clock, IAvatarStorage avatars, string otpPepper)
{
    public async Task Register(RegisterRequest input, CancellationToken ct)
    {
        var email = NormalizeEmail(input.Email);
        var name = ValidateName(input.DisplayName);
        if (input.Password.Length < 12 || input.Password.Length > 128) throw new AppProblem(400, "invalid_password", "Mật khẩu phải dài 12-128 ký tự.");
        if (await users.FindByEmail(email, ct) is not null) throw new AppProblem(409, "email_exists", "Email đã được đăng ký.");
        var now = clock.UtcNow;
        var user = new UserAccount { Email = email, DisplayName = name, PasswordHash = Passwords.Hash(input.Password), CreatedAtUtc = now };
        var code = NewCode();
        users.AddUser(user);
        users.AddCode(NewVerification(user.Id, code, now));
        try { await users.Save(ct); }
        catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation }) { throw new AppProblem(409, "email_exists", "Email đã được đăng ký."); }
        await mail.Send(email, code, ct);
    }
    public async Task Resend(string address, CancellationToken ct)
    {
        var email = NormalizeEmail(address);
        var user = await users.FindByEmail(email, ct);
        if (user is null || user.EmailVerified) return;
        var now = clock.UtcNow;
        var previous = await users.LatestCode(user.Id, ct);
        if (previous is not null && now - previous.CreatedAtUtc < TimeSpan.FromSeconds(60)) throw new AppProblem(429, "resend_too_soon", "Vui lòng đợi 60 giây trước khi gửi lại mã.");
        if (previous is not null) previous.ConsumedAtUtc = now;
        var code = NewCode();
        users.AddCode(NewVerification(user.Id, code, now));
        await users.Save(ct);
        await mail.Send(email, code, ct);
    }
    public async Task Verify(VerifyRequest input, CancellationToken ct)
    {
        var user = await users.FindByEmail(NormalizeEmail(input.Email), ct);
        if (user is null) throw InvalidCode();
        if (user.EmailVerified) throw new AppProblem(409, "already_verified", "Email đã được xác thực.");
        var code = await users.LatestCode(user.Id, ct);
        var now = clock.UtcNow;
        if (code is null || code.ExpiresAtUtc <= now || code.FailedAttempts >= 5) throw InvalidCode();
        var given = CodeHash(input.Code);
        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(code.CodeHash), Convert.FromHexString(given)))
        {
            code.FailedAttempts++;
            await users.Save(ct);
            throw InvalidCode();
        }
        code.ConsumedAtUtc = now;
        user.EmailVerified = true;
        await users.Save(ct);
    }
    public async Task<LoginResponse> Login(LoginRequest input, CancellationToken ct)
    {
        var user = await users.FindByEmail(NormalizeEmail(input.Email), ct);
        var now = clock.UtcNow;
        if (user is null) { Passwords.Verify(input.Password, Passwords.DummyHash); throw InvalidLogin(); }
        if (user.LoginLockedUntilUtc > now) throw new AppProblem(429, "login_locked", "Đăng nhập bị khóa tạm thời; thử lại sau 15 phút.");
        if (!Passwords.Verify(input.Password, user.PasswordHash))
        {
            user.FailedLoginCount++;
            if (user.FailedLoginCount >= 5) { user.LoginLockedUntilUtc = now.AddMinutes(15); user.FailedLoginCount = 0; }
            await users.Save(ct);
            throw InvalidLogin();
        }
        user.FailedLoginCount = 0;
        user.LoginLockedUntilUtc = null;
        if (!user.EmailVerified) { await users.Save(ct); throw new AppProblem(403, "email_unverified", "Cần xác thực email trước khi đăng nhập."); }
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var session = new UserSession { UserId = user.Id, TokenHash = TokenHash(token), CreatedAtUtc = now, ExpiresAtUtc = now.AddDays(7) };
        users.AddSession(session);
        await users.Save(ct);
        return new LoginResponse(token, session.ExpiresAtUtc, ToProfile(user));
    }
    public async Task<UserSession?> Authenticate(string token, CancellationToken ct)
    {
        if (token.Length != 64 || !token.All(Uri.IsHexDigit)) return null;
        var session = await users.FindSession(TokenHash(token), ct);
        return session is { RevokedAtUtc: null } && session.ExpiresAtUtc > clock.UtcNow && session.User.EmailVerified ? session : null;
    }
    public async Task Logout(UserSession session, CancellationToken ct)
    {
        session.RevokedAtUtc = clock.UtcNow;
        await users.Save(ct);
    }
    public async Task<ProfileResponse> GetProfile(Guid userId, CancellationToken ct)
    {
        var user = await users.FindById(userId, ct) ?? throw new AppProblem(404, "not_found", "Không tìm thấy tài khoản.");
        return ToProfile(user);
    }
    public async Task<ProfileResponse> UpdateProfile(Guid userId, UpdateProfileRequest input, CancellationToken ct)
    {
        var name = ValidateName(input.DisplayName);
        var user = await users.FindById(userId, ct) ?? throw new AppProblem(404, "not_found", "Không tìm thấy tài khoản.");
        var nextAvatar = string.IsNullOrWhiteSpace(input.AvatarUrl) ? null : input.AvatarUrl;
        if (nextAvatar is not null && !(nextAvatar == UploadedAvatarPath && user.AvatarUrl == UploadedAvatarPath) &&
            (nextAvatar.Length > 2048 || !Uri.TryCreate(nextAvatar, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps))
            throw new AppProblem(400, "invalid_avatar_url", "Avatar phải là URL HTTPS hợp lệ, tối đa 2048 ký tự.");
        var removeUpload = user.AvatarUrl == UploadedAvatarPath && nextAvatar != UploadedAvatarPath;
        user.DisplayName = name;
        user.AvatarUrl = nextAvatar;
        await users.Save(ct);
        if (removeUpload) await avatars.Delete(userId, ct);
        return ToProfile(user);
    }
    public const string UploadedAvatarPath = "/api/profile/me/avatar";
    public async Task<ProfileResponse> UploadAvatar(Guid userId, Stream input, CancellationToken ct)
    {
        var user = await users.FindById(userId, ct) ?? throw new AppProblem(404, "not_found", "Không tìm thấy tài khoản.");
        using var output = new MemoryStream();
        var buffer = new byte[81920];
        int read;
        while ((read = await input.ReadAsync(buffer, ct)) > 0)
        {
            if (output.Length + read > 5 * 1024 * 1024) throw new AppProblem(400, "avatar_too_large", "Ảnh avatar không được vượt quá 5MB.");
            output.Write(buffer, 0, read);
        }
        var bytes = output.ToArray();
        if (DetectImageContentType(bytes) is null) throw new AppProblem(400, "invalid_avatar_file", "Avatar phải là ảnh PNG, JPEG hoặc WebP hợp lệ.");
        await avatars.Save(userId, bytes, ct);
        user.AvatarUrl = UploadedAvatarPath;
        await users.Save(ct);
        return ToProfile(user);
    }
    public async Task<(byte[] Bytes, string ContentType)> ReadAvatar(Guid userId, CancellationToken ct)
    {
        var user = await users.FindById(userId, ct) ?? throw new AppProblem(404, "not_found", "Không tìm thấy tài khoản.");
        if (user.AvatarUrl != UploadedAvatarPath) throw new AppProblem(404, "avatar_not_found", "Chưa có avatar đã tải lên.");
        var bytes = await avatars.Read(userId, ct) ?? throw new AppProblem(404, "avatar_not_found", "Không tìm thấy ảnh avatar.");
        var contentType = DetectImageContentType(bytes) ?? throw new AppProblem(500, "avatar_corrupt", "Ảnh avatar không hợp lệ.");
        return (bytes, contentType);
    }
    private static string? DetectImageContentType(ReadOnlySpan<byte> data)
    {
        if (data.Length >= 8 && data[..8].SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (data.Length >= 3 && data[0] == 255 && data[1] == 216 && data[2] == 255) return "image/jpeg";
        if (data.Length >= 12 && data[..4].SequenceEqual("RIFF"u8) && data.Slice(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
    public static ProfileResponse ToProfile(UserAccount user) => new(user.Id, user.Email, user.EmailVerified, user.DisplayName, user.AvatarUrl);
    public static string TokenHash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    private VerificationCode NewVerification(Guid userId, string code, DateTime now) => new() { UserId = userId, CodeHash = CodeHash(code), CreatedAtUtc = now, ExpiresAtUtc = now.AddMinutes(10) };
    private string CodeHash(string code) => Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(otpPepper), Encoding.UTF8.GetBytes(code)));
    private static string NewCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
    private static string NormalizeEmail(string email)
    {
        email = email.Trim().ToLowerInvariant();
        if (email.Length > 320 || !new EmailAddressAttribute().IsValid(email)) throw new AppProblem(400, "invalid_email", "Email không hợp lệ.");
        return email;
    }
    private static string ValidateName(string name)
    {
        name = name.Trim();
        if (name.Length is < 1 or > 80) throw new AppProblem(400, "invalid_display_name", "Tên hiển thị phải dài 1-80 ký tự.");
        return name;
    }
    private static AppProblem InvalidCode() => new(400, "invalid_code", "Mã xác thực không đúng, đã hết hạn hoặc hết lượt thử.");
    private static AppProblem InvalidLogin() => new(401, "invalid_credentials", "Email hoặc mật khẩu không đúng.");
}
public static class Passwords
{
    public static readonly string DummyHash = Hash("a dummy password that is never used");
    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 210_000, HashAlgorithmName.SHA256, 32);
        return $"pbkdf2-sha256$210000${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }
    public static bool Verify(string password, string stored)
    {
        var parts = stored.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2-sha256" || !int.TryParse(parts[1], out var rounds)) return false;
        var salt = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, rounds, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
