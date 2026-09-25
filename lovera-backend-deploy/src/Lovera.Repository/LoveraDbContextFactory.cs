using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace Lovera.Repository;
public sealed class LoveraDbContextFactory : IDesignTimeDbContextFactory<LoveraDbContext>
{
    public LoveraDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__Default") ?? "Host=localhost;Database=lovera;Username=lovera;Password=design-time-only";
        return new LoveraDbContext(new DbContextOptionsBuilder<LoveraDbContext>().UseNpgsql(connection).Options);
    }
}
