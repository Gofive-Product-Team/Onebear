# Authentication & Authorization Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the existing auth infrastructure with the `02-auth-infrastructure` spec — centralized constants, options-pattern config binding, standardized claim names, JSON-array permissions, async filters, subscription check middleware, and frontend auth guard/callback.

**Architecture:** Refactor existing auth components (ApiKeyAuthHandler, PermissionHandler, CompanyIdValidationFilter, ClaimsPrincipalExtensions, DevTokenController) to use centralized `AuthConstants`, options-pattern config (`AuthOptions`/`ApiKeyOptions`), and standardized claim names (`"auth_method"="api_key"`, `"api_key_scope"`). Switch permissions claim from multiple individual claims to a single JSON array. Add `SubscriptionCheckMiddleware` for SUB-01. Frontend gets `AuthGuard`, `AuthCallbackPage`, shared permission constants, and permission checkboxes on the dev login form.

**Tech Stack:** .NET 9, ASP.NET Core JWT Bearer + custom ApiKey scheme, xUnit, React 19, Zustand, Vitest

**Spec:** `docs/implementation/02-auth-infrastructure.md` (in parent Salesbear directory)

**Working directory:** `/Users/ditthapong/Documents/Salesbear/one-bear`

**Note on coordinated format change:** Tasks 5, 6, and 8 coordinate the permissions claim format change from multiple individual claims to a single JSON array. Between Task 5/6 (consumers updated) and Task 8 (producer updated), the project builds and tests pass but runtime integration requires all three tasks complete.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `backend/src/OneBear.API/Auth/AuthConstants.cs` | Centralized auth scheme names, claim types, scope names, policy names |
| `backend/src/OneBear.API/Auth/AuthOptions.cs` | JWT config binding (Authority, Audience, DevSigningKey, RequireHttpsMetadata) |
| `backend/src/OneBear.API/Auth/ApiKeyOptions.cs` | API key config binding (Primary, Secondary, AiService) |
| `backend/src/OneBear.API/Middleware/SubscriptionCheckMiddleware.cs` | Check company subscription status, block expired (SUB-01) |
| `backend/tests/OneBear.API.Tests/Auth/DevTokenControllerTests.cs` | Tests for dev token generation |
| `backend/tests/OneBear.API.Tests/Middleware/SubscriptionCheckMiddlewareTests.cs` | Tests for subscription check |
| `libs/shared-types/src/permissions.ts` | Shared permission constants (frontend) |
| `apps/web/src/components/AuthGuard.tsx` | Route protection component with permission check |
| `apps/web/src/pages/AuthCallbackPage.tsx` | OAuth2 PKCE callback (production placeholder) |
| `apps/web/src/components/AuthGuard.test.tsx` | AuthGuard component tests |
| `apps/web/src/lib/api-client.test.ts` | API client tests |

### Modified Files
| File | Changes |
|------|---------|
| `backend/src/OneBear.API/Auth/ApiKeyAuthHandler.cs` | Inject `IOptions<ApiKeyOptions>`, change claims to `"auth_method"="api_key"` + `"api_key_scope"` |
| `backend/src/OneBear.API/Auth/ClaimsPrincipalExtensions.cs` | Use `AuthConstants`, add `GetEmail`/`IsApiKeyAuth`/`GetApiKeyScope`, change `GetUserId`/`GetCompanyId` to throw |
| `backend/src/OneBear.API/Auth/PermissionRequirement.cs` | Add API key bypass, parse JSON array permissions |
| `backend/src/OneBear.API/Auth/CompanyIdValidationFilter.cs` | Change to `IAsyncActionFilter`, use `AuthConstants` claim names, use `ActionArguments` |
| `backend/src/OneBear.API/Auth/DevTokenController.cs` | Inject `AuthOptions`, emit single JSON array permissions claim |
| `backend/src/OneBear.API/Program.cs` | Options binding, CORS policy rename to `"OneBear"`, Swagger API key definition, `AuthConstants` policy names |
| `backend/src/OneBear.API/Hubs/ChatHub.cs` | Use non-null `GetUserId()`/`GetCompanyId()` (throws on missing) |
| `backend/src/OneBear.API/appsettings.json` | Rename `Auth` to `Authentication`, rename `Cors:Origins` to `Cors:AllowedOrigins` |
| `backend/src/OneBear.API/appsettings.Development.json` | Same renames, remove `DevIssuer` |
| `backend/tests/OneBear.API.Tests/Auth/ApiKeyAuthHandlerTests.cs` | Test full handler with mocked options |
| `backend/tests/OneBear.API.Tests/Auth/ClaimsPrincipalExtensionsTests.cs` | Add throw tests, new method tests |
| `backend/tests/OneBear.API.Tests/Auth/PermissionHandlerTests.cs` | Add API key bypass test, JSON array format |
| `backend/tests/OneBear.API.Tests/Auth/CompanyIdValidationFilterTests.cs` | Rewrite for async + new claim names |
| `libs/shared-types/src/index.ts` | Re-export from `permissions.ts` |
| `apps/web/src/stores/auth-store.ts` | Import `Permission` from shared-types instead of local definition |
| `apps/web/src/pages/LoginPage.tsx` | Add permission checkboxes |
| `apps/web/src/routes/__root.tsx` | Use `AuthGuard` wrapper |

---

### Task 1: Create AuthConstants.cs

**Files:**
- Create: `backend/src/OneBear.API/Auth/AuthConstants.cs`
- Test: `backend/tests/OneBear.API.Tests/Auth/AuthConstantsTests.cs`

- [ ] **Step 1: Write the test file**

```csharp
// tests/OneBear.API.Tests/Auth/AuthConstantsTests.cs
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class AuthConstantsTests
{
    [Fact]
    public void Schemes_ShouldHaveExpectedValues()
    {
        Assert.Equal("Bearer", AuthConstants.JwtBearerScheme);
        Assert.Equal("ApiKey", AuthConstants.ApiKeyScheme);
    }

    [Fact]
    public void ClaimTypes_ShouldHaveExpectedValues()
    {
        Assert.Equal("sub", AuthConstants.ClaimUserId);
        Assert.Equal("company_id", AuthConstants.ClaimCompanyId);
        Assert.Equal("permissions", AuthConstants.ClaimPermissions);
        Assert.Equal("display_name", AuthConstants.ClaimDisplayName);
        Assert.Equal("email", AuthConstants.ClaimEmail);
    }

    [Fact]
    public void ApiKeyScopes_ShouldHaveExpectedValues()
    {
        Assert.Equal("webhook", AuthConstants.ApiKeyScopeWebhook);
        Assert.Equal("ai-service", AuthConstants.ApiKeyScopeAiService);
        Assert.Equal("storage", AuthConstants.ApiKeyScopeStorage);
        Assert.Equal("system-bot", AuthConstants.ApiKeyScopeSystemBot);
    }

    [Fact]
    public void PolicyNames_ShouldHaveExpectedValues()
    {
        Assert.Equal("Chat.View", AuthConstants.PolicyChatView);
        Assert.Equal("Chat.Resolve", AuthConstants.PolicyChatResolve);
        Assert.Equal("Chat.Mention", AuthConstants.PolicyChatMention);
        Assert.Equal("Chat.AssignAll", AuthConstants.PolicyChatAssignAll);
        Assert.Equal("Chat.Admin", AuthConstants.PolicyChatAdmin);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=AuthConstantsTests" --no-restore -v q`
Expected: FAIL — `AuthConstants` class does not exist

- [ ] **Step 3: Create AuthConstants.cs**

```csharp
// src/OneBear.API/Auth/AuthConstants.cs
namespace OneBear.API.Auth;

public static class AuthConstants
{
    // Authentication schemes
    public const string JwtBearerScheme = "Bearer";
    public const string ApiKeyScheme = "ApiKey";

    // Claim types
    public const string ClaimUserId = "sub";
    public const string ClaimCompanyId = "company_id";
    public const string ClaimPermissions = "permissions";
    public const string ClaimDisplayName = "display_name";
    public const string ClaimEmail = "email";

    // API key claims
    public const string ClaimAuthMethod = "auth_method";
    public const string ClaimAuthMethodApiKey = "api_key";
    public const string ClaimApiKeyScope = "api_key_scope";

    // API key scopes
    public const string ApiKeyScopeWebhook = "webhook";
    public const string ApiKeyScopeAiService = "ai-service";
    public const string ApiKeyScopeStorage = "storage";
    public const string ApiKeyScopeSystemBot = "system-bot";

    // Policy names
    public const string PolicyChatView = "Chat.View";
    public const string PolicyChatResolve = "Chat.Resolve";
    public const string PolicyChatMention = "Chat.Mention";
    public const string PolicyChatAssignAll = "Chat.AssignAll";
    public const string PolicyChatAdmin = "Chat.Admin";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=AuthConstantsTests" --no-restore -v q`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Auth/AuthConstants.cs backend/tests/OneBear.API.Tests/Auth/AuthConstantsTests.cs
