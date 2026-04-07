using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi.Models;
using OneBear.API.Auth;
using OneBear.API.Hubs;
using OneBear.API.Middleware;
using OneBear.API.Services;
using OneBear.Application.Common.Interfaces;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Application;
using OneBear.Infrastructure;
using OneBear.Infrastructure.Persistence.Mongo;
using OneBear.Infrastructure.Persistence.Mongo.Seeding;

var builder = WebApplication.CreateBuilder(args);

// JSON serialization
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddControllers(options =>
{
    options.Filters.Add<CompanyIdValidationFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// Bind and register options
AuthOptions authOptions = builder.Configuration
    .GetSection(AuthOptions.SectionName).Get<AuthOptions>() ?? new AuthOptions();
builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.Configure<ApiKeyOptions>(builder.Configuration.GetSection(ApiKeyOptions.SectionName));
builder.Services.Configure<OneBear.Application.Auth.KeycloakAdminOptions>(
    builder.Configuration.GetSection(OneBear.Application.Auth.KeycloakAdminOptions.SectionName));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "One Bear API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT token from Keycloak.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityDefinition(AuthConstants.ApiKeyScheme, new OpenApiSecurityScheme
    {
        Description = "API key for internal service-to-service calls. Pass in the X-Api-Key header.",
        Name = "X-Api-Key",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = AuthConstants.ApiKeyScheme
                }
            },
            Array.Empty<string>()
        }
    });
});

// Authentication
AuthenticationBuilder authBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
});

// Disable default claim type mapping so "sub" stays as "sub" (not remapped to long URI)
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// JWT Bearer — Keycloak JWKS validation for all environments
authBuilder.AddJwtBearer(options =>
{
    options.Authority = authOptions.Authority;
    options.Audience = authOptions.Audience;
    options.RequireHttpsMetadata = authOptions.RequireHttpsMetadata;
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1),
        NameClaimType = "preferred_username"
    };

    // SignalR: allow token in query string
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            string? accessToken = context.Request.Query["access_token"];
            PathString path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

// API Key authentication
authBuilder.AddScheme<AuthenticationSchemeOptions, ApiKeyAuthHandler>(
    AuthConstants.ApiKeyScheme, options => { });

// Authorization - real permission checks
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthConstants.PolicyChatView, policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatView)));
    options.AddPolicy(AuthConstants.PolicyChatResolve, policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatResolved)));
    options.AddPolicy(AuthConstants.PolicyChatMention, policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatMention)));
    options.AddPolicy(AuthConstants.PolicyChatAssignAll, policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatAssignAllCompany)));
    options.AddPolicy(AuthConstants.PolicyChatAdmin, policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatAccessAllData)));
});

// CORS
string[] corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("OneBear", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// SignalR
string? signalRConnectionString = builder.Configuration["Azure:SignalR:ConnectionString"];
if (!string.IsNullOrEmpty(signalRConnectionString))
{
    builder.Services.AddSignalR().AddAzureSignalR(signalRConnectionString);
}
else
{
    builder.Services.AddSignalR();
}

// SignalR notifier (server-side push service for controllers and services)
builder.Services.AddScoped<ISignalRNotifier, SignalRNotifierService>();

// SignalR real-time infrastructure services
builder.Services.AddSingleton<IAttendanceService, AttendanceService>();
builder.Services.AddSingleton<ITypingTracker, TypingTracker>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IRoomAuthorizationService, RoomAuthorizationService>();

// Application layer (services, validators, orchestrator)
builder.Services.AddApplication();

// Infrastructure (MongoDB, Redis, Repositories, MassTransit, Platform Adapters)
builder.Services.AddInfrastructure(builder.Configuration);

// Health checks
builder.Services.AddHealthChecks();

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    // webhook: 500 requests/minute per IP
    options.AddFixedWindowLimiter("webhook", opt =>
    {
        opt.PermitLimit = 500;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 50;
    });

    // api: 300 requests/minute per tenant (partition by companyId from JWT)
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.PermitLimit = 300;
        opt.Window = TimeSpan.FromMinutes(1);
    });

    // auth: 20 requests/minute per IP
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
    });

    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        Microsoft.AspNetCore.Mvc.ProblemDetails problemDetails = new()
        {
            Status = 429,
            Title = "Too Many Requests",
            Detail = "Rate limit exceeded. Try again later.",
            Instance = context.HttpContext.Request.Path
        };
        await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, ct);
    };
});

var app = builder.Build();

// Middleware pipeline
app.UseExceptionHandling(); // Global error handler first

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "One Bear API v1"));
}

app.UseCors("OneBear");
app.UseRateLimiter();

app.UseAuthentication();
app.UseUserProfile();
app.UseSubscriptionCheck(app.Environment.IsDevelopment());
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/api/v1/health");

if (app.Environment.IsDevelopment())
{
    try
    {
        using IServiceScope scope = app.Services.CreateScope();
        MongoSeeder seeder = scope.ServiceProvider.GetRequiredService<MongoSeeder>();
        await seeder.EnsureIndexesAsync();
        await seeder.SeedDevelopmentDataAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "MongoDB not available — skipping database seeding. App will run but database operations will fail.");
    }
}

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
