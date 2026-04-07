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