git commit -m "feat(auth): add AuthConstants with centralized scheme, claim, scope, and policy names"
```

---

### Task 2: Create AuthOptions + ApiKeyOptions + Update appsettings

**Files:**
- Create: `backend/src/OneBear.API/Auth/AuthOptions.cs`
- Create: `backend/src/OneBear.API/Auth/ApiKeyOptions.cs`
- Modify: `backend/src/OneBear.API/appsettings.json`
- Modify: `backend/src/OneBear.API/appsettings.Development.json`

- [ ] **Step 1: Create AuthOptions.cs**

```csharp
// src/OneBear.API/Auth/AuthOptions.cs
namespace OneBear.API.Auth;

public class AuthOptions
{
    public const string SectionName = "Authentication";

    public string Authority { get; set; } = string.Empty;
    public string Audience { get; set; } = "onebear-api";
    public bool RequireHttpsMetadata { get; set; } = true;
    public string DevSigningKey { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Create ApiKeyOptions.cs**

```csharp
// src/OneBear.API/Auth/ApiKeyOptions.cs
namespace OneBear.API.Auth;

public class ApiKeyOptions
{
    public const string SectionName = "ApiKeys";

    public string Primary { get; set; } = string.Empty;
    public string Secondary { get; set; } = string.Empty;
    public string AiService { get; set; } = string.Empty;
}
```

- [ ] **Step 3: Update appsettings.json — rename sections**

Change the `"Auth"` section to `"Authentication"` and `"Cors:Origins"` to `"Cors:AllowedOrigins"`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Authentication": {
    "Authority": "https://login.gofive.co.th",
    "Audience": "onebear-api"
  },
  "Cors": {
    "AllowedOrigins": [ "http://localhost:5173" ]
  },
  "ConnectionStrings": {
    "CosmosDb": "AccountEndpoint=https://localhost:8081;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "Redis": "localhost:6379",
    "RabbitMq": "amqp://guest:guest@localhost:5672"
  },
  "Azure": {
    "SignalR": {
      "ConnectionString": ""
    },
    "BlobStorage": {
      "ConnectionString": "UseDevelopmentStorage=true"
    }
  }
}
```

- [ ] **Step 4: Update appsettings.Development.json — rename sections, remove DevIssuer**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Authentication": {
    "Authority": "https://login.gofive.co.th",
    "Audience": "onebear-api",
    "DevSigningKey": "OneBear-Dev-Signing-Key-Min-32-Chars!!"
  },
  "ApiKeys": {
    "Primary": "dev-webhook-key-change-in-production",
    "Secondary": "",
    "AiService": "dev-ai-key-change-in-production"
  },
  "Cors": {
    "AllowedOrigins": [ "http://localhost:5173", "http://localhost:5174" ]
  },
  "ConnectionStrings": {
    "CosmosDb": "AccountEndpoint=https://localhost:8081;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "Redis": "localhost:6379",
    "RabbitMq": "amqp://guest:guest@localhost:5672"
  },
  "Azure": {
    "SignalR": {
      "ConnectionString": ""
    },
    "BlobStorage": {
      "ConnectionString": "UseDevelopmentStorage=true"
    }
  }
}
```

- [ ] **Step 5: Verify the project still builds**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet build --no-restore -v q`
Expected: Build succeeds (new files are additive; appsettings renames don't affect compile)

- [ ] **Step 6: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Auth/AuthOptions.cs backend/src/OneBear.API/Auth/ApiKeyOptions.cs backend/src/OneBear.API/appsettings.json backend/src/OneBear.API/appsettings.Development.json
git commit -m "feat(auth): add AuthOptions/ApiKeyOptions config types, rename appsettings sections"
```

---

### Task 3: Refactor Program.cs — Options Binding, CORS, Swagger, Policies

**Files:**
- Modify: `backend/src/OneBear.API/Program.cs`

This task rewrites the auth/CORS/Swagger sections of Program.cs to use the new options types and constants. After this task, the config pipeline uses `AuthOptions`/`ApiKeyOptions` binding, CORS policy is named `"OneBear"`, Swagger has both Bearer and ApiKey definitions, and policies use `AuthConstants`.

**Important:** This task also updates the JWT config reads from `"Auth:*"` to the options-pattern approach, fixing the runtime breakage caused by the appsettings rename in Task 2.

- [ ] **Step 1: Rewrite Program.cs**

Replace the entire file with:

```csharp
// src/OneBear.API/Program.cs
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
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

// Bind configuration
AuthOptions authOptions = builder.Configuration
    .GetSection(AuthOptions.SectionName).Get<AuthOptions>() ?? new AuthOptions();
builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.Configure<ApiKeyOptions>(builder.Configuration.GetSection(ApiKeyOptions.SectionName));

// Swagger with JWT + API Key auth UI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "One Bear API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token. Get one from POST /api/v1/dev/token in development."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
    options.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Name = "X-Api-Key",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Description = "Enter API key for service-to-service calls"
    });
});

// Authentication
bool isDevMode = !string.IsNullOrEmpty(authOptions.DevSigningKey);

AuthenticationBuilder authBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
});

authBuilder.AddJwtBearer(options =>
{
    if (isDevMode)
    {
        // Dev mode: symmetric key validation (no IdP needed)
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = true,
            ValidAudience = authOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.DevSigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    }
    else
    {
        // Production: GoFive IdP RS256 JWKS validation
        options.Authority = authOptions.Authority;
        options.RequireHttpsMetadata = authOptions.RequireHttpsMetadata;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = authOptions.Authority,
            ValidateAudience = true,
            ValidAudience = authOptions.Audience,
            RequireSignedTokens = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    }

    // SignalR: extract token from query string for hub connections only
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            string? accessToken = context.Request.Query["access_token"];
            PathString path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// API Key authentication
authBuilder.AddScheme<AuthenticationSchemeOptions, ApiKeyAuthHandler>(
    AuthConstants.ApiKeyScheme, options => { });

// Authorization (5 permission policies)
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthConstants.PolicyChatView,
        policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatView)));
    options.AddPolicy(AuthConstants.PolicyChatResolve,
        policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatResolved)));
    options.AddPolicy(AuthConstants.PolicyChatMention,
        policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatMention)));
    options.AddPolicy(AuthConstants.PolicyChatAssignAll,
        policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatAssignAllCompany)));
    options.AddPolicy(AuthConstants.PolicyChatAdmin,
        policy => policy.Requirements.Add(new PermissionRequirement(Permission.ChatAccessAllData)));
});

// CORS — explicit origin allowlist (PERM-03)
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

app.UseCors("OneBear");
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
```

