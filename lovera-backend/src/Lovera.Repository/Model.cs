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
    public DbSet<Couple> Couples => Set<Couple>();
    public DbSet<CoupleMember> CoupleMembers => Set<CoupleMember>();
    public DbSet<PairingInvitation> PairingInvitations => Set<PairingInvitation>();
    public DbSet<Garden> Gardens => Set<Garden>();
    public DbSet<PointEvent> PointEvents => Set<PointEvent>();
    public DbSet<DatePlan> DatePlans => Set<DatePlan>();
    public DbSet<LoveMemory> Memories => Set<LoveMemory>();
    public DbSet<ConnectionStatus> ConnectionStatuses => Set<ConnectionStatus>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<UserAccount>(x => { x.ToTable("users"); x.HasKey(u => u.Id); x.Property(u => u.Email).HasMaxLength(320).IsRequired(); x.HasIndex(u => u.Email).IsUnique(); x.Property(u => u.PasswordHash).IsRequired(); x.Property(u => u.DisplayName).HasMaxLength(80).IsRequired(); x.Property(u => u.AvatarUrl).HasMaxLength(2048); });
        b.Entity<VerificationCode>(x => { x.ToTable("verification_codes"); x.HasKey(v => v.Id); x.Property(v => v.CodeHash).IsRequired(); x.HasIndex(v => new { v.UserId, v.CreatedAtUtc }); x.HasOne(v => v.User).WithMany(u => u.VerificationCodes).HasForeignKey(v => v.UserId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<UserSession>(x => { x.ToTable("sessions"); x.HasKey(s => s.Id); x.Property(s => s.TokenHash).IsRequired(); x.HasIndex(s => s.TokenHash).IsUnique(); x.HasIndex(s => new { s.UserId, s.ExpiresAtUtc }); x.HasOne(s => s.User).WithMany(u => u.Sessions).HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<Couple>(x => { x.ToTable("couples"); x.HasKey(c => c.Id); x.HasIndex(c => c.EndedAtUtc); });
        b.Entity<CoupleMember>(x => { x.ToTable("couple_members"); x.HasKey(m => new { m.CoupleId, m.UserId }); x.HasIndex(m => m.UserId).IsUnique().HasFilter("\"LeftAtUtc\" IS NULL"); x.HasOne(m => m.Couple).WithMany(c => c.Members).HasForeignKey(m => m.CoupleId).OnDelete(DeleteBehavior.Cascade); x.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Restrict); });
        b.Entity<PairingInvitation>(x => { x.ToTable("pairing_invitations"); x.HasKey(i => i.Id); x.Property(i => i.CodeHash).HasMaxLength(64).IsRequired(); x.HasIndex(i => i.CodeHash).IsUnique(); x.HasIndex(i => new { i.CreatorUserId, i.ExpiresAtUtc }); x.HasOne(i => i.Creator).WithMany().HasForeignKey(i => i.CreatorUserId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<Garden>(x => { x.ToTable("gardens"); x.HasKey(g => g.CoupleId); x.HasOne(g => g.Couple).WithOne(c => c.Garden).HasForeignKey<Garden>(g => g.CoupleId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<PointEvent>(x => { x.ToTable("point_events"); x.HasKey(e => e.Id); x.Property(e => e.ActionType).HasMaxLength(40).IsRequired(); x.HasIndex(e => new { e.CoupleId, e.LocalDate }); x.HasIndex(e => new { e.CoupleId, e.ActionType, e.SourceId }).IsUnique().HasFilter("\"SourceId\" IS NOT NULL"); x.HasOne(e => e.Couple).WithMany().HasForeignKey(e => e.CoupleId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<DatePlan>(x => { x.ToTable("date_plans"); x.HasKey(p => p.Id); x.Property(p => p.Location).HasMaxLength(160).IsRequired(); x.Property(p => p.FoodPreference).HasMaxLength(300); x.Property(p => p.ActivityPreference).HasMaxLength(300); x.Property(p => p.ItemsJson).HasColumnType("jsonb").IsRequired(); x.Property(p => p.Budget).HasPrecision(12, 2); x.Property(p => p.EstimatedTotal).HasPrecision(12, 2); x.HasIndex(p => new { p.CoupleId, p.CreatedAtUtc }); x.HasOne(p => p.Couple).WithMany().HasForeignKey(p => p.CoupleId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<LoveMemory>(x => { x.ToTable("memories"); x.HasKey(m => m.Id); x.Property(m => m.Text).HasMaxLength(5000); x.Property(m => m.ImageContentType).HasMaxLength(40); x.HasIndex(m => new { m.CoupleId, m.CreatedAtUtc }); x.HasOne(m => m.Couple).WithMany().HasForeignKey(m => m.CoupleId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<ConnectionStatus>(x => { x.ToTable("connection_statuses"); x.HasKey(s => s.UserId); x.Property(s => s.Kind).HasMaxLength(32).IsRequired(); x.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade); });
    }
}
