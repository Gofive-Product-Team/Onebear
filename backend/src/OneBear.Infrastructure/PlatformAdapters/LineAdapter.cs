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

public class LineAdapter : IPlatformAdapter
{
    private const string LineApiBase = "https://api.line.me/v2/bot";
    private const string LineDataApiBase = "https://api-data.line.me/v2/bot";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<LineAdapter> _logger;

    public LineAdapter(IHttpClientFactory httpClientFactory, ILogger<LineAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.Line;

    /// <summary>
    /// LINE Module Auth userIds have format: LU{userId}-{botId}
    /// Standard LINE userId format: U{32hex} (33 chars)
    /// This normalizes Module Auth format to standard format for Messaging API.
    /// </summary>
    private static string NormalizeLineUserId(string rawUserId)
    {
        // Format: LUd77640fd8188319489643a1e14b539a5-U482b7aafb78f58424e726240c525311d
        // Extract: Ud77640fd8188319489643a1e14b539a5
        if (rawUserId.StartsWith("LU") && rawUserId.Contains('-'))
        {
            string userPart = rawUserId.Split('-')[0]; // LUd77640fd...
            return userPart[1..]; // Remove 'L' prefix → Ud77640fd...
        }
        return rawUserId; // Already standard format
    }

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("X-Line-Signature", out string? signature) || string.IsNullOrEmpty(signature))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_SIGNATURE", "X-Line-Signature header is missing.", ErrorType.Validation)));

        string channelSecret = integration.Credentials?.ChannelSecret
            ?? throw new InvalidOperationException("LINE channel secret not configured");

        byte[] key = Encoding.UTF8.GetBytes(channelSecret);
        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(body);
        string computed = Convert.ToBase64String(hash);

        byte[] expectedBytes = Encoding.UTF8.GetBytes(signature);
        byte[] computedBytes = Encoding.UTF8.GetBytes(computed);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_SIGNATURE", "Invalid LINE webhook signature.", ErrorType.Forbidden)));