- [ ] **Step 2: Verify the project builds**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet build --no-restore -v q`
Expected: Build succeeds. Note: `ApiKeyAuthHandler` still uses the old `ApiKeyAuthOptions` class and `IConfiguration` — that's updated in Task 4.

- [ ] **Step 3: Run all existing tests to check for regressions**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --no-restore -v q`
Expected: All existing tests pass (tests don't depend on DI container or config sections)

- [ ] **Step 4: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Program.cs
git commit -m "refactor(auth): rewrite Program.cs with options binding, OneBear CORS, Swagger ApiKey, AuthConstants policies"
```

---

### Task 4: Refactor ApiKeyAuthHandler — Options Pattern + Claim Name Alignment

**Files:**
- Modify: `backend/src/OneBear.API/Auth/ApiKeyAuthHandler.cs`
- Modify: `backend/tests/OneBear.API.Tests/Auth/ApiKeyAuthHandlerTests.cs`

Changes: Remove `ApiKeyAuthOptions` class (use `AuthenticationSchemeOptions` + `IOptions<ApiKeyOptions>`). Change claims from `ClaimTypes.AuthenticationMethod = "ApiKey"` / `"scope"` to `"auth_method" = "api_key"` / `"api_key_scope"`. Inject `ApiKeyOptions` via `IOptions<>`.

- [ ] **Step 1: Rewrite the test file**

```csharp
// tests/OneBear.API.Tests/Auth/ApiKeyAuthHandlerTests.cs
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class ApiKeyAuthHandlerTests
{
    private readonly ApiKeyOptions _apiKeyOptions = new()
    {
        Primary = "primary-key-for-testing",
        Secondary = "secondary-key-for-testing",
        AiService = "ai-service-key-for-testing"
    };

    private async Task<AuthenticateResult> RunHandler(string? apiKeyHeaderValue)
    {
        IOptionsMonitor<AuthenticationSchemeOptions> schemeOptions =
            new TestOptionsMonitor<AuthenticationSchemeOptions>(new AuthenticationSchemeOptions());
        IOptions<ApiKeyOptions> keyOptions = Options.Create(_apiKeyOptions);
        ILoggerFactory loggerFactory = NullLoggerFactory.Instance;

        ApiKeyAuthHandler handler = new(schemeOptions, loggerFactory, UrlEncoder.Default, keyOptions);

        AuthenticationScheme scheme = new(AuthConstants.ApiKeyScheme, null, typeof(ApiKeyAuthHandler));
        DefaultHttpContext httpContext = new();
        if (apiKeyHeaderValue != null)
        {
            httpContext.Request.Headers["X-Api-Key"] = apiKeyHeaderValue;
        }

        await handler.InitializeAsync(scheme, httpContext);
        return await handler.AuthenticateAsync();
    }

    [Fact]
    public async Task ShouldAuthenticate_WhenValidPrimaryKey()
    {
        AuthenticateResult result = await RunHandler("primary-key-for-testing");

        Assert.True(result.Succeeded);
        Assert.True(result.Principal!.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey));
        Assert.True(result.Principal!.HasClaim(AuthConstants.ClaimApiKeyScope, AuthConstants.ApiKeyScopeWebhook));
    }

    [Fact]
    public async Task ShouldAuthenticate_WhenValidSecondaryKey()
    {
        AuthenticateResult result = await RunHandler("secondary-key-for-testing");

        Assert.True(result.Succeeded);
        Assert.True(result.Principal!.HasClaim(AuthConstants.ClaimApiKeyScope, AuthConstants.ApiKeyScopeWebhook));
    }

    [Fact]
    public async Task ShouldAuthenticate_WhenValidAiServiceKey()
    {
        AuthenticateResult result = await RunHandler("ai-service-key-for-testing");

        Assert.True(result.Succeeded);
        Assert.True(result.Principal!.HasClaim(AuthConstants.ClaimApiKeyScope, AuthConstants.ApiKeyScopeAiService));
    }

    [Fact]
    public async Task ShouldFail_WhenInvalidKey()
    {
        AuthenticateResult result = await RunHandler("wrong-key");

        Assert.True(result.Failure is not null);
        Assert.Contains("Invalid API key", result.Failure!.Message);
    }

    [Fact]
    public async Task ShouldReturnNoResult_WhenNoHeader()
    {
        AuthenticateResult result = await RunHandler(null);

        Assert.True(result.None);
    }

    [Fact]
    public async Task ShouldSkipEmptySecondaryKey()
    {
        _apiKeyOptions.Secondary = "";
        AuthenticateResult result = await RunHandler("");

        // Empty string should not match empty secondary
        Assert.False(result.Succeeded);
    }

    // ConstantTimeEquals unit tests
    [Fact]
    public void ConstantTimeEquals_ShouldReturnTrue_WhenStringsMatch()
    {
        Assert.True(ApiKeyAuthHandler.ConstantTimeEquals("test-key-123", "test-key-123"));
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenStringsDiffer()
    {
        Assert.False(ApiKeyAuthHandler.ConstantTimeEquals("test-key-123", "test-key-456"));
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenNullOrEmpty()
    {
        Assert.False(ApiKeyAuthHandler.ConstantTimeEquals(null!, "test"));
        Assert.False(ApiKeyAuthHandler.ConstantTimeEquals("test", null!));
        Assert.False(ApiKeyAuthHandler.ConstantTimeEquals("", "test"));
        Assert.False(ApiKeyAuthHandler.ConstantTimeEquals("", ""));
    }
}

/// <summary>Minimal IOptionsMonitor implementation for testing AuthenticationHandler.</summary>
internal class TestOptionsMonitor<T> : IOptionsMonitor<T> where T : class, new()
{
    public TestOptionsMonitor(T currentValue) => CurrentValue = currentValue;
    public T CurrentValue { get; }
    public T Get(string? name) => CurrentValue;
    public IDisposable? OnChange(Action<T, string?> listener) => null;
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=ApiKeyAuthHandlerTests" --no-restore -v q`
Expected: FAIL — constructor signature mismatch and claim name assertions fail

- [ ] **Step 3: Rewrite ApiKeyAuthHandler.cs**

```csharp
// src/OneBear.API/Auth/ApiKeyAuthHandler.cs
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace OneBear.API.Auth;

public class ApiKeyAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly ApiKeyOptions _apiKeyOptions;

    public ApiKeyAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IOptions<ApiKeyOptions> apiKeyOptions) : base(options, logger, encoder)
    {
        _apiKeyOptions = apiKeyOptions.Value;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Api-Key", out Microsoft.Extensions.Primitives.StringValues headerValue))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        string providedKey = headerValue.ToString();

        // Check against configured keys (support dual-key rotation)
        string? matchedScope = null;

        if (ConstantTimeEquals(providedKey, _apiKeyOptions.Primary) ||
            (!string.IsNullOrEmpty(_apiKeyOptions.Secondary) && ConstantTimeEquals(providedKey, _apiKeyOptions.Secondary)))
        {
            matchedScope = AuthConstants.ApiKeyScopeWebhook;
        }

        if (matchedScope == null && !string.IsNullOrEmpty(_apiKeyOptions.AiService) &&
            ConstantTimeEquals(providedKey, _apiKeyOptions.AiService))
        {
            matchedScope = AuthConstants.ApiKeyScopeAiService;
        }

        if (matchedScope == null)
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key"));
        }

        Claim[] claims =
        [
            new(ClaimTypes.Name, $"service:{matchedScope}"),
            new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey),
            new(AuthConstants.ClaimApiKeyScope, matchedScope)
        ];

        ClaimsIdentity identity = new(claims, AuthConstants.ApiKeyScheme);
        ClaimsPrincipal principal = new(identity);
        AuthenticationTicket ticket = new(principal, AuthConstants.ApiKeyScheme);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    /// <summary>Constant-time string comparison to prevent timing attacks (V-18).</summary>
    internal static bool ConstantTimeEquals(string a, string b)
    {
        if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b)) return false;
        byte[] aBytes = Encoding.UTF8.GetBytes(a);
        byte[] bBytes = Encoding.UTF8.GetBytes(b);
        return CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=ApiKeyAuthHandlerTests" --no-restore -v q`
Expected: PASS (9 tests)

- [ ] **Step 5: Run full build to verify no compile errors**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet build --no-restore -v q`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Auth/ApiKeyAuthHandler.cs backend/tests/OneBear.API.Tests/Auth/ApiKeyAuthHandlerTests.cs
git commit -m "refactor(auth): ApiKeyAuthHandler uses IOptions<ApiKeyOptions> and standardized claim names"
```

---

### Task 5: Refactor ClaimsPrincipalExtensions — AuthConstants + Throw + New Methods

**Files:**
- Modify: `backend/src/OneBear.API/Auth/ClaimsPrincipalExtensions.cs`
- Modify: `backend/tests/OneBear.API.Tests/Auth/ClaimsPrincipalExtensionsTests.cs`
- Modify: `backend/src/OneBear.API/Hubs/ChatHub.cs` (update call sites)

Changes: Use `AuthConstants` for claim names. `GetUserId()`/`GetCompanyId()` now throw `UnauthorizedAccessException` instead of returning null. Add `GetEmail()`, `IsApiKeyAuth()`, `GetApiKeyScope()`. `GetPermissions()` parses JSON array (single claim) instead of multiple individual claims.

- [ ] **Step 1: Rewrite the test file**

```csharp
// tests/OneBear.API.Tests/Auth/ClaimsPrincipalExtensionsTests.cs
using System.Security.Claims;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class ClaimsPrincipalExtensionsTests
{
    // --- GetUserId ---

    [Fact]
    public void GetUserId_ShouldReturnSubClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimUserId, "user-123")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        string userId = principal.GetUserId();

        Assert.Equal("user-123", userId);
    }

    [Fact]
    public void GetUserId_ShouldThrow_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Throws<UnauthorizedAccessException>(() => principal.GetUserId());
    }

    // --- GetCompanyId ---

    [Fact]
    public void GetCompanyId_ShouldReturnCompanyIdClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimCompanyId, "comp-001")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        string companyId = principal.GetCompanyId();

        Assert.Equal("comp-001", companyId);
    }

    [Fact]
    public void GetCompanyId_ShouldThrow_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Throws<UnauthorizedAccessException>(() => principal.GetCompanyId());
    }

    // --- GetDisplayName ---

    [Fact]
    public void GetDisplayName_ShouldReturnClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimDisplayName, "Test User")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.Equal("Test User", principal.GetDisplayName());
    }

    [Fact]
    public void GetDisplayName_ShouldReturnNull_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Null(principal.GetDisplayName());
    }

    // --- GetEmail ---

    [Fact]
    public void GetEmail_ShouldReturnClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimEmail, "test@example.com")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.Equal("test@example.com", principal.GetEmail());
    }

    [Fact]
    public void GetEmail_ShouldReturnNull_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Null(principal.GetEmail());
    }

    // --- GetPermissions (JSON array format) ---

    [Fact]
    public void GetPermissions_ShouldParseJsonArray()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002,3005]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        int[] permissions = principal.GetPermissions();

        Assert.Equal(3, permissions.Length);
        Assert.Contains(3001, permissions);
        Assert.Contains(3002, permissions);
        Assert.Contains(3005, permissions);
    }

    [Fact]
    public void GetPermissions_ShouldReturnEmpty_WhenNoClaim()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        int[] permissions = principal.GetPermissions();

        Assert.Empty(permissions);
    }

    [Fact]
    public void GetPermissions_ShouldReturnEmpty_WhenEmptyArray()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        int[] permissions = principal.GetPermissions();

        Assert.Empty(permissions);
    }

    // --- HasPermission ---

    [Fact]
    public void HasPermission_ShouldReturnTrue_WhenPresent()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.True(principal.HasPermission(3001));
    }

    [Fact]
    public void HasPermission_ShouldReturnFalse_WhenAbsent()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.False(principal.HasPermission(3005));
    }

    // --- IsApiKeyAuth ---

    [Fact]
    public void IsApiKeyAuth_ShouldReturnTrue_WhenApiKeyMethod()
    {
        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.True(principal.IsApiKeyAuth());
    }

    [Fact]
    public void IsApiKeyAuth_ShouldReturnFalse_WhenNotApiKey()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.False(principal.IsApiKeyAuth());
    }

    // --- GetApiKeyScope ---

    [Fact]
    public void GetApiKeyScope_ShouldReturnScope()
    {
        Claim[] claims = [new(AuthConstants.ClaimApiKeyScope, "webhook")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.Equal("webhook", principal.GetApiKeyScope());
    }

    [Fact]
    public void GetApiKeyScope_ShouldReturnNull_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Null(principal.GetApiKeyScope());
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=ClaimsPrincipalExtensionsTests" --no-restore -v q`
Expected: FAIL — missing methods, return type mismatches

- [ ] **Step 3: Rewrite ClaimsPrincipalExtensions.cs**

```csharp
// src/OneBear.API/Auth/ClaimsPrincipalExtensions.cs
using System.Security.Claims;
using System.Text.Json;

namespace OneBear.API.Auth;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimUserId)
           ?? throw new UnauthorizedAccessException("Missing user ID claim");

    public static string GetCompanyId(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimCompanyId)
           ?? throw new UnauthorizedAccessException("Missing company ID claim");

    public static string? GetDisplayName(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimDisplayName);

    public static string? GetEmail(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimEmail);

    public static int[] GetPermissions(this ClaimsPrincipal principal)
    {
        string? claim = principal.FindFirstValue(AuthConstants.ClaimPermissions);
        if (string.IsNullOrEmpty(claim)) return [];
        return JsonSerializer.Deserialize<int[]>(claim) ?? [];
    }

    public static bool HasPermission(this ClaimsPrincipal principal, int permissionId)
        => principal.GetPermissions().Contains(permissionId);

    public static bool IsApiKeyAuth(this ClaimsPrincipal principal)
        => principal.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey);

    public static string? GetApiKeyScope(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimApiKeyScope);
}
```

- [ ] **Step 4: Update ChatHub.cs to use non-null GetUserId/GetCompanyId**

In `backend/src/OneBear.API/Hubs/ChatHub.cs`, change lines 19-20 from:

```csharp
        string userId = Context.User?.GetUserId() ?? "anonymous";
        string companyId = Context.User?.GetCompanyId() ?? "unknown";
```

to:

```csharp
        string userId = Context.User!.GetUserId();
        string companyId = Context.User!.GetCompanyId();
```

The `[Authorize]` attribute on `ChatHub` guarantees `Context.User` is non-null with valid claims. The `!` operator is safe here.

Also check all other usages of `GetUserId()` / `GetCompanyId()` in ChatHub's other methods (e.g., `AttendRoom`, `ExitRoom`, `SendMessage`, `SendTyping`) and apply the same change — replace `?.GetUserId() ?? "anonymous"` with `!.GetUserId()`.

- [ ] **Step 5: Run ClaimsPrincipalExtensions tests**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=ClaimsPrincipalExtensionsTests" --no-restore -v q`
Expected: PASS (18 tests)

- [ ] **Step 6: Run full build to verify ChatHub changes compile**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet build --no-restore -v q`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Auth/ClaimsPrincipalExtensions.cs backend/tests/OneBear.API.Tests/Auth/ClaimsPrincipalExtensionsTests.cs backend/src/OneBear.API/Hubs/ChatHub.cs
git commit -m "refactor(auth): ClaimsPrincipalExtensions uses AuthConstants, throws on missing required claims, adds new methods"
```

---

### Task 6: Refactor PermissionHandler — API Key Bypass + JSON Array

**Files:**
- Modify: `backend/src/OneBear.API/Auth/PermissionRequirement.cs`
- Modify: `backend/tests/OneBear.API.Tests/Auth/PermissionHandlerTests.cs`

Changes: Add API key bypass (service-to-service calls auto-succeed permission checks). Parse permissions from single JSON array claim instead of multiple individual claims.

- [ ] **Step 1: Rewrite the test file**

```csharp
// tests/OneBear.API.Tests/Auth/PermissionHandlerTests.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class PermissionHandlerTests
{
    private readonly PermissionHandler _handler = new();

    private AuthorizationHandlerContext CreateContext(PermissionRequirement requirement, ClaimsPrincipal user)
    {
        return new AuthorizationHandlerContext([requirement], user, null);
    }

    [Fact]
    public async Task ShouldSucceed_WhenUserHasRequiredPermission()
    {
        PermissionRequirement requirement = new(3001);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldFail_WhenUserMissingRequiredPermission()
    {
        PermissionRequirement requirement = new(3002);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldFail_WhenNoPermissionsClaim()
    {
        PermissionRequirement requirement = new(3001);
        ClaimsPrincipal user = new(new ClaimsIdentity(Array.Empty<Claim>(), "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldSucceed_WhenMultiplePermissionsAndOneMatches()
    {
        PermissionRequirement requirement = new(3005);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002,3003,3004,3005]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldSucceed_WhenApiKeyAuth()
    {
        PermissionRequirement requirement = new(3001);
        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldFail_WhenPermissionsClaimIsEmptyArray()
    {
        PermissionRequirement requirement = new(3001);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=PermissionHandlerTests" --no-restore -v q`
Expected: FAIL — API key bypass test fails, JSON array format tests fail

- [ ] **Step 3: Rewrite PermissionRequirement.cs**

```csharp
// src/OneBear.API/Auth/PermissionRequirement.cs
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace OneBear.API.Auth;

public class PermissionRequirement : IAuthorizationRequirement
{
    public int PermissionId { get; }
    public PermissionRequirement(int permissionId) => PermissionId = permissionId;
}

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // API key auth bypasses permission checks (service-to-service)
        if (context.User.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check JWT permissions claim (JSON array)
        Claim? permissionsClaim = context.User.FindFirst(AuthConstants.ClaimPermissions);
        if (permissionsClaim is null)
            return Task.CompletedTask; // Fail — no permissions claim

        int[] permissions = JsonSerializer.Deserialize<int[]>(permissionsClaim.Value) ?? [];

        if (permissions.Contains(requirement.PermissionId))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=PermissionHandlerTests" --no-restore -v q`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Auth/PermissionRequirement.cs backend/tests/OneBear.API.Tests/Auth/PermissionHandlerTests.cs
git commit -m "refactor(auth): PermissionHandler parses JSON array permissions, adds API key bypass"
```

---

### Task 7: Refactor CompanyIdValidationFilter — Async + AuthConstants

**Files:**
- Modify: `backend/src/OneBear.API/Auth/CompanyIdValidationFilter.cs`
- Modify: `backend/tests/OneBear.API.Tests/Auth/CompanyIdValidationFilterTests.cs`

Changes: Switch from `IActionFilter` to `IAsyncActionFilter`. Use `HasClaim("auth_method", "api_key")` for API key bypass. Use `ActionArguments` for companyId extraction (matches spec section 6). Use `FindFirstValue(AuthConstants.ClaimCompanyId)`.

- [ ] **Step 1: Rewrite the test file**

```csharp
// tests/OneBear.API.Tests/Auth/CompanyIdValidationFilterTests.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class CompanyIdValidationFilterTests
{
    private readonly CompanyIdValidationFilter _filter = new();

    private static ActionExecutingContext CreateContext(
        string? companyIdArgValue,
        ClaimsPrincipal? user = null)
    {
        DefaultHttpContext httpContext = new();
        if (user != null)
        {
            httpContext.User = user;
        }

        RouteData routeData = new();
        ActionContext actionContext = new(httpContext, routeData, new ActionDescriptor());

        Dictionary<string, object?> arguments = new();
        if (companyIdArgValue != null)
        {
            arguments["companyId"] = companyIdArgValue;
        }

        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            arguments,
            new object());
    }

    private static ClaimsPrincipal CreateJwtUser(string? companyId)
    {
        List<Claim> claims = [];
        if (companyId != null)
        {
            claims.Add(new Claim(AuthConstants.ClaimCompanyId, companyId));
        }
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    private static ClaimsPrincipal CreateApiKeyUser()
    {
        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    [Fact]
    public async Task ShouldPass_WhenCompanyIdMatchesClaim()
    {
        ClaimsPrincipal user = CreateJwtUser("company-001");
        ActionExecutingContext context = CreateContext("company-001", user);

        await _filter.OnActionExecutionAsync(context, () => Task.FromResult(new ActionExecutedContext(
            new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
            new List<IFilterMetadata>(), new object())));

        Assert.Null(context.Result);
    }

    [Fact]
    public async Task ShouldReturn403_WhenCompanyIdMismatch()
    {
        ClaimsPrincipal user = CreateJwtUser("company-001");
        ActionExecutingContext context = CreateContext("company-999", user);

        await _filter.OnActionExecutionAsync(context, () => Task.FromResult(new ActionExecutedContext(
            new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
            new List<IFilterMetadata>(), new object())));

        Assert.NotNull(context.Result);
        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public async Task ShouldReturn403_WhenMissingCompanyIdClaim()
    {
        ClaimsPrincipal user = CreateJwtUser(null);
        ActionExecutingContext context = CreateContext("company-001", user);

        await _filter.OnActionExecutionAsync(context, () => Task.FromResult(new ActionExecutedContext(
            new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
            new List<IFilterMetadata>(), new object())));

        Assert.NotNull(context.Result);
        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public async Task ShouldBypass_WhenApiKeyAuth()
    {
        bool nextCalled = false;
        ClaimsPrincipal user = CreateApiKeyUser();
        ActionExecutingContext context = CreateContext("any-company", user);

        await _filter.OnActionExecutionAsync(context, () =>
        {
            nextCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
                new List<IFilterMetadata>(), new object()));
        });

        Assert.Null(context.Result);
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldPass_WhenNoCompanyIdInArguments()
    {
        bool nextCalled = false;
        ClaimsPrincipal user = CreateJwtUser("company-001");
        ActionExecutingContext context = CreateContext(null, user);

        await _filter.OnActionExecutionAsync(context, () =>
        {
            nextCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
                new List<IFilterMetadata>(), new object()));
        });

        Assert.Null(context.Result);
        Assert.True(nextCalled);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=CompanyIdValidationFilterTests" --no-restore -v q`
Expected: FAIL — `OnActionExecutionAsync` doesn't exist yet

- [ ] **Step 3: Rewrite CompanyIdValidationFilter.cs**

```csharp
// src/OneBear.API/Auth/CompanyIdValidationFilter.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace OneBear.API.Auth;

/// <summary>
/// Validates that the companyId URL parameter matches the JWT company_id claim.
/// API key auth bypasses this check (service-to-service calls may target any company).
/// </summary>
public class CompanyIdValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // API key auth bypasses company validation (service-to-service calls may target any company)
        if (context.HttpContext.User.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey))
        {
            await next();
            return;
        }

        // Extract companyId from action arguments
        if (!context.ActionArguments.TryGetValue("companyId", out object? companyIdObj) ||
            companyIdObj is not string companyId)
        {
            await next(); // No companyId parameter — skip validation
            return;
        }

        // Extract company_id from JWT claims
        string? claimCompanyId = context.HttpContext.User.FindFirstValue(AuthConstants.ClaimCompanyId);

        if (string.IsNullOrEmpty(claimCompanyId) ||
            !string.Equals(companyId, claimCompanyId, StringComparison.Ordinal))
        {
            context.Result = new ForbidResult();
            return;
        }

        await next();
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=CompanyIdValidationFilterTests" --no-restore -v q`
Expected: PASS (5 tests)

- [ ] **Step 5: Run full build**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet build --no-restore -v q`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Auth/CompanyIdValidationFilter.cs backend/tests/OneBear.API.Tests/Auth/CompanyIdValidationFilterTests.cs
git commit -m "refactor(auth): CompanyIdValidationFilter uses IAsyncActionFilter and AuthConstants claim names"
```

---

### Task 8: Refactor DevTokenController — AuthOptions + JSON Array Permissions

**Files:**
- Modify: `backend/src/OneBear.API/Auth/DevTokenController.cs`
- Create: `backend/tests/OneBear.API.Tests/Auth/DevTokenControllerTests.cs`

Changes: Inject `AuthOptions` instead of `IConfiguration`. Emit permissions as a single JSON array claim instead of multiple individual claims. Use `AuthConstants.ClaimDisplayName` for the display name claim.

- [ ] **Step 1: Write the test file**

```csharp
// tests/OneBear.API.Tests/Auth/DevTokenControllerTests.cs
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class DevTokenControllerTests
{
    private readonly AuthOptions _authOptions = new()
    {
        DevSigningKey = "OneBear-Dev-Signing-Key-Min-32-Chars!!",
        Audience = "onebear-api"
    };

    private DevTokenController CreateController()
    {
        return new DevTokenController(Options.Create(_authOptions));
    }

    [Fact]
    public void ShouldReturnJwt_WithValidRequest()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new()
        {
            UserId = "test-user",
            CompanyId = "test-company",
            DisplayName = "Test User",
            Permissions = [3001, 3002]
        };

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);
        Assert.NotEmpty(response.AccessToken);
        Assert.Equal("Bearer", response.TokenType);
        Assert.Equal("test-user", response.UserId);
        Assert.Equal("test-company", response.CompanyId);
        Assert.Equal(new[] { 3001, 3002 }, response.Permissions);
    }

    [Fact]
    public void ShouldIncludeAllClaims_InGeneratedToken()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new()
        {
            UserId = "agent-001",
            CompanyId = "company-demo-001",
            DisplayName = "Demo Agent",
            Email = "demo@test.com",
            Permissions = [3001, 3003, 3005]
        };

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);

        // Decode JWT and verify claims
        JwtSecurityTokenHandler handler = new();
        JwtSecurityToken jwt = handler.ReadJwtToken(response.AccessToken);

        Assert.Equal("agent-001", jwt.Claims.First(c => c.Type == AuthConstants.ClaimUserId).Value);
        Assert.Equal("company-demo-001", jwt.Claims.First(c => c.Type == AuthConstants.ClaimCompanyId).Value);
        Assert.Equal("Demo Agent", jwt.Claims.First(c => c.Type == AuthConstants.ClaimDisplayName).Value);
        Assert.Equal("demo@test.com", jwt.Claims.First(c => c.Type == AuthConstants.ClaimEmail).Value);
        Assert.Equal("onebear-api", jwt.Audiences.First());

        // Permissions should be a JSON array in a single claim
        string permissionsValue = jwt.Claims.First(c => c.Type == AuthConstants.ClaimPermissions).Value;
        int[] permissions = JsonSerializer.Deserialize<int[]>(permissionsValue)!;
        Assert.Equal(new[] { 3001, 3003, 3005 }, permissions);
    }

    [Fact]
    public void ShouldUseDefaults_WhenFieldsAreNull()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new(); // All null

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);
        Assert.Equal("dev-user-001", response.UserId);
        Assert.Equal("dev-company-001", response.CompanyId);
        Assert.Equal(new[] { 3001, 3002, 3003, 3004, 3005 }, response.Permissions);
    }

    [Fact]
    public void ShouldSetCorrectExpiry()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new() { ExpiresInHours = 2 };

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);
        Assert.Equal(7200, response.ExpiresIn); // 2 hours in seconds
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=DevTokenControllerTests" --no-restore -v q`
Expected: FAIL — constructor expects `IConfiguration`, not `IOptions<AuthOptions>`

- [ ] **Step 3: Rewrite DevTokenController.cs**

```csharp
// src/OneBear.API/Auth/DevTokenController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace OneBear.API.Auth;

/// <summary>
/// Development-only endpoint to generate JWT tokens for local testing.
/// NOT registered in production environments.
/// </summary>
[ApiController]
[Route("api/v1/dev")]
public class DevTokenController : ControllerBase
{
    private readonly AuthOptions _authOptions;

    public DevTokenController(IOptions<AuthOptions> authOptions)
    {
        _authOptions = authOptions.Value;
    }

    [AllowAnonymous]
    [HttpPost("token")]
    public IActionResult GenerateToken([FromBody] DevTokenRequest request)
    {
        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_authOptions.DevSigningKey));
        SigningCredentials credentials = new(key, SecurityAlgorithms.HmacSha256);

        string userId = request.UserId ?? "dev-user-001";
        string companyId = request.CompanyId ?? "dev-company-001";
        string displayName = request.DisplayName ?? "Dev User";
        string email = request.Email ?? "dev@onebear.local";
        int[] permissions = request.Permissions ?? [3001, 3002, 3003, 3004, 3005];

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(AuthConstants.ClaimCompanyId, companyId),
            new(AuthConstants.ClaimDisplayName, displayName),
            new(AuthConstants.ClaimEmail, email),
            new(AuthConstants.ClaimPermissions, JsonSerializer.Serialize(permissions))
        ];

        int expiresInHours = request.ExpiresInHours ?? 24;
        JwtSecurityToken token = new(
            issuer: "onebear-dev",
            audience: _authOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiresInHours),
            signingCredentials: credentials);

        string tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new DevTokenResponse
        {
            AccessToken = tokenString,
            ExpiresIn = (int)TimeSpan.FromHours(expiresInHours).TotalSeconds,
            TokenType = "Bearer",
            UserId = userId,
            CompanyId = companyId,
            Permissions = permissions
        });
    }
}

public class DevTokenRequest
{
    public string? UserId { get; set; }
    public string? CompanyId { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public int[]? Permissions { get; set; }
    public int? ExpiresInHours { get; set; }
}

public class DevTokenResponse
{
    public string AccessToken { get; set; } = default!;
    public int ExpiresIn { get; set; }
    public string TokenType { get; set; } = "Bearer";
    public string UserId { get; set; } = default!;
    public string CompanyId { get; set; } = default!;
    public int[] Permissions { get; set; } = [];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=DevTokenControllerTests" --no-restore -v q`
Expected: PASS (4 tests)

- [ ] **Step 5: Run all backend tests**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --no-restore -v q`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Auth/DevTokenController.cs backend/tests/OneBear.API.Tests/Auth/DevTokenControllerTests.cs
git commit -m "refactor(auth): DevTokenController uses AuthOptions, emits JSON array permissions claim"
```

---

### Task 9: SubscriptionCheckMiddleware (SUB-01)

**Files:**
- Create: `backend/src/OneBear.API/Middleware/SubscriptionCheckMiddleware.cs`
- Create: `backend/tests/OneBear.API.Tests/Middleware/SubscriptionCheckMiddlewareTests.cs`
- Modify: `backend/src/OneBear.API/Program.cs` (register middleware)

This middleware checks company subscription status after auth. Expired/TrialExpired subscriptions get 403. Uses Redis cache with 5-min TTL. Skips for API key auth and dev environment.

**Note:** The actual Client Portal integration is not implemented yet — this creates the middleware skeleton that checks a cached subscription status. The real HTTP call to Client Portal will be wired in a later step. For now, dev environment always skips this check.

- [ ] **Step 1: Write the test file**

```csharp
// tests/OneBear.API.Tests/Middleware/SubscriptionCheckMiddlewareTests.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OneBear.API.Auth;
using OneBear.API.Middleware;
using OneBear.Domain.Interfaces;
using Moq;

namespace OneBear.API.Tests.Middleware;

public class SubscriptionCheckMiddlewareTests
{
    private readonly Mock<ICacheService> _cacheService = new();

    private SubscriptionCheckMiddleware CreateMiddleware(RequestDelegate next, bool isDevelopment = true)
    {
        return new SubscriptionCheckMiddleware(next, isDevelopment);
    }

    private static DefaultHttpContext CreateHttpContext(ClaimsPrincipal? user = null)
    {
        DefaultHttpContext context = new();
        if (user != null)
        {
            context.User = user;
        }
        return context;
    }

    [Fact]
    public async Task ShouldSkip_WhenDevelopmentEnvironment()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: true);

        DefaultHttpContext context = CreateHttpContext();
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldSkip_WhenApiKeyAuth()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldSkip_WhenUserNotAuthenticated()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        DefaultHttpContext context = CreateHttpContext(new ClaimsPrincipal());
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldReturn403_WhenSubscriptionExpired()
    {
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ => Task.CompletedTask, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-expired")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-expired", default))
            .ReturnsAsync("Expired");
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.Equal(403, context.Response.StatusCode);
    }

    [Fact]
    public async Task ShouldReturn403_WhenSubscriptionTrialExpired()
    {
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ => Task.CompletedTask, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-trial-expired")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-trial-expired", default))
            .ReturnsAsync("TrialExpired");
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.Equal(403, context.Response.StatusCode);
    }

    [Fact]
    public async Task ShouldPass_WhenSubscriptionActive()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-active")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-active", default))
            .ReturnsAsync("Active");
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldPass_WhenNoSubscriptionCached()
    {
        // When no subscription status is cached, allow through (will be populated by Client Portal call later)
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-unknown")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-unknown", default))
            .ReturnsAsync((string?)null);
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    private IServiceProvider CreateServiceProvider()
    {
        Mock<IServiceProvider> provider = new();
        provider.Setup(p => p.GetService(typeof(ICacheService))).Returns(_cacheService.Object);
        return provider.Object;
    }
}
```

- [ ] **Step 2: Check if Moq is available in the test project**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && grep -i "moq" tests/OneBear.API.Tests/OneBear.API.Tests.csproj`

If Moq is not installed, add it:
Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet add tests/OneBear.API.Tests package Moq`

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=SubscriptionCheckMiddlewareTests" --no-restore -v q`
Expected: FAIL — `SubscriptionCheckMiddleware` class does not exist

- [ ] **Step 4: Create SubscriptionCheckMiddleware.cs**

```csharp
// src/OneBear.API/Middleware/SubscriptionCheckMiddleware.cs
using System.Text.Json;
using OneBear.API.Auth;
using OneBear.Domain.Interfaces;

namespace OneBear.API.Middleware;

/// <summary>
/// Checks company subscription status after authentication.
/// Returns 403 for expired/trial-expired subscriptions.
/// Skips for API key auth and development environment.
/// </summary>
public class SubscriptionCheckMiddleware
{
    private readonly RequestDelegate _next;
    private readonly bool _isDevelopment;

    public SubscriptionCheckMiddleware(RequestDelegate next, bool isDevelopment)
    {
        _next = next;
        _isDevelopment = isDevelopment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip in development
        if (_isDevelopment)
        {
            await _next(context);
            return;
        }

        // Skip for unauthenticated requests (auth middleware handles this)
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        // Skip for API key auth (service-to-service)
        if (context.User.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey))
        {
            await _next(context);
            return;
        }

        // Get company ID from claims
        string? companyId = context.User.FindFirst(AuthConstants.ClaimCompanyId)?.Value;
        if (string.IsNullOrEmpty(companyId))
        {
            await _next(context);
            return;
        }

        // Check cached subscription status
        ICacheService cacheService = context.RequestServices.GetRequiredService<ICacheService>();
        string? subscriptionStatus = await cacheService.GetAsync<string>($"subscription:{companyId}");

        if (subscriptionStatus is "Expired" or "TrialExpired")
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = "subscription_expired",
                message = "Your subscription has expired"
            }));
            return;
        }

        await _next(context);
    }
}

public static class SubscriptionCheckMiddlewareExtensions
{
    public static IApplicationBuilder UseSubscriptionCheck(this IApplicationBuilder app, bool isDevelopment)
    {
        return app.UseMiddleware<SubscriptionCheckMiddleware>(isDevelopment);
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test --filter "ClassName=SubscriptionCheckMiddlewareTests" --no-restore -v q`
Expected: PASS (7 tests)

- [ ] **Step 6: Register middleware in Program.cs**

In `backend/src/OneBear.API/Program.cs`, add the subscription check middleware after authentication and before authorization. Find the line:

```csharp
app.UseAuthentication();
app.UseAuthorization();
```

Add between them:

```csharp
app.UseAuthentication();
app.UseSubscriptionCheck(app.Environment.IsDevelopment());
app.UseAuthorization();
```

Add the using statement at the top if not already present:
```csharp
using OneBear.API.Middleware;
```

(This using already exists for `ExceptionHandlingMiddleware`, so no change needed.)

- [ ] **Step 7: Run full build + tests**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet build --no-restore -v q && dotnet test --no-restore -v q`
Expected: Build succeeds, all tests pass

- [ ] **Step 8: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add backend/src/OneBear.API/Middleware/SubscriptionCheckMiddleware.cs backend/tests/OneBear.API.Tests/Middleware/SubscriptionCheckMiddlewareTests.cs backend/src/OneBear.API/Program.cs
git commit -m "feat(auth): add SubscriptionCheckMiddleware for subscription status enforcement (SUB-01)"
```

---

### Task 10: Frontend — Shared Permission Constants + Auth Store Update

**Files:**
- Create: `libs/shared-types/src/permissions.ts`
- Modify: `libs/shared-types/src/index.ts`
- Modify: `apps/web/src/stores/auth-store.ts`

- [ ] **Step 1: Create permissions.ts**

```typescript
// libs/shared-types/src/permissions.ts
export const Permission = {
	ChatView: 3001,
	ChatResolved: 3002,
	ChatMention: 3003,
	ChatAssignAllCompany: 3004,
	ChatAccessAllData: 3005,
} as const

export type PermissionId = (typeof Permission)[keyof typeof Permission]
```

- [ ] **Step 2: Add export to index.ts**

In `libs/shared-types/src/index.ts`, add at the end:

```typescript
export { Permission, type PermissionId } from './permissions'
```

- [ ] **Step 3: Update auth-store.ts — import from shared-types**

Replace the local `Permission` constant block at the bottom of `apps/web/src/stores/auth-store.ts`:

Remove lines 64-71 (the local `Permission` definition):
```typescript
// Permission constants matching backend
export const Permission = {
	ChatView: 3001,
	ChatResolve: 3002,
	ChatMention: 3003,
	ChatAssignAll: 3004,
	ChatAdmin: 3005,
} as const
```

Replace with a re-export from shared-types:
```typescript
export { Permission } from '@one-bear/shared-types'
```

Also add the import at the top:
```typescript
import type { PermissionId } from '@one-bear/shared-types'
```

**Note:** If the shared-types lib uses a different import path (e.g., `../../libs/shared-types/src` or `@libs/shared-types`), check `tsconfig.base.json` for the path alias and use whatever is configured. Common patterns are `@one-bear/shared-types` or `@libs/shared-types`.

- [ ] **Step 4: Verify frontend builds**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx nx build shared-types 2>/dev/null || echo "No build target, checking TypeScript..." && npx tsc --noEmit -p apps/web/tsconfig.json 2>/dev/null || echo "Check import path"`

If the import path is wrong, check `tsconfig.base.json` for the correct path alias and adjust the import.

- [ ] **Step 5: Run auth-store tests**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx vitest run apps/web/src/stores/auth-store.test.ts --reporter=verbose`
Expected: All existing tests still pass. Note: The permission constant names changed (ChatResolve → ChatResolved, ChatAssignAll → ChatAssignAllCompany, ChatAdmin → ChatAccessAllData). If any test references the old names, update them.

- [ ] **Step 6: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add libs/shared-types/src/permissions.ts libs/shared-types/src/index.ts apps/web/src/stores/auth-store.ts
git commit -m "feat(auth): add shared Permission constants, update auth-store to import from shared-types"
```

---

### Task 11: Frontend — AuthGuard Component + Tests

**Files:**
- Create: `apps/web/src/components/AuthGuard.tsx`
- Create: `apps/web/src/components/AuthGuard.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// apps/web/src/components/AuthGuard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from './AuthGuard'
import { useAuthStore } from '../stores/auth-store'

// Mock useAuthStore
vi.mock('../stores/auth-store', () => ({
	useAuthStore: vi.fn(),
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('AuthGuard', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should render children when authenticated', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: true,
				user: { permissions: [3001, 3002] },
				hasPermission: (id: number) => [3001, 3002].includes(id),
			}
			return selector(state)
		})

		render(
			<AuthGuard>
				<div>Protected Content</div>
			</AuthGuard>,
		)

		expect(screen.getByText('Protected Content')).toBeDefined()
	})

	it('should show login redirect when not authenticated', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: false,
				user: null,
				hasPermission: () => false,
			}
			return selector(state)
		})

		render(
			<AuthGuard>
				<div>Protected Content</div>
			</AuthGuard>,
		)

		expect(screen.queryByText('Protected Content')).toBeNull()
		expect(screen.getByText(/sign in/i)).toBeDefined()
	})

	it('should show 403 when missing required permission', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: true,
				user: { permissions: [3001] },
				hasPermission: (id: number) => [3001].includes(id),
			}
			return selector(state)
		})

		render(
			<AuthGuard requiredPermission={3005}>
				<div>Admin Content</div>
			</AuthGuard>,
		)

		expect(screen.queryByText('Admin Content')).toBeNull()
		expect(screen.getByText(/insufficient permissions/i)).toBeDefined()
	})

	it('should render children when has required permission', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: true,
				user: { permissions: [3001, 3005] },
				hasPermission: (id: number) => [3001, 3005].includes(id),
			}
			return selector(state)
		})

		render(
			<AuthGuard requiredPermission={3005}>
				<div>Admin Content</div>
			</AuthGuard>,
		)

		expect(screen.getByText('Admin Content')).toBeDefined()
	})
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx vitest run apps/web/src/components/AuthGuard.test.tsx --reporter=verbose`
Expected: FAIL — module not found

- [ ] **Step 3: Create AuthGuard.tsx**

```tsx
// apps/web/src/components/AuthGuard.tsx
import type { ReactNode } from 'react'
import { useAuthStore } from '../stores/auth-store'
import type { PermissionId } from '@one-bear/shared-types'

