namespace OneBear.Application.Integrations.Services;

using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Integrations.Config;
using OneBear.Application.Integrations.DTOs;
using OneBear.Application.Integrations.Mappings;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class OAuthService
{
    private static readonly TimeSpan OAuthStateTtl = TimeSpan.FromMinutes(10);

    private readonly IIntegrationChannelRepository _integrationRepo;
    private readonly ICacheService _cache;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OAuthOptions _oauthOptions;
    private readonly ILogger<OAuthService> _logger;

    public OAuthService(
        IIntegrationChannelRepository integrationRepo,
        ICacheService cache,
        IHttpClientFactory httpClientFactory,
        IOptions<OAuthOptions> oauthOptions,
        ILogger<OAuthService> logger)
    {
        _integrationRepo = integrationRepo;
        _cache = cache;
        _httpClientFactory = httpClientFactory;
        _oauthOptions = oauthOptions.Value;
        _logger = logger;
    }

    // ──────────────────────────────────────────────
    // Generate Auth URL
    // ──────────────────────────────────────────────

    public async Task<Result<OAuthAuthUrlResponse>> GenerateAuthUrlAsync(
        string companyId, string platform, string userId, CancellationToken ct = default)
    {
        string state = Guid.NewGuid().ToString("N");

        OAuthStateData stateData = new()
        {
            CompanyId = companyId,
            Platform = platform,
            InitiatedBy = userId,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        string cacheKey = $"oauth:state:{state}";
        await _cache.SetAsync(cacheKey, stateData, OAuthStateTtl, ct);

        string authUrl = BuildAuthUrl(platform, state, companyId);

        _logger.LogInformation(
            "Generated OAuth auth URL for platform {Platform}, company {CompanyId}, user {UserId}",
            platform, companyId, userId);

        return new Result<OAuthAuthUrlResponse>.Success(new OAuthAuthUrlResponse(authUrl, state));
    }

    private string BuildAuthUrl(string platform, string state, string companyId)
    {
        if (platform.Equals(SocialPlatform.Line, StringComparison.OrdinalIgnoreCase))
        {
            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/{SocialPlatform.Line.ToLower()}";
            return $"{_oauthOptions.Line.ModuleAuthUrl}" +
                   $"?response_type=code" +
                   $"&client_id={Uri.EscapeDataString(_oauthOptions.Line.ClientId)}" +
                   $"&redirect_uri={Uri.EscapeDataString(callbackUrl)}" +
                   $"&state={Uri.EscapeDataString(state)}";
        }

        return new Result<OAuthAuthUrlResponse>.Failure(
            new Error("UNSUPPORTED_PLATFORM", $"OAuth auth URL generation is not supported for platform '{platform}'.", ErrorType.Validation))
            .ToString()!;
    }

    // ──────────────────────────────────────────────
    // Handle OAuth Callback (LINE, etc.)
    // ──────────────────────────────────────────────

    public async Task<Result<OAuthConnectResponse>> HandleCallbackAsync(
        string companyId, string platform, string code, string state,
        string userId, string? shopId = null, CancellationToken ct = default)
    {
        // Validate state from Redis
        string cacheKey = $"oauth:state:{state}";
        OAuthStateData? stateData = await _cache.GetAsync<OAuthStateData>(cacheKey, ct);

        if (stateData is null)
        {
            _logger.LogWarning("OAuth state {State} not found or expired for company {CompanyId}", state, companyId);
            return new Result<OAuthConnectResponse>.Failure(
                new Error("OAUTH_STATE_INVALID", "OAuth state is invalid or has expired.", ErrorType.Validation));
        }

        if (stateData.CompanyId != companyId)
        {
            _logger.LogWarning(
                "OAuth state company mismatch: expected {Expected}, got {Actual}",
                stateData.CompanyId, companyId);
            return new Result<OAuthConnectResponse>.Failure(
                new Error("OAUTH_STATE_MISMATCH", "OAuth state does not match the current company.", ErrorType.Forbidden));
        }

        // Remove used state (one-time use)
        await _cache.RemoveAsync(cacheKey, ct);

        // Exchange code for tokens
        if (platform.Equals(SocialPlatform.Line, StringComparison.OrdinalIgnoreCase))
        {
            return await HandleLineCallbackAsync(companyId, code, userId, ct);
        }

        return new Result<OAuthConnectResponse>.Failure(
            new Error("UNSUPPORTED_PLATFORM", $"OAuth callback is not supported for platform '{platform}'.", ErrorType.Validation));
    }

    private async Task<Result<OAuthConnectResponse>> HandleLineCallbackAsync(
        string companyId, string code, string userId, CancellationToken ct)
    {
        try
        {
            HttpClient httpClient = _httpClientFactory.CreateClient("line-api");

            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/{SocialPlatform.Line.ToLower()}";

            FormUrlEncodedContent tokenRequestContent = new(new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = callbackUrl,
                ["client_id"] = _oauthOptions.Line.ClientId,
            });

            HttpResponseMessage tokenResponse = await httpClient.PostAsync(
                _oauthOptions.Line.TokenUrl, tokenRequestContent, ct);

            if (!tokenResponse.IsSuccessStatusCode)
            {
                string errorContent = await tokenResponse.Content.ReadAsStringAsync(ct);
                _logger.LogError(
                    "LINE token exchange failed: {StatusCode} - {Content}",
                    tokenResponse.StatusCode, errorContent);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("LINE_TOKEN_EXCHANGE_FAILED", "Failed to exchange LINE authorization code for tokens.", ErrorType.PlatformError));
            }

            LineTokenResponse? tokenResult = await tokenResponse.Content.ReadFromJsonAsync<LineTokenResponse>(ct);

            if (tokenResult is null || string.IsNullOrEmpty(tokenResult.AccessToken))
            {
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("LINE_TOKEN_INVALID", "LINE token response is invalid or missing access token.", ErrorType.PlatformError));
            }

            long? expiresAt = tokenResult.ExpiresIn.HasValue
                ? DateTimeOffset.UtcNow.AddSeconds(tokenResult.ExpiresIn.Value).ToUnixTimeMilliseconds()
                : null;

            PlatformCredentials credentials = new()
            {
                AccessToken = tokenResult.AccessToken,
                RefreshToken = tokenResult.RefreshToken,
                TokenExpiresAt = expiresAt,
            };

            return await CreateIntegrationAsync(companyId, SocialPlatform.Line, credentials, userId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during LINE OAuth callback for company {CompanyId}", companyId);
            return new Result<OAuthConnectResponse>.Failure(
                new Error("LINE_OAUTH_ERROR", "An unexpected error occurred during LINE OAuth flow.", ErrorType.Internal));
        }
    }

    // ──────────────────────────────────────────────
    // Handle Facebook Token Exchange
    // ──────────────────────────────────────────────

    public async Task<Result<OAuthConnectResponse>> HandleFacebookTokenAsync(
        string companyId, string accessToken, string? name, string userId, CancellationToken ct = default)
    {
        try
        {
            HttpClient httpClient = _httpClientFactory.CreateClient("facebook-api");
            string version = _oauthOptions.Facebook.GraphApiVersion;

            // Exchange short-lived token for long-lived token
            string longLivedUrl = $"/{version}/oauth/access_token" +
                                  $"?grant_type=fb_exchange_token" +
                                  $"&client_id={Uri.EscapeDataString(_oauthOptions.Facebook.AppId)}" +
                                  $"&client_secret={Uri.EscapeDataString(_oauthOptions.Facebook.AppSecret)}" +
                                  $"&fb_exchange_token={Uri.EscapeDataString(accessToken)}";

            HttpResponseMessage longLivedResponse = await httpClient.GetAsync(longLivedUrl, ct);

            if (!longLivedResponse.IsSuccessStatusCode)
            {
                string errorContent = await longLivedResponse.Content.ReadAsStringAsync(ct);
                _logger.LogError(
                    "Facebook long-lived token exchange failed: {StatusCode} - {Content}",
                    longLivedResponse.StatusCode, errorContent);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("FB_TOKEN_EXCHANGE_FAILED", "Failed to exchange Facebook short-lived token.", ErrorType.PlatformError));
            }

            FacebookLongLivedTokenResponse? llTokenResult = await longLivedResponse.Content
                .ReadFromJsonAsync<FacebookLongLivedTokenResponse>(ct);

            if (llTokenResult is null || string.IsNullOrEmpty(llTokenResult.AccessToken))
            {
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("FB_TOKEN_INVALID", "Facebook long-lived token response is invalid.", ErrorType.PlatformError));
            }

            string longLivedToken = llTokenResult.AccessToken;

            // Get page list
            HttpResponseMessage pagesResponse = await httpClient.GetAsync(
                $"/{version}/me/accounts?access_token={Uri.EscapeDataString(longLivedToken)}", ct);

            if (!pagesResponse.IsSuccessStatusCode)
            {
                string errorContent = await pagesResponse.Content.ReadAsStringAsync(ct);
                _logger.LogError(
                    "Facebook pages fetch failed: {StatusCode} - {Content}",
                    pagesResponse.StatusCode, errorContent);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("FB_PAGES_FETCH_FAILED", "Failed to fetch Facebook pages.", ErrorType.PlatformError));
            }

            FacebookPagesResponse? pagesResult = await pagesResponse.Content
                .ReadFromJsonAsync<FacebookPagesResponse>(ct);

            FacebookPageEntry? firstPage = pagesResult?.Data?.FirstOrDefault();

            if (firstPage is null)
            {
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("FB_NO_PAGES", "No Facebook pages found for this account.", ErrorType.Validation));
            }

            PlatformCredentials fbCredentials = new()
            {
                AccessToken = firstPage.AccessToken ?? longLivedToken,
                PageId = firstPage.Id,
                PageName = firstPage.Name ?? name,
            };

            Result<OAuthConnectResponse> fbResult = await CreateIntegrationAsync(
                companyId, SocialPlatform.Facebook, fbCredentials, userId, ct);

            if (fbResult is Result<OAuthConnectResponse>.Failure)
                return fbResult;

            // Auto-create Instagram integration if page has Instagram Business Account
            _ = TryCreateInstagramIntegrationAsync(
                companyId, firstPage.Id!, longLivedToken, userId, version, httpClient, ct);

            return fbResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Facebook token exchange for company {CompanyId}", companyId);
            return new Result<OAuthConnectResponse>.Failure(
                new Error("FB_OAUTH_ERROR", "An unexpected error occurred during Facebook token exchange.", ErrorType.Internal));
        }
    }

    private async Task TryCreateInstagramIntegrationAsync(
        string companyId, string pageId, string pageAccessToken,
        string userId, string version, HttpClient httpClient, CancellationToken ct)
    {
        try
        {
            HttpResponseMessage igCheckResponse = await httpClient.GetAsync(
                $"/{version}/{pageId}?fields=instagram_business_account&access_token={Uri.EscapeDataString(pageAccessToken)}", ct);

            if (!igCheckResponse.IsSuccessStatusCode) return;

            InstagramBusinessAccountCheckResponse? igCheck = await igCheckResponse.Content
                .ReadFromJsonAsync<InstagramBusinessAccountCheckResponse>(ct);

            if (igCheck?.InstagramBusinessAccount is null) return;

            string igAccountId = igCheck.InstagramBusinessAccount.Id;

            PlatformCredentials igCredentials = new()
            {
                AccessToken = pageAccessToken,
                PageId = igAccountId,
            };

            await CreateIntegrationAsync(companyId, SocialPlatform.Instagram, igCredentials, userId, ct);

            _logger.LogInformation(
                "Auto-created Instagram integration for company {CompanyId} with IG account {IgAccountId}",
                companyId, igAccountId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to auto-create Instagram integration for company {CompanyId}, page {PageId}",
                companyId, pageId);
        }
    }

    // ──────────────────────────────────────────────
    // Handle WhatsApp Token
    // ──────────────────────────────────────────────

    public async Task<Result<OAuthConnectResponse>> HandleWhatsAppTokenAsync(
        string companyId, string accessToken, string? phoneNumberId, string? wabaId,
        string userId, CancellationToken ct = default)
    {
        PlatformCredentials credentials = new()
        {
            AccessToken = accessToken,
            PhoneNumberId = phoneNumberId,
            BusinessAccountId = wabaId,
        };

        return await CreateIntegrationAsync(companyId, SocialPlatform.WhatsApp, credentials, userId, ct);
    }

    // ──────────────────────────────────────────────
    // Shared Helper: Create Integration
    // ──────────────────────────────────────────────

    private async Task<Result<OAuthConnectResponse>> CreateIntegrationAsync(
        string companyId, string platform, PlatformCredentials credentials,
        string userId, CancellationToken ct)
    {
        string id = Guid.NewGuid().ToString();
        string webhookUrl = $"/api/v1/webhooks/{platform.ToLower()}/{companyId}/{id}";
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        IntegrationChannel channel = new()
        {
            Id = id,
            CompanyId = companyId,
            Platform = platform,
            IsActive = true,
            HasChatFeature = true,
            Credentials = credentials,
            WebhookUrl = webhookUrl,
            CreatedBy = userId,
            CreatedTimestamp = now,
        };

        IntegrationChannel created = await _integrationRepo.CreateAsync(channel, ct);

        _logger.LogInformation(
            "Created {Platform} integration {IntegrationId} for company {CompanyId}",
            platform, id, companyId);

        IntegrationChannelDto dto = IntegrationMapper.ToDto(created);
        return new Result<OAuthConnectResponse>.Success(new OAuthConnectResponse(dto, webhookUrl));
    }
}

// ──────────────────────────────────────────────
// Internal state/response models
// ──────────────────────────────────────────────

internal class OAuthStateData
{
    public string CompanyId { get; set; } = default!;
    public string Platform { get; set; } = default!;
    public string InitiatedBy { get; set; } = default!;
    public long Timestamp { get; set; }
}

internal class LineTokenResponse
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; set; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }
}

internal class FacebookLongLivedTokenResponse
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }

    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; set; }
}

internal class FacebookPagesResponse
{
    [JsonPropertyName("data")]
    public List<FacebookPageEntry>? Data { get; set; }
}

internal class FacebookPageEntry
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }
}

internal class InstagramBusinessAccountCheckResponse
{
    [JsonPropertyName("instagram_business_account")]
    public InstagramAccountRef? InstagramBusinessAccount { get; set; }
}

internal class InstagramAccountRef
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
}