        return Task.FromResult<Result<WebhookValidationResult>>(
            new Result<WebhookValidationResult>.Success(WebhookValidationResult.Valid));
    }

    public Task<Result<NormalizedMessage>> ParseInboundMessageAsync(
        JsonDocument payload, IntegrationChannel integration, CancellationToken ct)
    {
        if (!payload.RootElement.TryGetProperty("events", out JsonElement events) || events.GetArrayLength() == 0)
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_EVENTS", "No events in LINE webhook payload.", ErrorType.Validation)));

        JsonElement evt = events[0];
        string eventType = evt.GetProperty("type").GetString() ?? "";
        string rawUserId = evt.GetProperty("source").GetProperty("userId").GetString() ?? "";
        // LINE Module Auth userId format: LU{userId}-{botId} → normalize to standard U{userId}
        string externalUserId = NormalizeLineUserId(rawUserId);
        long timestamp = evt.GetProperty("timestamp").GetInt64();
        string? replyToken = evt.TryGetProperty("replyToken", out JsonElement rt) ? rt.GetString() : null;

        // Echo detection: no reply token and source userId matches the bot's own channel ID
        bool isEcho = string.IsNullOrEmpty(replyToken) && externalUserId == integration.Credentials?.ChannelId;

        string messageType;
        string? content = null;
        MessageAttachment? attachment = null;

        switch (eventType)
        {
            case "message":
                JsonElement msg = evt.GetProperty("message");
                string msgType = msg.GetProperty("type").GetString() ?? "text";
                string messageId = msg.GetProperty("id").GetString() ?? "";

                switch (msgType)
                {
                    case "text":
                        messageType = MessageType.Text;
                        content = msg.GetProperty("text").GetString();
                        break;
                    case "image":
                        messageType = MessageType.Image;
                        attachment = new MessageAttachment
                        {
                            FileUrl = $"{LineDataApiBase}/message/{messageId}/content",
                            ContentType = "image",
                            FileName = $"{messageId}.jpg",
                        };
                        break;
                    case "video":
                        messageType = MessageType.Video;
                        attachment = new MessageAttachment
                        {
                            FileUrl = $"{LineDataApiBase}/message/{messageId}/content",
                            ContentType = "video",
                            FileName = $"{messageId}.mp4",
                        };
                        break;
                    case "audio":
                        messageType = MessageType.Audio;
                        attachment = new MessageAttachment
                        {
                            FileUrl = $"{LineDataApiBase}/message/{messageId}/content",
                            ContentType = "audio",
                            FileName = $"{messageId}.m4a",
                        };
                        break;
                    case "sticker":
                        messageType = MessageType.Sticker;
                        string packageId = msg.GetProperty("packageId").GetString() ?? "";
                        string stickerId = msg.GetProperty("stickerId").GetString() ?? "";
                        content = $"sticker:{packageId}:{stickerId}";
                        break;
                    case "location":
                        messageType = MessageType.Location;
                        double lat = msg.GetProperty("latitude").GetDouble();
                        double lng = msg.GetProperty("longitude").GetDouble();
                        content = $"{lat},{lng}";
                        break;
                    case "file":
                        messageType = MessageType.File;
                        string? fileName = msg.TryGetProperty("fileName", out JsonElement fn) ? fn.GetString() : null;
                        attachment = new MessageAttachment
                        {
                            FileUrl = $"{LineDataApiBase}/message/{messageId}/content",
                            ContentType = "application/octet-stream",
                            FileName = fileName ?? messageId,
                        };
                        break;
                    default:
                        messageType = MessageType.Text;
                        content = $"[Unsupported message type: {msgType}]";
                        break;
                }
                break;
            case "follow":
                messageType = MessageType.System;
                content = "User followed";
                break;
            case "unfollow":
                messageType = MessageType.System;
                content = "User unfollowed";
                break;
            case "postback":
                messageType = MessageType.System;
                content = evt.TryGetProperty("postback", out JsonElement pb)
                    && pb.TryGetProperty("data", out JsonElement data)
                        ? data.GetString() : "postback";
                break;
            default:
                messageType = MessageType.System;
                content = $"[{eventType} event]";
                break;
        }

        NormalizedMessage result = new()
        {
            ExternalUserId = externalUserId,
            Content = content,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = evt.TryGetProperty("message", out JsonElement m)
                && m.TryGetProperty("id", out JsonElement id)
                    ? id.GetString() : null,
            Timestamp = timestamp,
            IsEcho = isEcho,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    public Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        object message = new { type = "text", text = content };
        return PushMessageAsync(recipientId, message, "SendText", integration, ct);
    }

    public Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        object message = media.MediaType switch
        {
            MessageType.Image => new { type = "image", originalContentUrl = media.Url, previewImageUrl = media.PreviewUrl ?? media.Url },
            MessageType.Video => new { type = "video", originalContentUrl = media.Url, previewImageUrl = media.PreviewUrl ?? "" },
            MessageType.Audio => (object)new { type = "audio", originalContentUrl = media.Url, duration = media.Duration ?? 60000 },
            MessageType.Sticker => new { type = "sticker", packageId = media.PackageId ?? "", stickerId = media.StickerId ?? "" },
            _ => new { type = "text", text = $"[Unsupported media: {media.MediaType}]" },
        };
        return PushMessageAsync(recipientId, message, "SendMedia", integration, ct);
    }

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        object message = new { type = "flex", altText = content.AltText, contents = content.Contents };
        return PushMessageAsync(recipientId, message, "SendRichContent", integration, ct);
    }

    public Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        // LINE uses long-lived channel access tokens; no refresh needed
        return Task.FromResult<Result<TokenRefreshResult>>(
            new Result<TokenRefreshResult>.Success(new TokenRefreshResult { Success = true }));
    }

    public async Task<Result<PlatformProfile>> GetUserProfileAsync(
        string externalUserId, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);

        HttpResponseMessage response = await client.GetAsync($"{LineApiBase}/profile/{externalUserId}", ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("LINE GetUserProfile failed: {StatusCode}", response.StatusCode);
            return new Result<PlatformProfile>.Failure(
                new Error("PROFILE_FETCH_FAILED", "Failed to fetch LINE user profile.", ErrorType.PlatformError));
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        return new Result<PlatformProfile>.Success(new PlatformProfile
        {
            ExternalUserId = externalUserId,
            DisplayName = doc.RootElement.TryGetProperty("displayName", out JsonElement dn) ? dn.GetString() : null,
            PictureUrl = doc.RootElement.TryGetProperty("pictureUrl", out JsonElement pu) ? pu.GetString() : null,
            StatusMessage = doc.RootElement.TryGetProperty("statusMessage", out JsonElement sm) ? sm.GetString() : null,
        });
    }

    public PlatformCapabilities GetCapabilities() => new()
    {
        SupportsImages = true,
        SupportsVideo = true,
        SupportsAudio = true,
        SupportsStickers = true,
        SupportsDocuments = true,
        SupportsLocation = true,
        SupportsRichContent = true,
        SupportsReactions = false,
        SupportsComments = false,
        RequiresMessagingWindow = false,
        TokenLifetime = null,
    };

    private async Task<Result<PlatformSendResult>> PushMessageAsync(
        string recipientId, object message, string operation, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);
        var body = new { to = recipientId, messages = new[] { message } };
        HttpResponseMessage response = await client.PostAsJsonAsync($"{LineApiBase}/message/push", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("LINE {Operation} failed: {StatusCode} {Error}", operation, response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false, ErrorMessage = error, ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        return new Result<PlatformSendResult>.Success(new PlatformSendResult { Success = true });
    }

    private HttpClient CreateAuthedClient(IntegrationChannel integration)
    {
        HttpClient client = _httpClientFactory.CreateClient("line-api");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", integration.Credentials?.AccessToken);

        // Module Auth requires X-Line-Bot-Id to identify which bot to act as
        // Without this header, LINE rejects with "Access to this API is not available"
        if (!string.IsNullOrEmpty(integration.Credentials?.PageId))
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Line-Bot-Id", integration.Credentials.PageId);
        }

        return client;
    }
}