interface AuthGuardProps {
	requiredPermission?: PermissionId
	children: ReactNode
}

export function AuthGuard({ requiredPermission, children }: AuthGuardProps) {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const hasPermission = useAuthStore((s) => s.hasPermission)

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
					<h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
					<p className="text-gray-500">Please sign in to access this page.</p>
				</div>
			</div>
		)
	}

	if (requiredPermission !== undefined && !hasPermission(requiredPermission)) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">Insufficient Permissions</h2>
					<p className="text-gray-500">You do not have permission to access this page.</p>
				</div>
			</div>
		)
	}

	return <>{children}</>
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx vitest run apps/web/src/components/AuthGuard.test.tsx --reporter=verbose`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add apps/web/src/components/AuthGuard.tsx apps/web/src/components/AuthGuard.test.tsx
git commit -m "feat(auth): add AuthGuard component with permission-based route protection"
```

---

### Task 12: Frontend — LoginPage Permission Checkboxes

**Files:**
- Modify: `apps/web/src/pages/LoginPage.tsx`

Add permission checkboxes so dev users can test different permission combinations.

- [ ] **Step 1: Rewrite LoginPage.tsx**

```tsx
// apps/web/src/pages/LoginPage.tsx
import { useState } from 'react'
import { useAuthStore } from '../stores/auth-store'
import { Permission } from '@one-bear/shared-types'

const PERMISSION_LABELS: Record<number, string> = {
	[Permission.ChatView]: 'Chat View (3001)',
	[Permission.ChatResolved]: 'Chat Resolve (3002)',
	[Permission.ChatMention]: 'Chat Mention (3003)',
	[Permission.ChatAssignAllCompany]: 'Chat Assign All (3004)',
	[Permission.ChatAccessAllData]: 'Chat Admin (3005)',
}

const ALL_PERMISSIONS = Object.values(Permission) as number[]

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
	const login = useAuthStore((s) => s.login)
	const [userId, setUserId] = useState('dev-user-001')
	const [companyId, setCompanyId] = useState('dev-company-001')
	const [displayName, setDisplayName] = useState('Dev User')
	const [selectedPermissions, setSelectedPermissions] = useState<number[]>([...ALL_PERMISSIONS])
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const togglePermission = (permId: number) => {
		setSelectedPermissions((prev) =>
			prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId],
		)
	}

	const handleLogin = async () => {
		setError(null)
		setLoading(true)
		try {
			const response = await fetch('/api/v1/dev/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId,
					companyId,
					displayName,
					permissions: selectedPermissions,
				}),
			})

			if (!response.ok) {
				throw new Error(`Token request failed: ${response.status}`)
			}

			const data = await response.json()
			login(data.accessToken, data.expiresIn, {
				userId: data.userId,
				companyId: data.companyId,
				displayName,
				email: 'dev@onebear.local',
				permissions: data.permissions,
			})
			onSuccess()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 w-full max-w-md">
				<h1 className="text-2xl font-bold text-gray-900 mb-1">One Bear</h1>
				<p className="text-sm text-gray-500 mb-6">Development Login</p>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
						{error}
					</div>
				)}

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
						<input
							type="text"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
						<input
							type="text"
							value={companyId}
							onChange={(e) => setCompanyId(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
						<input
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
						<div className="space-y-2">
							{ALL_PERMISSIONS.map((permId) => (
								<label key={permId} className="flex items-center gap-2 text-sm text-gray-600">
									<input
										type="checkbox"
										checked={selectedPermissions.includes(permId)}
										onChange={() => togglePermission(permId)}
										className="rounded border-gray-300"
									/>
									{PERMISSION_LABELS[permId]}
								</label>
							))}
						</div>
					</div>

					<button
						onClick={handleLogin}
						disabled={loading}
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Signing in...' : 'Sign In (Dev Mode)'}
					</button>
				</div>

				<p className="text-xs text-gray-400 mt-4 text-center">
					This login is for development only. Production uses GoFive IdP (OAuth2 PKCE).
				</p>
			</div>
		</div>
	)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors (or only pre-existing unrelated errors)

- [ ] **Step 3: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add apps/web/src/pages/LoginPage.tsx
git commit -m "feat(auth): LoginPage adds permission checkboxes for dev testing"
```

