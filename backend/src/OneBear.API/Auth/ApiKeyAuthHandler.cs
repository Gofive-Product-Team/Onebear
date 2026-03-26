using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace OneBear.API.Auth;

public class ApiKeyAuthOptions : AuthenticationSchemeOptions
{
    public const string SchemeName = "ApiKey";
    public const string HeaderName = "X-Api-Key";
}

public class ApiKeyAuthHandler : AuthenticationHandler<ApiKeyAuthOptions>
{
    private readonly IConfiguration _config;

    public ApiKeyAuthHandler(
        IOptionsMonitor<ApiKeyAuthOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IConfiguration config) : base(options, logger, encoder)
    {
        _config = config;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(ApiKeyAuthOptions.HeaderName, out Microsoft.Extensions.Primitives.StringValues headerValue))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        string providedKey = headerValue.ToString();

        // Check against configured keys (support dual-key rotation)
        string primaryKey = _config["ApiKeys:Primary"] ?? _config["ApiKeys:Webhook"] ?? "";
        string secondaryKey = _config["ApiKeys:Secondary"] ?? "";

        string? matchedScope = null;

        if (ConstantTimeEquals(providedKey, primaryKey) ||
            (!string.IsNullOrEmpty(secondaryKey) && ConstantTimeEquals(providedKey, secondaryKey)))
        {
            matchedScope = "webhook";
        }

        string aiKey = _config["ApiKeys:AiService"] ?? "";
        if (matchedScope == null && !string.IsNullOrEmpty(aiKey) && ConstantTimeEquals(providedKey, aiKey))
        {
            matchedScope = "ai-service";
        }

        if (matchedScope == null)
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key"));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, $"service:{matchedScope}"),
            new Claim("scope", matchedScope),
            new Claim(ClaimTypes.AuthenticationMethod, "ApiKey")
        };

        var identity = new ClaimsIdentity(claims, ApiKeyAuthOptions.SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, ApiKeyAuthOptions.SchemeName);

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
