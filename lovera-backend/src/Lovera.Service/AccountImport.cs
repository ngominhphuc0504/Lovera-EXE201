using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Lovera.Repository;

namespace Lovera.Service;

public sealed record ImportAccountInput(string? Email, string? Password, string? DisplayName);

public static class AccountImport
{
    public static IReadOnlyList<UserAccount> Prepare(string json, DateTime now)
    {
        ImportAccountInput?[]? entries;
        try
        {
            entries = JsonSerializer.Deserialize<ImportAccountInput?[]>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException)
        {
            throw new ArgumentException("File tài khoản phải là JSON hợp lệ.");
        }
        if (entries is null || entries.Length != 10)
            throw new ArgumentException("File phải chứa đúng 10 tài khoản.");

        var normalized = new List<(string Email, string Password, string Name)>();
        var emails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var entry in entries)
        {
            var email = entry?.Email?.Trim().ToLowerInvariant();
            var name = entry?.DisplayName?.Trim();
            var password = entry?.Password;
            if (string.IsNullOrEmpty(email) || email.Length > 320 || !new EmailAddressAttribute().IsValid(email))
                throw new ArgumentException("Có email không hợp lệ.");
            if (!emails.Add(email)) throw new ArgumentException("File chứa email trùng nhau.");
            if (password is null || password.Length is < 6 or > 128)
                throw new ArgumentException("Mật khẩu phải dài 6–128 ký tự.");
            if (string.IsNullOrEmpty(name) || name.Length > 80)
                throw new ArgumentException("Tên hiển thị phải dài 1–80 ký tự.");
            normalized.Add((email, password, name));
        }
        return normalized.Select(x => new UserAccount
        {
            Email = x.Email,
            PasswordHash = Passwords.Hash(x.Password),
            DisplayName = x.Name,
            EmailVerified = true,
            CreatedAtUtc = now
        }).ToArray();
    }
}
