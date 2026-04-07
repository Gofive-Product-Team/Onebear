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

        Assert.False(result.Succeeded);
    }

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
