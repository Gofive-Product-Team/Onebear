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

public class ShopeeAdapter : IPlatformAdapter
{
    private const string ShopeeApiBase = "https://partner.shopeemobile.com/api/v2";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ShopeeAdapter> _logger;

    public ShopeeAdapter(IHttpClientFactory httpClientFactory, ILogger<ShopeeAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.Shopee;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("Authorization", out string? signature) || string.IsNullOrEmpty(signature))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_SIGNATURE", "Authorization header is missing.", ErrorType.Validation)));

        string partnerKey = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Shopee Partner Key not configured");

        // Shopee signs the raw body with HMAC-SHA256 using the partner key
        byte[] key = Encoding.UTF8.GetBytes(partnerKey);
        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(body);
        string computed = Convert.ToHexStringLower(hash);

        byte[] expectedBytes = Encoding.UTF8.GetBytes(signature.ToLowerInvariant());
        byte[] computedBytes = Encoding.UTF8.GetBytes(computed);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_SIGNATURE", "Invalid Shopee webhook signature.", ErrorType.Forbidden)));

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
                    new Error("NO_DATA", "No data in Shopee webhook payload.", ErrorType.Validation)));

        // from_id is the sender; if it matches the shop, this is an echo
        long fromId = data.TryGetProperty("from_id", out JsonElement fid) ? fid.GetInt64() : 0;
        long toId = data.TryGetProperty("to_id", out JsonElement tid) ? tid.GetInt64() : 0;
        string? messageId = data.TryGetProperty("message_id", out JsonElement mid) ? mid.GetString() : null;
        long timestamp = data.TryGetProperty("timestamp", out JsonElement ts) ? ts.GetInt64() : 0;

        // Detect echo: if the sender (from_id) matches the shop_id from credentials
        string? shopId = integration.Credentials?.ChannelId;
        bool isEcho = shopId != null && fromId.ToString() == shopId;

        string externalUserId = isEcho ? toId.ToString() : fromId.ToString();

        string shopeeMessageType = data.TryGetProperty("message_type", out JsonElement mtEl)
            ? mtEl.GetString() ?? "text" : "text";

        string messageType;
        string? content = null;
        MessageAttachment? attachment = null;
        MessageOrder? order = null;

        switch (shopeeMessageType)
        {
            case "text":
                messageType = MessageType.Text;
                if (data.TryGetProperty("content", out JsonElement textContent))
                {
                    content = textContent.TryGetProperty("text", out JsonElement txt)
                        ? txt.GetString() : null;
                }
                break;

            case "image":
                messageType = MessageType.Image;
                if (data.TryGetProperty("content", out JsonElement imgContent))
                {
                    string? imageUrl = imgContent.TryGetProperty("image_url", out JsonElement imgUrl)
                        ? imgUrl.GetString() : null;
                    attachment = new MessageAttachment
                    {
                        FileUrl = imageUrl ?? "",
                        ContentType = "image",
                        FileName = $"{messageId ?? "shopee"}.jpg",
                    };
                }
                break;

            case "sticker":
                messageType = MessageType.Sticker;
                if (data.TryGetProperty("content", out JsonElement stickerContent))
                {
                    string? stickerId = stickerContent.TryGetProperty("sticker_id", out JsonElement sid)
                        ? sid.GetString() : null;
                    string? stickerPackageId = stickerContent.TryGetProperty("sticker_package_id", out JsonElement spid)
                        ? spid.GetString() : null;
                    content = $"sticker:{stickerPackageId}:{stickerId}";
                }
                break;

            case "order":
                messageType = MessageType.Order;
                if (data.TryGetProperty("content", out JsonElement orderContent))
                {
                    string? orderSn = orderContent.TryGetProperty("order_sn", out JsonElement osn)
                        ? osn.GetString() : null;
                    content = $"[Order: {orderSn}]";
                    order = new MessageOrder
                    {
                        OrderId = orderSn ?? "",
                    };
                }
                break;

            default:
                messageType = MessageType.Text;
                content = $"[Unsupported Shopee message type: {shopeeMessageType}]";
                break;
        }

        NormalizedMessage result = new()
        {
            ExternalUserId = externalUserId,
            Content = content,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = messageId,
            Timestamp = timestamp,
            IsEcho = isEcho,
            DisplayName = externalUserId,
            Order = order,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    public async Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        var body = new
        {
            to_id = long.Parse(recipientId),
            message_type = "text",
            content = new { text = content },
        };

        return await CallShopeeApiAsync("/sellerchat/send_message", body, "SendText", integration, ct);
    }

    public async Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        if (media.MediaType != MessageType.Image)
        {
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = $"Shopee only supports image media. Received: {media.MediaType}",
                ErrorCode = "UNSUPPORTED_MEDIA",
            });
        }

        var body = new
        {
            to_id = long.Parse(recipientId),
            message_type = "image",
            content = new { image_url = media.Url },
        };

        return await CallShopeeApiAsync("/sellerchat/send_message", body, "SendMedia", integration, ct);
    }

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        // Shopee does not support rich content / templates via chat API
        return Task.FromResult<Result<PlatformSendResult>>(
            new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = "Shopee does not support rich content messages.",
                ErrorCode = "UNSUPPORTED",
            }));
    }

    public async Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        string partnerId = integration.Credentials?.AppId
            ?? throw new InvalidOperationException("Shopee Partner ID not configured");
        string partnerKey = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Shopee Partner Key not configured");
        string refreshToken = integration.Credentials?.RefreshToken
            ?? throw new InvalidOperationException("Shopee refresh token not configured");
        string shopId = integration.Credentials?.ChannelId
            ?? throw new InvalidOperationException("Shopee Shop ID not configured");

        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        string apiPath = "/api/v2/auth/access_token/get";

        string sign = ComputeShopeeSign(
            long.Parse(partnerId), apiPath, timestamp, "", long.Parse(shopId), partnerKey);

        HttpClient client = _httpClientFactory.CreateClient("shopee-api");
        string url = $"{ShopeeApiBase}/auth/access_token/get"
            + $"?partner_id={Uri.EscapeDataString(partnerId)}"
            + $"&timestamp={timestamp}"
            + $"&sign={Uri.EscapeDataString(sign)}"
            + $"&shop_id={Uri.EscapeDataString(shopId)}";

        var body = new
        {
            shop_id = long.Parse(shopId),
            partner_id = long.Parse(partnerId),
            refresh_token = refreshToken,
        };

        HttpResponseMessage response = await client.PostAsJsonAsync(url, body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Shopee RefreshToken failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = false,
                ErrorMessage = error,
            });
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? errorField = doc.RootElement.TryGetProperty("error", out JsonElement errEl)
            ? errEl.GetString() : null;

        if (!string.IsNullOrEmpty(errorField))
        {
            string? errorMsg = doc.RootElement.TryGetProperty("message", out JsonElement msgEl)
                ? msgEl.GetString() : errorField;
            _logger.LogWarning("Shopee RefreshToken API error: {Error} {Message}", errorField, errorMsg);
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
        long expireIn = doc.RootElement.TryGetProperty("expire_in", out JsonElement ei)
            ? ei.GetInt64() : 0;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (expireIn * 1000);

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
        // Shopee does not provide a user profile API for chat buyers.
        // Return the buyer user ID as the display name.
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
        TokenLifetime = TimeSpan.FromHours(4),
    };

    private async Task<Result<PlatformSendResult>> CallShopeeApiAsync(
        string apiPath, object body, string operation,
        IntegrationChannel integration, CancellationToken ct)
    {
        string partnerId = integration.Credentials?.AppId
            ?? throw new InvalidOperationException("Shopee Partner ID not configured");
        string partnerKey = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Shopee Partner Key not configured");
        string accessToken = integration.Credentials?.AccessToken
            ?? throw new InvalidOperationException("Shopee access token not configured");
        string shopId = integration.Credentials?.ChannelId
            ?? throw new InvalidOperationException("Shopee Shop ID not configured");

        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        string fullApiPath = $"/api/v2{apiPath}";

        string sign = ComputeShopeeSign(
            long.Parse(partnerId), fullApiPath, timestamp, accessToken, long.Parse(shopId), partnerKey);

        HttpClient client = _httpClientFactory.CreateClient("shopee-api");
        string url = $"{ShopeeApiBase}{apiPath}"
            + $"?partner_id={Uri.EscapeDataString(partnerId)}"
            + $"&timestamp={timestamp}"
            + $"&access_token={Uri.EscapeDataString(accessToken)}"
            + $"&shop_id={Uri.EscapeDataString(shopId)}"
            + $"&sign={Uri.EscapeDataString(sign)}";

        HttpResponseMessage response = await client.PostAsJsonAsync(url, body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Shopee {Operation} failed: {StatusCode} {Error}", operation, response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? errorField = doc.RootElement.TryGetProperty("error", out JsonElement errEl)
            ? errEl.GetString() : null;

        if (!string.IsNullOrEmpty(errorField))
        {
            string? errorMsg = doc.RootElement.TryGetProperty("message", out JsonElement msgEl)
                ? msgEl.GetString() : errorField;
            _logger.LogWarning("Shopee {Operation} API error: {Error} {Message}", operation, errorField, errorMsg);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = errorMsg,
                ErrorCode = errorField,
            });
        }

        string? messageId = null;
        if (doc.RootElement.TryGetProperty("response", out JsonElement respEl)
            && respEl.TryGetProperty("message_id", out JsonElement msgIdEl))
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
    /// Computes the Shopee API signature.
    /// base_string = partner_id + api_path + timestamp + access_token + shop_id
    /// HMAC-SHA256 with partner_key, output as lowercase hex.
    /// </summary>
    private static string ComputeShopeeSign(
        long partnerId, string apiPath, long timestamp, string accessToken, long shopId, string partnerKey)
    {
        string baseString = $"{partnerId}{apiPath}{timestamp}{accessToken}{shopId}";

        byte[] keyBytes = Encoding.UTF8.GetBytes(partnerKey);
        using HMACSHA256 hmac = new(keyBytes);
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(baseString));

        return Convert.ToHexStringLower(hash);
    }
}
