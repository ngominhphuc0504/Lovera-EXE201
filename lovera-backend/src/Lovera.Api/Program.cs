using Lovera.Api;
using Lovera.Repository;
using Lovera.Service;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("Default") ?? throw new InvalidOperationException("Missing ConnectionStrings:Default");
var pepper = builder.Configuration["Otp:Pepper"] ?? throw new InvalidOperationException("Missing Otp:Pepper");
if (pepper.Length < 32) throw new InvalidOperationException("Otp:Pepper must contain at least 32 characters");
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();
foreach (var origin in allowedOrigins)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
        || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        || uri.UserInfo.Length > 0 || uri.AbsolutePath != "/"
        || uri.Query.Length > 0 || uri.Fragment.Length > 0
        || origin.EndsWith('/'))
        throw new InvalidOperationException("Cors:AllowedOrigins must contain only HTTP(S) origins without paths or trailing slashes.");
}
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
{
    if (allowedOrigins.Length > 0) policy.WithOrigins(allowedOrigins);
    policy.AllowAnyHeader().AllowAnyMethod();
}));
builder.Services.AddDbContext<LoveraDbContext>(o => o.UseNpgsql(connection));
builder.Services.AddScoped<IUsersRepository, UsersRepository>();
builder.Services.AddSingleton<IAvatarStorage>(new LocalAvatarStorage(builder.Configuration["Avatar:Directory"] ?? Path.Combine(builder.Environment.ContentRootPath, "avatars")));
builder.Services.AddSingleton<IClock, Lovera.Service.SystemClock>();
builder.Services.AddScoped<AuthService>(sp => new AuthService(sp.GetRequiredService<IUsersRepository>(), sp.GetRequiredService<IVerificationMail>(), sp.GetRequiredService<IClock>(), sp.GetRequiredService<IAvatarStorage>(), pepper));
builder.Services.AddSingleton<IVerificationMail, SmtpVerificationMail>();
builder.Services.AddAuthentication("Session").AddScheme<AuthenticationSchemeOptions, SessionAuthHandler>("Session", _ => { });
builder.Services.AddAuthorization(o => o.AddPolicy("VerifiedEmail", p => p.RequireAuthenticatedUser().RequireClaim("email_verified", "true")));
builder.Services.AddControllers().ConfigureApiBehaviorOptions(o => o.InvalidModelStateResponseFactory = c => new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new { code = "invalid_input", message = "Dữ liệu đầu vào không hợp lệ.", errors = c.ModelState.Where(x => x.Value?.Errors.Count > 0).ToDictionary(x => x.Key, x => x.Value!.Errors.Select(e => e.ErrorMessage)) }));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o => { o.SwaggerDoc("v1", new OpenApiInfo { Title = "LOVERA APIs", Version = "v1" }); o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "Opaque", Description = "Token từ /api/auth/login" }); o.AddSecurityRequirement(new OpenApiSecurityRequirement { [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = [] }); });
builder.Services.AddRateLimiter(o => { o.RejectionStatusCode = 429; o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })); });
var app = builder.Build();
if (builder.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<LoveraDbContext>().Database.MigrateAsync();
}
app.UseRouting();
app.UseCors("Frontend");
app.UseMiddleware<ProblemMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health/live", () => Results.Ok(new { status = "live" }));
app.MapGet("/health/ready", async (LoveraDbContext db, CancellationToken ct) => { try { await db.Users.AnyAsync(ct); return Results.Ok(new { status = "ready" }); } catch { return Results.StatusCode(503); } });
app.Run();
public partial class Program { }
