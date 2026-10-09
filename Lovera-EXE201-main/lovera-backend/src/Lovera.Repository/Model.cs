using Microsoft.EntityFrameworkCore;

namespace Lovera.Repository;

public sealed class UserAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public bool EmailVerified { get; set; }
    public string DisplayName { get; set; } = "";
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public int FailedLoginCount { get; set; }
    public DateTime? LoginLockedUntilUtc { get; set; }
    public List<VerificationCode> VerificationCodes { get; set; } = [];
    public List<UserSession> Sessions { get; set; } = [];
}
public sealed class VerificationCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public string CodeHash { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? ConsumedAtUtc { get; set; }
    public int FailedAttempts { get; set; }
}
public sealed class UserSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public string TokenHash { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
}
public sealed class LoveraDbContext(DbContextOptions<LoveraDbContext> options) : DbContext(options)
{
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<VerificationCode> VerificationCodes => Set<VerificationCode>();
    public DbSet<UserSession> Sessions => Set<UserSession>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<UserAccount>(x => { x.ToTable("users"); x.HasKey(u => u.Id); x.Property(u => u.Email).HasMaxLength(320).IsRequired(); x.HasIndex(u => u.Email).IsUnique(); x.Property(u => u.PasswordHash).IsRequired(); x.Property(u => u.DisplayName).HasMaxLength(80).IsRequired(); x.Property(u => u.AvatarUrl).HasMaxLength(2048); });
        b.Entity<VerificationCode>(x => { x.ToTable("verification_codes"); x.HasKey(v => v.Id); x.Property(v => v.CodeHash).IsRequired(); x.HasIndex(v => new { v.UserId, v.CreatedAtUtc }); x.HasOne(v => v.User).WithMany(u => u.VerificationCodes).HasForeignKey(v => v.UserId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<UserSession>(x => { x.ToTable("sessions"); x.HasKey(s => s.Id); x.Property(s => s.TokenHash).IsRequired(); x.HasIndex(s => s.TokenHash).IsUnique(); x.HasIndex(s => new { s.UserId, s.ExpiresAtUtc }); x.HasOne(s => s.User).WithMany(u => u.Sessions).HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade); });
    }
}
