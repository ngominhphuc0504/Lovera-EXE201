using System.Text.Json;
using Lovera.Service;
using Xunit;

namespace Lovera.Tests;

public sealed class AccountImportTests
{
    [Fact]
    public void Exactly_ten_unique_accounts_are_verified_and_passwords_are_hashed()
    {
        var entries = Enumerable.Range(1, 10).Select(i => new
        {
            email = $"USER{i}@example.com",
            password = $"password-{i}",
            displayName = $"User {i}"
        });
        var users = AccountImport.Prepare(JsonSerializer.Serialize(entries), DateTime.UtcNow);
        Assert.Equal(10, users.Count);
        Assert.All(users, user =>
        {
            Assert.True(user.EmailVerified);
            Assert.StartsWith("pbkdf2-sha256$", user.PasswordHash);
            Assert.DoesNotContain("password-", user.PasswordHash);
        });
        Assert.Equal("user1@example.com", users[0].Email);
        Assert.True(Passwords.Verify("password-1", users[0].PasswordHash));
    }

    [Fact]
    public void Import_rejects_wrong_count_duplicate_email_and_short_password()
    {
        var entries = Enumerable.Range(1, 10).Select(i => new ImportAccountInput($"user{i}@example.com", "abcdef", $"User {i}")).ToArray();
        Assert.Throws<ArgumentException>(() => AccountImport.Prepare(JsonSerializer.Serialize(entries[..9]), DateTime.UtcNow));
        entries[9] = entries[0];
        Assert.Throws<ArgumentException>(() => AccountImport.Prepare(JsonSerializer.Serialize(entries), DateTime.UtcNow));
        entries[9] = new ImportAccountInput("user10@example.com", "12345", "User 10");
        Assert.Throws<ArgumentException>(() => AccountImport.Prepare(JsonSerializer.Serialize(entries), DateTime.UtcNow));
    }
}