---

### Task 13: Frontend — AuthCallbackPage + API Client Tests

**Files:**
- Create: `apps/web/src/pages/AuthCallbackPage.tsx`
- Create: `apps/web/src/lib/api-client.test.ts`

- [ ] **Step 1: Create AuthCallbackPage.tsx (production OAuth2 placeholder)**

```tsx
// apps/web/src/pages/AuthCallbackPage.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/auth-store'

/**
 * OAuth2 PKCE callback handler.
 * In production, this receives the authorization code from GoFive IdP
 * and exchanges it for tokens. Currently a placeholder for the dev environment.
 */
export function AuthCallbackPage({ onSuccess }: { onSuccess: () => void }) {
	const login = useAuthStore((s) => s.login)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const code = params.get('code')
		const errorParam = params.get('error')

		if (errorParam) {
			setError(`Authentication failed: ${errorParam}`)
			return
		}

		if (!code) {
			setError('Missing authorization code')
			return
		}

		// TODO: Exchange authorization code for tokens via GoFive IdP token endpoint
		// This will be implemented when production OAuth2 integration is built.
		// For now, redirect back to login.
		setError('OAuth2 callback not yet implemented. Use dev login.')
	}, [login, onSuccess])

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
				{error ? (
					<>
						<h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
						<p className="text-gray-500 text-sm">{error}</p>
						<a
							href="/"
							className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
						>
							Back to Login
						</a>
					</>
				) : (
					<>
						<h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
						<p className="text-gray-500 text-sm">Please wait while we complete sign-in.</p>
					</>
				)}
			</div>
		</div>
	)
}
```

