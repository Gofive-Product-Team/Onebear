namespace OneBear.Infrastructure.PlatformAdapters;

using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.ValueObjects;

public class LazadaAdapter : IPlatformAdapter
{
    private const string LazadaApiBase = "https://api.lazada.com/rest";
    private const string LazadaAuthBase = "https://auth.lazada.com/rest";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<LazadaAdapter> _logger;

    public LazadaAdapter(IHttpClientFactory httpClientFactory, ILogger<LazadaAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.Lazada;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("Authorization", out string? signature) || string.IsNullOrEmpty(signature))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_SIGNATURE", "Authorization header is missing.", ErrorType.Validation)));

        string appSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Lazada App Secret not configured");

        // Lazada signs the raw body with HMAC-SHA256 using the App Secret
        byte[] key = Encoding.UTF8.GetBytes(appSecret);
        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(body);
        string computed = Convert.ToHexString(hash);

        byte[] expectedBytes = Encoding.UTF8.GetBytes(signature.ToUpperInvariant());
        byte[] computedBytes = Encoding.UTF8.GetBytes(computed);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_SIGNATURE", "Invalid Lazada webhook signature.", ErrorType.Forbidden)));

        return Task.FromResult<Result<WebhookValidationResult>>(
            new Result<WebhookValidationResult>.Success(WebhookValidationResult.Valid));
    }

    public Task<Result<NormalizedMessage>> ParseInboundMessageAsync(
        JsonDocument payload, IntegrationChannel integration, CancellationToken ct)
    {
        JsonElement root = payload.RootElement;

        if (!root.TryGetProperty("data", out JsonElement data))
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_DATA", "No data in Lazada webhook payload.", ErrorType.Validation)));

        string buyerId = data.TryGetProperty("buyer_id", out JsonElement bid) ? bid.GetString() ?? "" : "";
        string? messageId = data.TryGetProperty("message_id", out JsonElement mid) ? mid.GetString() : null;
        long timestamp = data.TryGetProperty("timestamp", out JsonElement ts) ? ts.GetInt64() : 0;

        string messageType;
        string? content = null;
        MessageAttachment? attachment = null;

        if (data.TryGetProperty("content", out JsonElement contentEl))
        {
            string contentType = contentEl.TryGetProperty("type", out JsonElement typeEl)
                ? typeEl.GetString() ?? "text" : "text";

            switch (contentType)
            {
                case "text":
                    messageType = MessageType.Text;
                    content = contentEl.TryGetProperty("txt", out JsonElement txt) ? txt.GetString() : null;
                    break;

                case "image":
                    messageType = MessageType.Image;
                    string? imageUrl = contentEl.TryGetProperty("url", out JsonElement imgUrl)
                        ? imgUrl.GetString() : null;
                    attachment = new MessageAttachment
                    {
                        FileUrl = imageUrl ?? "",
                        ContentType = "image",
                        FileName = $"{messageId ?? "lazada"}.jpg",
                    };
                    break;

                default:
                    messageType = MessageType.Text;
                    content = $"[Unsupported Lazada message type: {contentType}]";
                    break;
            }
        }
        else
        {
            messageType = MessageType.Text;
            content = "[Empty Lazada message]";
        }

        // Determine if echo: Lazada message_type 1 = incoming buyer message, 2 = seller sent message
        int msgTypeCode = root.TryGetProperty("message_type", out JsonElement mtEl) ? mtEl.GetInt32() : 1;
        bool isEcho = msgTypeCode == 2;

        NormalizedMessage result = new()
        {
            ExternalUserId = buyerId,
            Content = content,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = messageId,
            Timestamp = timestamp,
            IsEcho = isEcho,
            DisplayName = buyerId,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    public async Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        Dictionary<string, string> apiParams = new()
        {
            ["session_id"] = recipientId,
            ["message_type"] = "text",
            ["template_id"] = "0",
            ["txt"] = content,
        };

        return await CallLazadaApiAsync("/im/message/send", apiParams, "SendText", integration, ct);
    }

    public async Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        if (media.MediaType != MessageType.Image)
        {
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = $"Lazada only supports image media. Received: {media.MediaType}",
                ErrorCode = "UNSUPPORTED_MEDIA",
            });
        }

        Dictionary<string, string> apiParams = new()
        {
            ["session_id"] = recipientId,
            ["message_type"] = "image",
            ["template_id"] = "0",
            ["url"] = media.Url,
        };

        return await CallLazadaApiAsync("/im/message/send", apiParams, "SendMedia", integration, ct);
    }

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        // Lazada does not support rich content / templates via chat API
        return Task.FromResult<Result<PlatformSendResult>>(
            new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = "Lazada does not support rich content messages.",
                ErrorCode = "UNSUPPORTED",
            }));
    }

    public async Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        string appKey = integration.Credentials?.AppId
            ?? throw new InvalidOperationException("Lazada App Key not configured");
        string appSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Lazada App Secret not configured");
        string refreshToken = integration.Credentials?.RefreshToken
            ?? throw new InvalidOperationException("Lazada refresh token not configured");

        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        Dictionary<string, string> signParams = new()
        {
            ["app_key"] = appKey,
            ["refresh_token"] = refreshToken,
            ["timestamp"] = timestamp.ToString(),
        };

        string sign = ComputeLazadaSign("/auth/token/refresh", signParams, appSecret);

        HttpClient client = _httpClientFactory.CreateClient("lazada-api");
        string queryString = BuildQueryString(signParams);
        string url = $"{LazadaAuthBase}/auth/token/refresh?{queryString}&sign={Uri.EscapeDataString(sign)}";

        HttpResponseMessage response = await client.PostAsync(url, null, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Lazada RefreshToken failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = false,
                ErrorMessage = error,
            });
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? code = doc.RootElement.TryGetProperty("code", out JsonElement codeEl)
            ? codeEl.GetString() : null;

        if (code != "0")
        {
            string? errorMsg = doc.RootElement.TryGetProperty("message", out JsonElement msgEl)
                ? msgEl.GetString() : "Unknown Lazada error";
            _logger.LogWarning("Lazada RefreshToken API error: {Code} {Message}", code, errorMsg);
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = false,
                ErrorMessage = errorMsg,
            });
        }

        string? accessToken = doc.RootElement.TryGetProperty("access_token", out JsonElement at)
            ? at.GetString() : null;
        string? newRefreshToken = doc.RootElement.TryGetProperty("refresh_token", out JsonElement rt)
            ? rt.GetString() : null;
        long expiresIn = doc.RootElement.TryGetProperty("expires_in", out JsonElement ei)
            ? ei.GetInt64() : 0;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (expiresIn * 1000);

        return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
        {
            Success = true,
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
        });
    }

    public Task<Result<PlatformProfile>> GetUserProfileAsync(
        string externalUserId, IntegrationChannel integration, CancellationToken ct)
    {
        // Lazada does not provide a user profile API for chat buyers.
        // Return the buyer_id as the display name.
        return Task.FromResult<Result<PlatformProfile>>(
            new Result<PlatformProfile>.Success(new PlatformProfile
            {
                ExternalUserId = externalUserId,
                DisplayName = externalUserId,
            }));
    }

    public PlatformCapabilities GetCapabilities() => new()
    {
        SupportsImages = true,
        SupportsVideo = false,
        SupportsAudio = false,
        SupportsStickers = false,
        SupportsDocuments = false,
        SupportsLocation = false,
        SupportsRichContent = false,
        SupportsReactions = false,
        SupportsComments = false,
        RequiresMessagingWindow = false,
        TokenLifetime = TimeSpan.FromDays(30),
    };

    private async Task<Result<PlatformSendResult>> CallLazadaApiAsync(
        string apiPath, Dictionary<string, string> apiParams, string operation,
        IntegrationChannel integration, CancellationToken ct)
    {
        string appKey = integration.Credentials?.AppId
            ?? throw new InvalidOperationException("Lazada App Key not configured");
        string appSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Lazada App Secret not configured");
        string accessToken = integration.Credentials?.AccessToken
            ?? throw new InvalidOperationException("Lazada access token not configured");

        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // Build the full params for signing (system params + API params)
        Dictionary<string, string> allParams = new(apiParams)
        {
            ["app_key"] = appKey,
            ["timestamp"] = timestamp.ToString(),
            ["access_token"] = accessToken,
        };

        string sign = ComputeLazadaSign(apiPath, allParams, appSecret);

        HttpClient client = _httpClientFactory.CreateClient("lazada-api");
        string queryString = BuildQueryString(allParams);
        string url = $"{LazadaApiBase}{apiPath}?{queryString}&sign={Uri.EscapeDataString(sign)}";

        HttpResponseMessage response = await client.PostAsync(url, null, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Lazada {Operation} failed: {StatusCode} {Error}", operation, response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? code = doc.RootElement.TryGetProperty("code", out JsonElement codeEl)
            ? codeEl.GetString() : null;

        if (code != "0")
        {
            string? errorMsg = doc.RootElement.TryGetProperty("message", out JsonElement msgEl)
                ? msgEl.GetString() : "Unknown Lazada API error";
            _logger.LogWarning("Lazada {Operation} API error: {Code} {Message}", operation, code, errorMsg);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = errorMsg,
                ErrorCode = code,
            });
        }

        string? messageId = null;
        if (doc.RootElement.TryGetProperty("data", out JsonElement dataEl)
            && dataEl.TryGetProperty("message_id", out JsonElement msgIdEl))
        {
            messageId = msgIdEl.GetString();
        }

        return new Result<PlatformSendResult>.Success(new PlatformSendResult
        {
            Success = true,
            PlatformMessageId = messageId,
        });
    }

    /// <summary>
    /// Computes the Lazada API signature.
    /// 1. Sort all params alphabetically by key
    /// 2. Concatenate: apiPath + key1 + value1 + key2 + value2 + ...
    /// 3. HMAC-SHA256 with AppSecret
    /// 4. Convert to uppercase hex
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

    private static string BuildQueryString(Dictionary<string, string> parameters)
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
}
