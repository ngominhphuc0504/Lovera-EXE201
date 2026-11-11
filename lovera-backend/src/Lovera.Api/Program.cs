using Lovera.Api;
using Lovera.Repository;
using Lovera.Service;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;
using System.Security.Claims;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;

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
builder.Services.AddScoped<IFeatureRepository, FeatureRepository>();
builder.Services.AddScoped<IAiChatRepository, AiChatRepository>();
builder.Services.AddSingleton(_ => TimeZoneInfo.FindSystemTimeZoneById(builder.Configuration["TimeZone:Id"] ?? "Asia/Ho_Chi_Minh"));
builder.Services.AddScoped<CoupleService>();
builder.Services.AddScoped<GardenService>();
builder.Services.AddScoped<ConnectionStatusService>();
builder.Services.AddScoped<MemoryService>();
builder.Services.AddScoped<DatePlanService>();
builder.Services.AddScoped<AiChatService>();
builder.Services.AddHttpClient<IDatePlanGenerator, HttpDatePlanGenerator>(client =>
    client.Timeout = TimeSpan.FromSeconds(builder.Configuration.GetValue("Ai:TimeoutSeconds", 15)));
builder.Services.AddHttpClient<IAiDateAssistant, GeminiDateAssistant>(client =>
    client.Timeout = TimeSpan.FromSeconds(
        builder.Configuration.GetValue("Ai:TimeoutSeconds", 30)));

//builder.Services.AddSingleton<IAvatarStorage>(new LocalAvatarStorage(builder.Configuration["Avatar:Directory"] ?? Path.Combine(builder.Environment.ContentRootPath, "avatars")));

var avatarProvider = builder.Configuration["Avatar:Provider"] ?? "Local";

