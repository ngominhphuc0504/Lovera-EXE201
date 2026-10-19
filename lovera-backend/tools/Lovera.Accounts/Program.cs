using Lovera.Repository;
using Lovera.Service;
using Microsoft.EntityFrameworkCore;

if (!Console.IsInputRedirected)
{
    Console.Error.WriteLine("Cần đưa file JSON riêng qua stdin; không nhập mật khẩu trong lệnh hoặc mã nguồn.");
    return 1;
}

IReadOnlyList<UserAccount> accounts;
try
{
    accounts = AccountImport.Prepare(await Console.In.ReadToEndAsync(), DateTime.UtcNow);
}
catch (ArgumentException e)
{
    Console.Error.WriteLine(e.Message);
    return 1;
}

var connection = Environment.GetEnvironmentVariable("ConnectionStrings__Default");
if (string.IsNullOrWhiteSpace(connection))
{
    Console.Error.WriteLine("Thiếu ConnectionStrings__Default.");
    return 1;
}

try
{
    await using var db = new LoveraDbContext(new DbContextOptionsBuilder<LoveraDbContext>()
        .UseNpgsql(connection).Options);
    if (!await db.Database.CanConnectAsync())
    {
        Console.Error.WriteLine("Không kết nối được PostgreSQL.");
        return 1;
    }
    var emails = accounts.Select(x => x.Email).ToArray();
    if (await db.Users.AnyAsync(x => emails.Contains(x.Email)))
    {
        Console.Error.WriteLine("Một hoặc nhiều email đã có trong database; không tài khoản nào được thêm.");
        return 1;
    }
    await using var transaction = await db.Database.BeginTransactionAsync();
    db.Users.AddRange(accounts);
    await db.SaveChangesAsync();
    await transaction.CommitAsync();
    Console.WriteLine("Đã tạo 10 tài khoản đã xác thực email trong PostgreSQL. Mật khẩu chỉ lưu dưới dạng hash.");
    return 0;
}
catch (Exception)
{
    Console.Error.WriteLine("Không thể nhập tài khoản; kiểm tra migration, email trùng và kết nối database.");
    return 1;
}
