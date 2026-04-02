using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using OneBear.API.Auth;
using OneBear.API.Hubs;
using OneBear.API.Middleware;
using OneBear.API.Services;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Infrastructure;
using OneBear.Infrastructure.Persistence.Cosmos;
using OneBear.Infrastructure.Persistence.Cosmos.Seeding;

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

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "One Bear API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT token. Get one from POST /api/v1/dev/token in development.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
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

if (builder.Environment.IsDevelopment())
{
    // Dev mode: validate tokens signed with symmetric key
    string devKey = builder.Configuration["Auth:DevSigningKey"] ?? "OneBear-Dev-Signing-Key-Min-32-Chars!!";
    authBuilder.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Auth:DevIssuer"] ?? "onebear-dev",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Auth:Audience"] ?? "onebear-api",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(devKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        // Allow token from query string for SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                Microsoft.Extensions.Primitives.StringValues accessToken = context.Request.Query["access_token"];
                PathString path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });
}
else
{
    // Production: validate tokens from GoFive IdP via JWKS
    authBuilder.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"] ?? "https://login.gofive.co.th";
        options.Audience = builder.Configuration["Auth:Audience"] ?? "onebear-api";
        options.RequireHttpsMetadata = true;

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                Microsoft.Extensions.Primitives.StringValues accessToken = context.Request.Query["access_token"];
                PathString path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });
}

// API Key authentication
authBuilder.AddScheme<ApiKeyAuthOptions, ApiKeyAuthHandler>(ApiKeyAuthOptions.SchemeName, null);

// Authorization - real permission checks
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Chat.View", policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatView)));
    options.AddPolicy("Chat.Resolve", policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatResolved)));
    options.AddPolicy("Chat.Mention", policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatMention)));
    options.AddPolicy("Chat.AssignAll", policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatAssignAllCompany)));
    options.AddPolicy("Chat.Admin", policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatAccessAllData)));
    options.AddPolicy("ApiKey", policy => policy.AddAuthenticationSchemes(ApiKeyAuthOptions.SchemeName).RequireAuthenticatedUser());
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:5173" })
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

// Infrastructure (Cosmos DB, Redis, Repositories)
builder.Services.AddInfrastructure(builder.Configuration);

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Middleware pipeline
app.UseExceptionHandling(); // Global error handler first

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "One Bear API v1"));
}

app.UseCors("Default");

// Dev auth bypass: auto-authenticate requests without token (Development only)
if (app.Environment.IsDevelopment())
{
    app.UseMiddleware<DevAuthBypassMiddleware>();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/api/v1/health");

if (app.Environment.IsDevelopment())
{
    using IServiceScope scope = app.Services.CreateScope();
    CosmosDbContext cosmosDb = scope.ServiceProvider.GetRequiredService<CosmosDbContext>();
    await cosmosDb.EnsureDatabaseCreatedAsync();

    CosmosSeeder seeder = scope.ServiceProvider.GetRequiredService<CosmosSeeder>();
    await seeder.SeedDevelopmentDataAsync();
}

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
