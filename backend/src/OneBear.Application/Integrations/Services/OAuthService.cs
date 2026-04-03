namespace OneBear.Application.Integrations.Services;

using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
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

        if (platform.Equals(SocialPlatform.Shopee, StringComparison.OrdinalIgnoreCase))
        {
            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/{SocialPlatform.Shopee.ToLower()}";
            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            Uri authUri = new(_oauthOptions.Shopee.AuthUrl);
            string apiPath = authUri.AbsolutePath;
            string sign = ComputeShopeeSign(long.Parse(_oauthOptions.Shopee.PartnerId), apiPath, timestamp, _oauthOptions.Shopee.PartnerKey);
            return $"{_oauthOptions.Shopee.AuthUrl}" +
                   $"?partner_id={Uri.EscapeDataString(_oauthOptions.Shopee.PartnerId)}" +
                   $"&redirect={Uri.EscapeDataString(callbackUrl)}" +
                   $"&state={Uri.EscapeDataString(state)}" +
                   $"&sign={Uri.EscapeDataString(sign)}" +
                   $"&timestamp={timestamp}";
        }

        if (platform.Equals(SocialPlatform.TikTok, StringComparison.OrdinalIgnoreCase))
        {
            return $"{_oauthOptions.TikTok.AuthUrl}" +
                   $"?app_key={Uri.EscapeDataString(_oauthOptions.TikTok.AppKey)}" +
                   $"&state={Uri.EscapeDataString(state)}";
        }

        if (platform.Equals(SocialPlatform.Lazada, StringComparison.OrdinalIgnoreCase))
        {
            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/{SocialPlatform.Lazada.ToLower()}";
            return $"{_oauthOptions.Lazada.AuthUrl}" +
                   $"?response_type=code" +
                   $"&redirect_uri={Uri.EscapeDataString(callbackUrl)}" +
                   $"&client_id={Uri.EscapeDataString(_oauthOptions.Lazada.AppKey)}" +
                   $"&state={Uri.EscapeDataString(state)}";
        }

        if (platform.Equals("gmail", StringComparison.OrdinalIgnoreCase))
        {
            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/gmail";
            return $"{_oauthOptions.Google.AuthUrl}" +
                   $"?client_id={Uri.EscapeDataString(_oauthOptions.Google.ClientId)}" +
                   $"&redirect_uri={Uri.EscapeDataString(callbackUrl)}" +
                   $"&response_type=code" +
                   $"&scope={Uri.EscapeDataString(_oauthOptions.Google.Scopes)}" +
                   $"&state={Uri.EscapeDataString(state)}" +
                   $"&access_type=offline" +
                   $"&prompt=consent";
        }

        if (platform.Equals("outlook", StringComparison.OrdinalIgnoreCase))
        {
            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/outlook";
            return $"{_oauthOptions.Microsoft.AuthUrl}" +
                   $"?client_id={Uri.EscapeDataString(_oauthOptions.Microsoft.ClientId)}" +
                   $"&redirect_uri={Uri.EscapeDataString(callbackUrl)}" +
                   $"&response_type=code" +
                   $"&scope={Uri.EscapeDataString(_oauthOptions.Microsoft.Scopes)}" +
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
            return await HandleLineCallbackAsync(companyId, code, userId, ct);

        if (platform.Equals(SocialPlatform.Shopee, StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrEmpty(shopId))
            {
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("SHOPEE_MISSING_SHOP_ID", "shop_id is required for Shopee OAuth callback.", ErrorType.Validation));
            }

            try
            {
                PlatformCredentials credentials = await ExchangeShopeeCodeAsync(code, shopId, ct);
                return await CreateIntegrationAsync(companyId, SocialPlatform.Shopee, credentials, userId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Shopee OAuth callback for company {CompanyId}", companyId);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("SHOPEE_OAUTH_ERROR", "An unexpected error occurred during Shopee OAuth flow.", ErrorType.Internal));
            }
        }

        if (platform.Equals(SocialPlatform.TikTok, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                PlatformCredentials credentials = await ExchangeTikTokCodeAsync(code, ct);
                return await CreateIntegrationAsync(companyId, SocialPlatform.TikTok, credentials, userId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during TikTok OAuth callback for company {CompanyId}", companyId);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("TIKTOK_OAUTH_ERROR", "An unexpected error occurred during TikTok OAuth flow.", ErrorType.Internal));
            }
        }

        if (platform.Equals(SocialPlatform.Lazada, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                PlatformCredentials credentials = await ExchangeLazadaCodeAsync(code, ct);
                return await CreateIntegrationAsync(companyId, SocialPlatform.Lazada, credentials, userId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Lazada OAuth callback for company {CompanyId}", companyId);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("LAZADA_OAUTH_ERROR", "An unexpected error occurred during Lazada OAuth flow.", ErrorType.Internal));
            }
        }

        if (platform.Equals("gmail", StringComparison.OrdinalIgnoreCase))
        {
            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/gmail";
            try
            {
                PlatformCredentials credentials = await ExchangeGmailCodeAsync(code, callbackUrl, ct);
                return await CreateIntegrationAsync(companyId, SocialPlatform.Email, credentials, userId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Gmail OAuth callback for company {CompanyId}", companyId);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("GMAIL_OAUTH_ERROR", "An unexpected error occurred during Gmail OAuth flow.", ErrorType.Internal));
            }
        }

        if (platform.Equals("outlook", StringComparison.OrdinalIgnoreCase))
        {
            string callbackUrl = $"{_oauthOptions.CallbackBaseUrl}/outlook";
            try
            {
                PlatformCredentials credentials = await ExchangeOutlookCodeAsync(code, callbackUrl, ct);
                return await CreateIntegrationAsync(companyId, SocialPlatform.Email, credentials, userId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Outlook OAuth callback for company {CompanyId}", companyId);
                return new Result<OAuthConnectResponse>.Failure(
                    new Error("OUTLOOK_OAUTH_ERROR", "An unexpected error occurred during Outlook OAuth flow.", ErrorType.Internal));
            }
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
    // Shopee Code Exchange
    // ──────────────────────────────────────────────

    private async Task<PlatformCredentials> ExchangeShopeeCodeAsync(string code, string shopId, CancellationToken ct)
    {
        HttpClient httpClient = _httpClientFactory.CreateClient("shopee-api");

        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        Uri tokenUri = new(_oauthOptions.Shopee.TokenUrl);
        string apiPath = tokenUri.AbsolutePath;

        string sign = ComputeShopeeSign(
            long.Parse(_oauthOptions.Shopee.PartnerId), apiPath, timestamp, _oauthOptions.Shopee.PartnerKey);

        string url = $"{_oauthOptions.Shopee.TokenUrl}" +
                     $"?partner_id={Uri.EscapeDataString(_oauthOptions.Shopee.PartnerId)}" +
                     $"&timestamp={timestamp}" +
                     $"&sign={Uri.EscapeDataString(sign)}";

        var body = new
        {
            code,
            shop_id = long.Parse(shopId),
            partner_id = long.Parse(_oauthOptions.Shopee.PartnerId),
        };

        HttpResponseMessage response = await httpClient.PostAsJsonAsync(url, body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string errorContent = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError(
                "Shopee token exchange failed: {StatusCode} - {Content}",
                response.StatusCode, errorContent);
            throw new InvalidOperationException($"Shopee token exchange failed: {response.StatusCode}");
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? errorField = doc.RootElement.TryGetProperty("error", out JsonElement errEl)
            ? errEl.GetString() : null;

        if (!string.IsNullOrEmpty(errorField))
        {
            string? errorMsg = doc.RootElement.TryGetProperty("message", out JsonElement msgEl)
                ? msgEl.GetString() : errorField;
            throw new InvalidOperationException($"Shopee token exchange error: {errorMsg}");
        }

        string? accessToken = doc.RootElement.TryGetProperty("access_token", out JsonElement at)
            ? at.GetString() : null;
        string? refreshToken = doc.RootElement.TryGetProperty("refresh_token", out JsonElement rt)
            ? rt.GetString() : null;
        long expireIn = doc.RootElement.TryGetProperty("expire_in", out JsonElement ei)
            ? ei.GetInt64() : 0;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (expireIn * 1000);

        return new PlatformCredentials
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiresAt = expiresAt,
            AppId = _oauthOptions.Shopee.PartnerId,
            AppSecret = _oauthOptions.Shopee.PartnerKey,
            ShopId = shopId,
            ChannelId = shopId,
        };
    }

    // ──────────────────────────────────────────────
    // TikTok Code Exchange
    // ──────────────────────────────────────────────

    private async Task<PlatformCredentials> ExchangeTikTokCodeAsync(string code, CancellationToken ct)
    {
        HttpClient httpClient = _httpClientFactory.CreateClient("tiktok-api");

        var body = new
        {
            app_key = _oauthOptions.TikTok.AppKey,
            app_secret = _oauthOptions.TikTok.AppSecret,
            auth_code = code,
            grant_type = "authorized_code",
        };

        HttpResponseMessage response = await httpClient.PostAsJsonAsync(_oauthOptions.TikTok.TokenUrl, body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string errorContent = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError(
                "TikTok token exchange failed: {StatusCode} - {Content}",
                response.StatusCode, errorContent);
            throw new InvalidOperationException($"TikTok token exchange failed: {response.StatusCode}");
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        if (!doc.RootElement.TryGetProperty("data", out JsonElement data))
            throw new InvalidOperationException("TikTok token response missing 'data' field.");

        string? accessToken = data.TryGetProperty("access_token", out JsonElement at) ? at.GetString() : null;
        string? refreshToken = data.TryGetProperty("refresh_token", out JsonElement rt) ? rt.GetString() : null;
        long expireIn = data.TryGetProperty("access_token_expire_in", out JsonElement ei) ? ei.GetInt64() : 0;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (expireIn * 1000);
        string? shopCipher = data.TryGetProperty("shop_cipher", out JsonElement sc) ? sc.GetString() : null;

        return new PlatformCredentials
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiresAt = expiresAt,
            AppId = _oauthOptions.TikTok.AppKey,
            AppSecret = _oauthOptions.TikTok.AppSecret,
            ShopCipher = shopCipher,
        };
    }

    // ──────────────────────────────────────────────
    // Lazada Code Exchange
    // ──────────────────────────────────────────────

    private async Task<PlatformCredentials> ExchangeLazadaCodeAsync(string code, CancellationToken ct)
    {
        HttpClient httpClient = _httpClientFactory.CreateClient("lazada-api");

        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        Dictionary<string, string> signParams = new()
        {
            ["app_key"] = _oauthOptions.Lazada.AppKey,
            ["code"] = code,
            ["timestamp"] = timestamp.ToString(),
        };

        string sign = ComputeLazadaSign("/auth/token/create", signParams, _oauthOptions.Lazada.AppSecret);

        string queryString = BuildLazadaQueryString(signParams);
        string url = $"{_oauthOptions.Lazada.TokenUrl}?{queryString}&sign={Uri.EscapeDataString(sign)}";

        HttpResponseMessage response = await httpClient.PostAsync(url, null, ct);

        if (!response.IsSuccessStatusCode)
        {
            string errorContent = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError(
                "Lazada token exchange failed: {StatusCode} - {Content}",
                response.StatusCode, errorContent);
            throw new InvalidOperationException($"Lazada token exchange failed: {response.StatusCode}");
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? responseCode = doc.RootElement.TryGetProperty("code", out JsonElement codeEl)
            ? codeEl.GetString() : null;

        if (responseCode != "0")
        {
            string? errorMsg = doc.RootElement.TryGetProperty("message", out JsonElement msgEl)
                ? msgEl.GetString() : "Unknown Lazada error";
            throw new InvalidOperationException($"Lazada token exchange error: {errorMsg}");
        }

        string? accessToken = doc.RootElement.TryGetProperty("access_token", out JsonElement at)
            ? at.GetString() : null;
        string? refreshToken = doc.RootElement.TryGetProperty("refresh_token", out JsonElement rt)
            ? rt.GetString() : null;
        long refreshExpiresIn = doc.RootElement.TryGetProperty("refresh_expires_in", out JsonElement rei)
            ? rei.GetInt64() : 0;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (refreshExpiresIn * 1000);
        string? country = doc.RootElement.TryGetProperty("country", out JsonElement ctryEl)
            ? ctryEl.GetString() : null;
        string? account = doc.RootElement.TryGetProperty("account", out JsonElement accEl)
            ? accEl.GetString() : null;

        return new PlatformCredentials
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiresAt = expiresAt,
            AppId = _oauthOptions.Lazada.AppKey,
            AppSecret = _oauthOptions.Lazada.AppSecret,
            ShopName = account,
        };
    }

    // ──────────────────────────────────────────────
    // Gmail Code Exchange
    // ──────────────────────────────────────────────

    private async Task<PlatformCredentials> ExchangeGmailCodeAsync(string code, string callbackUrl, CancellationToken ct)
    {
        HttpClient httpClient = _httpClientFactory.CreateClient("google-api");

        FormUrlEncodedContent tokenContent = new(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _oauthOptions.Google.ClientId,
            ["client_secret"] = _oauthOptions.Google.ClientSecret,
            ["redirect_uri"] = callbackUrl,
            ["grant_type"] = "authorization_code",
        });

        HttpResponseMessage tokenResponse = await httpClient.PostAsync(_oauthOptions.Google.TokenUrl, tokenContent, ct);

        if (!tokenResponse.IsSuccessStatusCode)
        {
            string errorContent = await tokenResponse.Content.ReadAsStringAsync(ct);
            _logger.LogError(
                "Gmail token exchange failed: {StatusCode} - {Content}",
                tokenResponse.StatusCode, errorContent);
            throw new InvalidOperationException($"Gmail token exchange failed: {tokenResponse.StatusCode}");
        }

        using JsonDocument tokenDoc = await JsonDocument.ParseAsync(
            await tokenResponse.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? accessToken = tokenDoc.RootElement.TryGetProperty("access_token", out JsonElement at)
            ? at.GetString() : null;
        string? refreshToken = tokenDoc.RootElement.TryGetProperty("refresh_token", out JsonElement rt)
            ? rt.GetString() : null;
        long expiresIn = tokenDoc.RootElement.TryGetProperty("expires_in", out JsonElement ei)
            ? ei.GetInt64() : 3600;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (expiresIn * 1000);

        // Fetch email address
        string? emailAddress = null;
        try
        {
            HttpClient gmailClient = _httpClientFactory.CreateClient("google-api");
            gmailClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            HttpResponseMessage profileResponse = await gmailClient.GetAsync(
                "https://www.googleapis.com/gmail/v1/users/me/profile", ct);

            if (profileResponse.IsSuccessStatusCode)
            {
                using JsonDocument profileDoc = await JsonDocument.ParseAsync(
                    await profileResponse.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
                emailAddress = profileDoc.RootElement.TryGetProperty("emailAddress", out JsonElement emailEl)
                    ? emailEl.GetString() : null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch Gmail profile email address");
        }

        return new PlatformCredentials
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiresAt = expiresAt,
            AppId = _oauthOptions.Google.ClientId,
            AppSecret = _oauthOptions.Google.ClientSecret,
            EmailAddress = emailAddress,
            ChannelId = "gmail",
        };
    }

    // ──────────────────────────────────────────────
    // Outlook Code Exchange
    // ──────────────────────────────────────────────

    private async Task<PlatformCredentials> ExchangeOutlookCodeAsync(string code, string callbackUrl, CancellationToken ct)
    {
        HttpClient httpClient = _httpClientFactory.CreateClient("microsoft-api");

        FormUrlEncodedContent tokenContent = new(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _oauthOptions.Microsoft.ClientId,
            ["client_secret"] = _oauthOptions.Microsoft.ClientSecret,
            ["redirect_uri"] = callbackUrl,
            ["grant_type"] = "authorization_code",
            ["scope"] = _oauthOptions.Microsoft.Scopes,
        });

        HttpResponseMessage tokenResponse = await httpClient.PostAsync(_oauthOptions.Microsoft.TokenUrl, tokenContent, ct);

        if (!tokenResponse.IsSuccessStatusCode)
        {
            string errorContent = await tokenResponse.Content.ReadAsStringAsync(ct);
            _logger.LogError(
                "Outlook token exchange failed: {StatusCode} - {Content}",
                tokenResponse.StatusCode, errorContent);
            throw new InvalidOperationException($"Outlook token exchange failed: {tokenResponse.StatusCode}");
        }

        using JsonDocument tokenDoc = await JsonDocument.ParseAsync(
            await tokenResponse.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? accessToken = tokenDoc.RootElement.TryGetProperty("access_token", out JsonElement at)
            ? at.GetString() : null;
        string? refreshToken = tokenDoc.RootElement.TryGetProperty("refresh_token", out JsonElement rt)
            ? rt.GetString() : null;
        long expiresIn = tokenDoc.RootElement.TryGetProperty("expires_in", out JsonElement ei)
            ? ei.GetInt64() : 3600;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (expiresIn * 1000);

        // Fetch email address from Microsoft Graph
        string? emailAddress = null;
        try
        {
            HttpClient graphClient = _httpClientFactory.CreateClient("microsoft-api");
            graphClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            HttpResponseMessage meResponse = await graphClient.GetAsync(
                "https://graph.microsoft.com/v1.0/me", ct);

            if (meResponse.IsSuccessStatusCode)
            {
                using JsonDocument meDoc = await JsonDocument.ParseAsync(
                    await meResponse.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
                emailAddress = meDoc.RootElement.TryGetProperty("mail", out JsonElement mailEl)
                    ? mailEl.GetString()
                    : meDoc.RootElement.TryGetProperty("userPrincipalName", out JsonElement upnEl)
                        ? upnEl.GetString()
                        : null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch Outlook/Microsoft profile email address");
        }

        return new PlatformCredentials
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiresAt = expiresAt,
            AppId = _oauthOptions.Microsoft.ClientId,
            AppSecret = _oauthOptions.Microsoft.ClientSecret,
            EmailAddress = emailAddress,
            ChannelId = "outlook",
        };
    }

    // ──────────────────────────────────────────────
    // Signing Helpers
    // ──────────────────────────────────────────────

    /// <summary>
    /// Computes a Shopee auth URL signature: HMAC-SHA256(partnerId + path + timestamp, partnerKey).
    /// Returns lowercase hex string.
    /// </summary>
    private static string ComputeShopeeSign(long partnerId, string path, long timestamp, string partnerKey)
    {
        string baseString = $"{partnerId}{path}{timestamp}";
        byte[] keyBytes = Encoding.UTF8.GetBytes(partnerKey);
        using HMACSHA256 hmac = new(keyBytes);
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(baseString));
        return Convert.ToHexStringLower(hash);
    }

    /// <summary>
    /// Computes a Lazada API signature: HMAC-SHA256(apiPath + sorted key+value pairs, appSecret).
    /// Returns uppercase hex string.
    /// </summary>
    private static string ComputeLazadaSign(string apiPath, Dictionary<string, string> parameters, string appSecret)
    {
        List<string> sortedKeys = new(parameters.Keys);
        sortedKeys.Sort(StringComparer.Ordinal);

        StringBuilder sb = new();
        sb.Append(apiPath);
        foreach (string key in sortedKeys)
        {
            sb.Append(key);
            sb.Append(parameters[key]);
        }

        byte[] keyBytes = Encoding.UTF8.GetBytes(appSecret);
        using HMACSHA256 hmac = new(keyBytes);
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
        return Convert.ToHexString(hash);
    }

    private static string BuildLazadaQueryString(Dictionary<string, string> parameters)
    {
        List<string> sortedKeys = new(parameters.Keys);
        sortedKeys.Sort(StringComparer.Ordinal);

        StringBuilder sb = new();
        foreach (string key in sortedKeys)
        {
            if (sb.Length > 0) sb.Append('&');
            sb.Append(Uri.EscapeDataString(key));
            sb.Append('=');
            sb.Append(Uri.EscapeDataString(parameters[key]));
        }

        return sb.ToString();
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