- [ ] **Step 2: Write API client tests**

```typescript
// apps/web/src/lib/api-client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError } from './api-client'

describe('ApiError', () => {
	it('should create error with correct properties', () => {
		const error = new ApiError(401, 'Unauthorized', { message: 'Invalid token' }, 'corr-123')

		expect(error.status).toBe(401)
		expect(error.statusText).toBe('Unauthorized')
		expect(error.body).toEqual({ message: 'Invalid token' })
		expect(error.correlationId).toBe('corr-123')
		expect(error.name).toBe('ApiError')
		expect(error.message).toBe('API 401: Unauthorized')
	})

	it('should be an instance of Error', () => {
		const error = new ApiError(500, 'Server Error', null)

		expect(error).toBeInstanceOf(Error)
		expect(error).toBeInstanceOf(ApiError)
	})
})

describe('fetchApi behavior', () => {
	let originalFetch: typeof globalThis.fetch

	beforeEach(() => {
		originalFetch = globalThis.fetch
	})

	afterEach(() => {
		globalThis.fetch = originalFetch
		vi.restoreAllMocks()
	})

	it('should inject Authorization header from auth store', async () => {
		// This test verifies the fetch wrapper adds the Bearer token
		// We mock useAuthStore.getState() to return a token
		const { useAuthStore } = await import('../stores/auth-store')

		// Set up auth state
		useAuthStore.getState().login('test-jwt-token', 3600, {
			userId: 'test',
			companyId: 'test',
			displayName: 'Test',
			email: 'test@test.com',
			permissions: [3001],
		})

		let capturedHeaders: Headers | undefined
		globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
			capturedHeaders = new Headers(init?.headers)
			return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
		})

		const { api } = await import('./api-client')
		await api.rooms.list('test-company')

		expect(capturedHeaders?.get('Authorization')).toBe('Bearer test-jwt-token')
		expect(capturedHeaders?.get('X-Correlation-Id')).toBeTruthy()

		// Cleanup
		useAuthStore.getState().logout()
	})

	it('should call logout on 401 response', async () => {
		const { useAuthStore } = await import('../stores/auth-store')

		useAuthStore.getState().login('expired-token', 3600, {
			userId: 'test',
			companyId: 'test',
			displayName: 'Test',
			email: 'test@test.com',
			permissions: [3001],
		})

		globalThis.fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ error: 'unauthorized' }), {
				status: 401,
				statusText: 'Unauthorized',
			}),
		)

		const { api } = await import('./api-client')

		await expect(api.rooms.list('test-company')).rejects.toThrow(ApiError)
		expect(useAuthStore.getState().isAuthenticated).toBe(false)
	})
})
```

