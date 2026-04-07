namespace OneBear.Infrastructure.PlatformAdapters;

using System.Net.Http.Headers;
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

public class TikTokAdapter : IPlatformAdapter
{
    private const string TikTokApiBase = "https://open.tiktokapis.com/v2";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TikTokAdapter> _logger;

    public TikTokAdapter(IHttpClientFactory httpClientFactory, ILogger<TikTokAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.TikTok;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("X-Tiktok-Signature", out string? signature) || string.IsNullOrEmpty(signature))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_SIGNATURE", "X-Tiktok-Signature header is missing.", ErrorType.Validation)));

        string clientSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("TikTok client secret not configured");

        byte[] key = Encoding.UTF8.GetBytes(clientSecret);
        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(body);
        string computed = Convert.ToHexString(hash).ToLowerInvariant();

        // Constant-time comparison to prevent timing attacks
        byte[] expectedBytes = Encoding.UTF8.GetBytes(signature);
        byte[] computedBytes = Encoding.UTF8.GetBytes(computed);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_SIGNATURE", "Invalid TikTok webhook signature.", ErrorType.Forbidden)));

        return Task.FromResult<Result<WebhookValidationResult>>(
            new Result<WebhookValidationResult>.Success(WebhookValidationResult.Valid));
    }

    public Task<Result<NormalizedMessage>> ParseInboundMessageAsync(
        JsonDocument payload, IntegrationChannel integration, CancellationToken ct)
    {
        JsonElement root = payload.RootElement;

        if (!root.TryGetProperty("event", out JsonElement eventEl))
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("MISSING_EVENT", "TikTok webhook payload missing 'event' field.", ErrorType.Validation)));

        string eventType = eventEl.GetString() ?? "";

        if (!root.TryGetProperty("content", out JsonElement content))
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("MISSING_CONTENT", "TikTok webhook payload missing 'content' field.", ErrorType.Validation)));

        return eventType switch
        {
            "receive_message" => ParseDirectMessage(content),
            "receive_comment" => ParseComment(content),
            _ => Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("UNSUPPORTED_EVENT", $"Unsupported TikTok event type: {eventType}", ErrorType.Validation))),
        };
    }

    public async Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);

        var body = new
        {
            recipient_id = recipientId,
            message_type = "text",
            text = new { text = content },
        };

        return await SendDirectMessageAsync(client, body, "SendText", ct);
    }

    public async Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);

        object body = media.MediaType switch
        {
            MessageType.Image => new
            {
                recipient_id = recipientId,
                message_type = "image",
                image = new { image_url = media.Url },
            },
            MessageType.Video => (object)new
            {
                recipient_id = recipientId,
                message_type = "video",
                video = new { video_url = media.Url },
            },
            _ => new
            {
                recipient_id = recipientId,
                message_type = "text",
                text = new { text = $"[Unsupported media type: {media.MediaType}] {media.Url}" },
            },
        };

        return await SendDirectMessageAsync(client, body, "SendMedia", ct);
    }

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        // TikTok DM API does not support rich content (templates, carousels, etc.)
        return Task.FromResult<Result<PlatformSendResult>>(
            new Result<PlatformSendResult>.Failure(
                new Error("UNSUPPORTED", "TikTok does not support rich content.", ErrorType.Validation)));
    }

    public async Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        string clientKey = integration.Credentials?.AppId
            ?? throw new InvalidOperationException("TikTok client key (AppId) not configured");
        string clientSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("TikTok client secret (AppSecret) not configured");
        string refreshToken = integration.Credentials?.RefreshToken
            ?? throw new InvalidOperationException("TikTok refresh token not configured");

        HttpClient client = _httpClientFactory.CreateClient("tiktok-api");

        var body = new
        {
            client_key = clientKey,
            client_secret = clientSecret,
            grant_type = "refresh_token",
            refresh_token = refreshToken,
        };

        HttpResponseMessage response = await client.PostAsJsonAsync($"{TikTokApiBase}/oauth/token/", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("TikTok token refresh failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = false,
                ErrorMessage = error,
            });
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        if (!doc.RootElement.TryGetProperty("data", out JsonElement data))
        {
            _logger.LogWarning("TikTok token refresh: unexpected response format");
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = false,
                ErrorMessage = "Unexpected response format from TikTok OAuth.",
            });
        }

        string? newAccessToken = data.TryGetProperty("access_token", out JsonElement atEl) ? atEl.GetString() : null;
        string? newRefreshToken = data.TryGetProperty("refresh_token", out JsonElement rtEl) ? rtEl.GetString() : null;
        long expiresIn = data.TryGetProperty("expires_in", out JsonElement expEl) ? expEl.GetInt64() : 86400;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + expiresIn;

        return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
        {
            Success = true,
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
        });
    }

    public async Task<Result<PlatformProfile>> GetUserProfileAsync(
        string externalUserId, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);

        HttpResponseMessage response = await client.GetAsync(
            $"{TikTokApiBase}/user/info/?fields=open_id,display_name,avatar_url", ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("TikTok GetUserProfile failed: {StatusCode}", response.StatusCode);
            return new Result<PlatformProfile>.Failure(
                new Error("PROFILE_FETCH_FAILED", "Failed to fetch TikTok user profile.", ErrorType.PlatformError));
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? displayName = null;
        string? avatarUrl = null;

        if (doc.RootElement.TryGetProperty("data", out JsonElement data)
            && data.TryGetProperty("user", out JsonElement user))
        {
            displayName = user.TryGetProperty("display_name", out JsonElement dnEl) ? dnEl.GetString() : null;
            avatarUrl = user.TryGetProperty("avatar_url", out JsonElement avEl) ? avEl.GetString() : null;
        }

        return new Result<PlatformProfile>.Success(new PlatformProfile
        {
            ExternalUserId = externalUserId,
            DisplayName = displayName,
            PictureUrl = avatarUrl,
            StatusMessage = null,
        });
    }

    public PlatformCapabilities GetCapabilities() => new()
    {
        SupportsImages = true,
        SupportsVideo = true,
        SupportsAudio = false,
        SupportsStickers = false,
        SupportsDocuments = false,
        SupportsLocation = false,
        SupportsRichContent = false,
        SupportsReactions = false,
        SupportsComments = true,
        RequiresMessagingWindow = false,
        TokenLifetime = TimeSpan.FromHours(24),
    };

    private static Task<Result<NormalizedMessage>> ParseDirectMessage(JsonElement content)
    {
        string externalUserId = content.TryGetProperty("sender_open_id", out JsonElement senderEl)
            ? senderEl.GetString() ?? "" : "";
        string? messageId = content.TryGetProperty("message_id", out JsonElement msgIdEl)
            ? msgIdEl.GetString() : null;
        string msgType = content.TryGetProperty("msg_type", out JsonElement mtEl)
            ? mtEl.GetString() ?? "text" : "text";
        long timestamp = content.TryGetProperty("create_time", out JsonElement ctEl)
            ? ctEl.GetInt64() : DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        string messageType;
        string? textContent = null;
        MessageAttachment? attachment = null;

        switch (msgType)
        {
            case "text":
                messageType = MessageType.Text;
                textContent = content.TryGetProperty("text", out JsonElement textEl)
                    ? textEl.GetString() : null;
                break;
            case "image":
                messageType = MessageType.Image;
                string? imageUrl = content.TryGetProperty("image_url", out JsonElement imgEl)
                    ? imgEl.GetString() : null;
                if (!string.IsNullOrEmpty(imageUrl))
                {
                    attachment = new MessageAttachment
                    {
                        FileUrl = imageUrl,
                        ContentType = "image",
                        FileName = $"{messageId ?? "image"}.jpg",
                    };
                }
                break;
            case "video":
                messageType = MessageType.Video;
                string? videoUrl = content.TryGetProperty("video_url", out JsonElement vidEl)
                    ? vidEl.GetString() : null;
                if (!string.IsNullOrEmpty(videoUrl))
                {
                    attachment = new MessageAttachment
                    {
                        FileUrl = videoUrl,
                        ContentType = "video",
                        FileName = $"{messageId ?? "video"}.mp4",
                    };
                }
                break;
            default:
                messageType = MessageType.Text;
                textContent = $"[Unsupported TikTok message type: {msgType}]";
                break;
        }

        NormalizedMessage result = new()
        {
            ExternalUserId = externalUserId,
            Content = textContent,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = messageId,
            Timestamp = timestamp,
            IsEcho = false,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    private static Task<Result<NormalizedMessage>> ParseComment(JsonElement content)
    {
        string externalUserId = content.TryGetProperty("user_open_id", out JsonElement userEl)
            ? userEl.GetString() ?? "" : "";
        string? commentId = content.TryGetProperty("comment_id", out JsonElement cidEl)
            ? cidEl.GetString() : null;
        string? text = content.TryGetProperty("text", out JsonElement textEl)
            ? textEl.GetString() : null;
        string? videoId = content.TryGetProperty("video_id", out JsonElement vidEl)
            ? vidEl.GetString() : null;
        long timestamp = content.TryGetProperty("create_time", out JsonElement ctEl)
            ? ctEl.GetInt64() : DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Include video ID context in the comment content
        string? commentContent = !string.IsNullOrEmpty(videoId)
            ? $"[Comment on video:{videoId}] {text}"
            : text;

        NormalizedMessage result = new()
        {
            ExternalUserId = externalUserId,
            Content = commentContent,
            MessageType = MessageType.Comment,
            Attachment = null,
            PlatformMessageId = commentId,
            Timestamp = timestamp,
            IsEcho = false,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    private async Task<Result<PlatformSendResult>> SendDirectMessageAsync(
        HttpClient client, object body, string operation, CancellationToken ct)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"{TikTokApiBase}/direct_message/send/", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("TikTok {Operation} failed: {StatusCode} {Error}", operation, response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        // Try to extract message ID from response
        string? platformMessageId = null;
        try
        {
            using JsonDocument doc = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            if (doc.RootElement.TryGetProperty("data", out JsonElement data)
                && data.TryGetProperty("message_id", out JsonElement idEl))
            {
                platformMessageId = idEl.GetString();
            }
        }
        catch (JsonException)
        {
            // Response may not be JSON; proceed without message ID
        }

        return new Result<PlatformSendResult>.Success(new PlatformSendResult
        {
            Success = true,
            PlatformMessageId = platformMessageId,
        });
    }

    private HttpClient CreateAuthedClient(IntegrationChannel integration)
    {
        HttpClient client = _httpClientFactory.CreateClient("tiktok-api");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", integration.Credentials?.AccessToken);
        return client;
    }
}