if (avatarProvider.Equals("Cloudinary", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddHttpClient<IAvatarStorage, CloudinaryAvatarStorage>();
else if (avatarProvider.Equals("Local", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IAvatarStorage>(
        new LocalAvatarStorage(
            builder.Configuration["Avatar:Directory"] ??
            Path.Combine(builder.Environment.ContentRootPath, "avatars")));
else
    throw new InvalidOperationException("Avatar:Provider không hợp lệ.");

builder.Services.AddSingleton<IClock, Lovera.Service.SystemClock>();
builder.Services.AddScoped<AuthService>(sp => new AuthService(sp.GetRequiredService<IUsersRepository>(), sp.GetRequiredService<IVerificationMail>(), sp.GetRequiredService<IClock>(), sp.GetRequiredService<IAvatarStorage>(), pepper));
//builder.Services.AddSingleton<IVerificationMail, SmtpVerificationMail>();

var emailProvider = builder.Configuration["Email:Provider"] ?? "Smtp";

if (emailProvider.Equals("Brevo", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddHttpClient<IVerificationMail, BrevoVerificationMail>();
else if (emailProvider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IVerificationMail, SmtpVerificationMail>();
else
    throw new InvalidOperationException("Email:Provider không hợp lệ.");

builder.Services.AddAuthentication("Session").AddScheme<AuthenticationSchemeOptions, SessionAuthHandler>("Session", _ => { });
builder.Services.AddAuthorization(o => o.AddPolicy("VerifiedEmail", p => p.RequireAuthenticatedUser().RequireClaim("email_verified", "true")));
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.Configure<BrotliCompressionProviderOptions>(
    options =>
    {
        options.Level = CompressionLevel.Fastest;
    });

builder.Services.Configure<GzipCompressionProviderOptions>(
    options =>
    {
        options.Level = CompressionLevel.Fastest;
    });

builder.Services.AddControllers().ConfigureApiBehaviorOptions(o => o.InvalidModelStateResponseFactory = c => new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new { code = "invalid_input", message = "Dữ liệu đầu vào không hợp lệ.", errors = c.ModelState.Where(x => x.Value?.Errors.Count > 0).ToDictionary(x => x.Key, x => x.Value!.Errors.Select(e => e.ErrorMessage)) }));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o => { o.SwaggerDoc("v1", new OpenApiInfo { Title = "LOVERA APIs", Version = "v1" }); o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "Opaque", Description = "Token từ /api/auth/login" }); o.AddSecurityRequirement(new OpenApiSecurityRequirement { [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = [] }); });
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Lớp bảo vệ tổng thể theo IP.
    options.GlobalLimiter =
        PartitionedRateLimiter.Create<HttpContext, string>(
            context => RateLimitPolicies.Fixed(
                context,
                "global",
                300,
                TimeSpan.FromMinutes(1),
                preferAuthenticatedUser: false));

    options.AddPolicy("register", context =>
        RateLimitPolicies.Fixed(
            context, "register", 3, TimeSpan.FromMinutes(15),
            preferAuthenticatedUser: false));

    options.AddPolicy("login", context =>
        RateLimitPolicies.Fixed(
            context, "login", 10, TimeSpan.FromMinutes(1),
            preferAuthenticatedUser: false));

    options.AddPolicy("email", context =>
        RateLimitPolicies.Fixed(
            context, "email", 3, TimeSpan.FromMinutes(10),
            preferAuthenticatedUser: false));
    options.AddPolicy("otp", context =>
        RateLimitPolicies.Fixed(
            context,
            "otp",
            5,
            TimeSpan.FromMinutes(10),
            preferAuthenticatedUser: false));

    options.AddPolicy("pairing", context =>
        RateLimitPolicies.Fixed(
            context, "pairing", 10, TimeSpan.FromMinutes(10)));

    options.AddPolicy("profile-write", context =>
        RateLimitPolicies.Fixed(
            context, "profile-write", 10, TimeSpan.FromMinutes(10)));

    options.AddPolicy("upload", context =>
        RateLimitPolicies.Fixed(
            context, "upload", 5, TimeSpan.FromHours(1)));

    options.AddPolicy("memory-write", context =>
        RateLimitPolicies.Fixed(
            context, "memory-write", 10, TimeSpan.FromHours(1)));

    options.AddPolicy("garden-write", context =>
        RateLimitPolicies.Fixed(
            context, "garden-write", 10, TimeSpan.FromMinutes(10)));

    options.AddPolicy("status-write", context =>
        RateLimitPolicies.Fixed(
            context, "status-write", 20, TimeSpan.FromMinutes(10)));

    options.AddPolicy("plan-generate", context =>
        RateLimitPolicies.Fixed(
            context, "plan-generate", 5, TimeSpan.FromMinutes(10)));

    options.AddPolicy("plan-write", context =>
        RateLimitPolicies.Fixed(
            context, "plan-write", 10, TimeSpan.FromMinutes(10)));

    options.AddPolicy("ai-conversation", context =>
        RateLimitPolicies.Fixed(
            context, "ai-conversation", 5, TimeSpan.FromMinutes(10)));

    options.AddPolicy("ai-message", context =>
        RateLimitPolicies.Fixed(
            context, "ai-message", 20, TimeSpan.FromMinutes(10)));

    options.AddPolicy("dangerous", context =>
        RateLimitPolicies.Fixed(
            context, "dangerous", 3, TimeSpan.FromHours(1)));

    options.OnRejected = async (context, cancellationToken) =>
    {
        int? retryAfterSeconds = null;

        if (context.Lease.TryGetMetadata(
                MetadataName.RetryAfter,
                out var retryAfter))
        {
            retryAfterSeconds = Math.Max(
                1,
                (int)Math.Ceiling(retryAfter.TotalSeconds));

            context.HttpContext.Response.Headers.RetryAfter =
                retryAfterSeconds.Value.ToString();
        }

        await context.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                code = "rate_limited",
                message = "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
                retryAfterSeconds
            },
            cancellationToken);
    };
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;

    options.ForwardLimit = 1;

    // Backend chỉ được truy cập thông qua load balancer của Render.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();
// Check PostgreSQL before Kestrel opens Swagger or any API endpoint.
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LoveraDbContext>();
    if (builder.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
        await db.Database.MigrateAsync();
    if (!builder.Configuration.GetValue<bool>("Database:SkipStartupCheck") && !await db.Database.CanConnectAsync())
        throw new InvalidOperationException("Không kết nối được PostgreSQL. Hãy bật Docker Compose service db và kiểm tra ConnectionStrings:Default.");
}
app.UseForwardedHeaders();
app.UseResponseCompression();
app.UseRouting();
app.UseCors("Frontend");
app.UseMiddleware<ProblemMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
// Phải đặt sau Authentication để policy đọc được userId.
app.UseRateLimiter();

app.UseAuthorization();

app.MapControllers();

app.MapGet("/health/live",
    () => Results.Ok(new { status = "live" }));

app.MapGet("/health/ready",
    async (LoveraDbContext db, CancellationToken ct) =>
    {
        try
        {
            await db.Users.AnyAsync(ct);
            return Results.Ok(new { status = "ready" });
        }
        catch
        {
            return Results.StatusCode(503);
        }
    });

app.Run();
public partial class Program { }