- [ ] **Step 3: Run API client tests**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx vitest run apps/web/src/lib/api-client.test.ts --reporter=verbose`
Expected: PASS (4 tests)

- [ ] **Step 4: Run all frontend tests**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx vitest run --reporter=verbose`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add apps/web/src/pages/AuthCallbackPage.tsx apps/web/src/lib/api-client.test.ts
git commit -m "feat(auth): add AuthCallbackPage placeholder and api-client tests"
```

---

### Task 14: Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Full backend build**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet build -v q`
Expected: 0 errors, 0 warnings (or only pre-existing warnings)

- [ ] **Step 2: Full backend test suite**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear/backend && dotnet test -v q`
Expected: All tests pass. Count should be higher than before (was 106 after Task 01, now should include new auth tests).

- [ ] **Step 3: Full frontend test suite**

Run: `cd /Users/ditthapong/Documents/Salesbear/one-bear && npx vitest run --reporter=verbose`
Expected: All frontend tests pass.

- [ ] **Step 4: Verify key files match spec**

Verify these match the spec requirements:

1. `AuthConstants.cs` — All scheme, claim, scope, and policy constants defined
2. `AuthOptions.cs` — SectionName = "Authentication", properties match spec
3. `ApiKeyOptions.cs` — SectionName = "ApiKeys", properties match spec
4. `ApiKeyAuthHandler.cs` — Claims use `"auth_method"="api_key"` and `"api_key_scope"`
5. `ClaimsPrincipalExtensions.cs` — GetUserId/GetCompanyId throw, all methods present
6. `PermissionHandler.cs` — API key bypass, JSON array parsing
7. `CompanyIdValidationFilter.cs` — IAsyncActionFilter, uses AuthConstants
8. `DevTokenController.cs` — Uses AuthOptions, emits JSON array permissions
9. `Program.cs` — Options binding, "OneBear" CORS, Swagger ApiKey definition
10. `SubscriptionCheckMiddleware.cs` — Checks subscription, skips dev/apikey
11. `appsettings.json` — "Authentication" section, "Cors:AllowedOrigins"
12. Frontend `permissions.ts` — Shared constants with PermissionId type
13. Frontend `AuthGuard.tsx` — Route protection with permission check
14. Frontend `LoginPage.tsx` — Permission checkboxes

- [ ] **Step 5: Final commit (if any adjustments needed)**

If any fixes were needed during verification, commit them:

```bash
cd /Users/ditthapong/Documents/Salesbear/one-bear && git add -A
git commit -m "fix(auth): address integration verification findings"
```
