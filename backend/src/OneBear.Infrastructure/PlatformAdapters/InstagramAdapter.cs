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

public class InstagramAdapter : IPlatformAdapter
{
    private const string GraphApiBase = "https://graph.facebook.com/v21.0";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<InstagramAdapter> _logger;

    public InstagramAdapter(IHttpClientFactory httpClientFactory, ILogger<InstagramAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.Instagram;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("X-Hub-Signature-256", out string? signature) || string.IsNullOrEmpty(signature))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_SIGNATURE", "X-Hub-Signature-256 header is missing.", ErrorType.Validation)));

        string appSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Instagram app secret not configured");

        byte[] key = Encoding.UTF8.GetBytes(appSecret);
        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(body);
        string computedHex = "sha256=" + Convert.ToHexStringLower(hash);

        byte[] expectedBytes = Encoding.UTF8.GetBytes(signature);
        byte[] computedBytes = Encoding.UTF8.GetBytes(computedHex);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_SIGNATURE", "Invalid Instagram webhook signature.", ErrorType.Forbidden)));

        return Task.FromResult<Result<WebhookValidationResult>>(
            new Result<WebhookValidationResult>.Success(WebhookValidationResult.Valid));
    }

    public Task<Result<NormalizedMessage>> ParseInboundMessageAsync(
        JsonDocument payload, IntegrationChannel integration, CancellationToken ct)
    {
        JsonElement root = payload.RootElement;

        if (!root.TryGetProperty("entry", out JsonElement entries) || entries.GetArrayLength() == 0)
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_ENTRIES", "No entries in Instagram webhook payload.", ErrorType.Validation)));

        JsonElement entry = entries[0];
        if (!entry.TryGetProperty("messaging", out JsonElement messagingArray) || messagingArray.GetArrayLength() == 0)
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_MESSAGING", "No messaging events in Instagram webhook entry.", ErrorType.Validation)));

        JsonElement messaging = messagingArray[0];
        string senderId = messaging.GetProperty("sender").GetProperty("id").GetString() ?? "";
        long timestamp = messaging.GetProperty("timestamp").GetInt64();

        // Reaction event
        if (messaging.TryGetProperty("reaction", out JsonElement reaction))
        {
            string emoji = reaction.TryGetProperty("emoji", out JsonElement emojiEl)
                ? emojiEl.GetString() ?? ""
                : reaction.TryGetProperty("reaction", out JsonElement reactionEl)
                    ? reactionEl.GetString() ?? ""
                    : "";

            string action = reaction.TryGetProperty("action", out JsonElement actionEl)
                ? actionEl.GetString() ?? "react"
                : "react";

            string reactionMessageType = action == "unreact"
                ? MessageType.ReactionRemoved
                : MessageType.ReactionAdded;

            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Success(new NormalizedMessage
                {
                    ExternalUserId = senderId,
                    Content = emoji,
                    MessageType = reactionMessageType,
                    Timestamp = timestamp,
                    IsEcho = false,
                }));
        }

        // Message event
        if (!messaging.TryGetProperty("message", out JsonElement message))
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("UNKNOWN_EVENT", "Unrecognized Instagram webhook event structure.", ErrorType.Validation)));

        // Echo detection
        bool isEcho = message.TryGetProperty("is_echo", out JsonElement echoEl) && echoEl.GetBoolean();

        string? platformMessageId = message.TryGetProperty("mid", out JsonElement midEl)
            ? midEl.GetString()
            : null;

        string messageType;
        string? content = null;
        MessageAttachment? attachment = null;
        ReplyToMessage? replyTo = null;

        // Story reply detection
        if (message.TryGetProperty("reply_to", out JsonElement replyToEl)
            && replyToEl.TryGetProperty("story", out JsonElement storyReply))
        {
            string? storyUrl = storyReply.TryGetProperty("url", out JsonElement storyUrlEl)
                ? storyUrlEl.GetString()
                : null;
            string? storyId = storyReply.TryGetProperty("id", out JsonElement storyIdEl)
                ? storyIdEl.GetString()
                : null;

            replyTo = new ReplyToMessage
            {
                MessageId = storyId ?? "",
                Content = storyUrl,
                MessageType = MessageType.Story,
            };
        }

        // Check for attachments
        if (message.TryGetProperty("attachments", out JsonElement attachments) && attachments.GetArrayLength() > 0)
        {
            JsonElement firstAttachment = attachments[0];
            string attachmentType = firstAttachment.TryGetProperty("type", out JsonElement typeEl)
                ? typeEl.GetString() ?? "image"
                : "image";

            string? attachmentUrl = firstAttachment.TryGetProperty("payload", out JsonElement payloadEl)
                && payloadEl.TryGetProperty("url", out JsonElement urlEl)
                    ? urlEl.GetString()
                    : null;

            switch (attachmentType)
            {
                case "image":
                    messageType = MessageType.Image;
                    attachment = new MessageAttachment
                    {
                        FileUrl = attachmentUrl ?? "",
                        ContentType = "image",
                        FileName = $"{platformMessageId ?? "image"}.jpg",
                    };
                    break;
                case "video":
                    messageType = MessageType.Video;
                    attachment = new MessageAttachment
                    {
                        FileUrl = attachmentUrl ?? "",
                        ContentType = "video",
                        FileName = $"{platformMessageId ?? "video"}.mp4",
                    };
                    break;
                case "story_mention":
                    messageType = MessageType.Story;
                    content = "[Story mention]";
                    attachment = new MessageAttachment
                    {
                        FileUrl = attachmentUrl ?? "",
                        ContentType = "image",
                        FileName = $"{platformMessageId ?? "story"}_mention.jpg",
                    };
                    break;
                case "reel":
                    messageType = MessageType.Video;
                    content = "[Reel]";
                    attachment = new MessageAttachment
                    {
                        FileUrl = attachmentUrl ?? "",
                        ContentType = "video",
                        FileName = $"{platformMessageId ?? "reel"}.mp4",
                    };
                    break;
                default:
                    messageType = MessageType.Text;
                    content = $"[Unsupported attachment type: {attachmentType}]";
                    break;
            }
        }
        else if (message.TryGetProperty("text", out JsonElement textEl))
        {
            messageType = MessageType.Text;
            content = textEl.GetString();
        }
        else
        {
            messageType = MessageType.Text;
            content = "[Unsupported Instagram message]";
        }

        NormalizedMessage result = new()
        {
            ExternalUserId = senderId,
            Content = content,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = platformMessageId,
            Timestamp = timestamp,
            ReplyTo = replyTo,
            IsEcho = isEcho,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    public async Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);

        var body = new
        {
            recipient = new { id = recipientId },
            message = new { text = content },
        };

        HttpResponseMessage response = await client.PostAsJsonAsync($"{GraphApiBase}/me/messages", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Instagram SendText failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        string? messageId = await ExtractMessageIdAsync(response, ct);
        return new Result<PlatformSendResult>.Success(new PlatformSendResult
        {
            Success = true,
            PlatformMessageId = messageId,
        });
    }

    public async Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        string attachmentType = media.MediaType switch
        {
            MessageType.Image => "image",
            MessageType.Video => "video",
            _ => "",
        };

        if (string.IsNullOrEmpty(attachmentType))
        {
            _logger.LogWarning("Instagram SendMedia: unsupported media type {MediaType}", media.MediaType);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = $"Instagram does not support media type: {media.MediaType}",
                ErrorCode = "UNSUPPORTED_MEDIA_TYPE",
            });
        }

        HttpClient client = CreateAuthedClient(integration);

        var body = new
        {
            recipient = new { id = recipientId },
            message = new
            {
                attachment = new
                {
                    type = attachmentType,
                    payload = new { url = media.Url },
                },
            },
        };

        HttpResponseMessage response = await client.PostAsJsonAsync($"{GraphApiBase}/me/messages", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Instagram SendMedia failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        string? messageId = await ExtractMessageIdAsync(response, ct);
        return new Result<PlatformSendResult>.Success(new PlatformSendResult
        {
            Success = true,
            PlatformMessageId = messageId,
        });
    }

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        // Instagram does not support templates or rich content
        return Task.FromResult<Result<PlatformSendResult>>(
            new Result<PlatformSendResult>.Failure(
                new Error("UNSUPPORTED", "Instagram does not support rich content / templates.", ErrorType.Validation)));
    }

    public async Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        string? currentToken = integration.Credentials?.AccessToken;
        string? appId = integration.Credentials?.AppId;
        string? appSecret = integration.Credentials?.AppSecret;

        if (string.IsNullOrEmpty(currentToken) || string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret))
            return new Result<TokenRefreshResult>.Failure(
                new Error("MISSING_CREDENTIALS", "Instagram credentials are incomplete for token refresh.", ErrorType.Validation));

        HttpClient client = _httpClientFactory.CreateClient("instagram-api");

        string url = $"{GraphApiBase}/oauth/access_token"
            + $"?grant_type=fb_exchange_token"
            + $"&client_id={appId}"
            + $"&client_secret={appSecret}"
            + $"&fb_exchange_token={currentToken}";

        HttpResponseMessage response = await client.GetAsync(url, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Instagram RefreshToken failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = false,
                ErrorMessage = error,
            });
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? accessToken = doc.RootElement.TryGetProperty("access_token", out JsonElement atEl)
            ? atEl.GetString()
            : null;

        long? expiresIn = doc.RootElement.TryGetProperty("expires_in", out JsonElement expEl)
            ? expEl.GetInt64()
            : null;

        long? expiresAt = expiresIn.HasValue
            ? DateTimeOffset.UtcNow.ToUnixTimeSeconds() + expiresIn.Value
            : null;

        return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
        {
            Success = true,
            AccessToken = accessToken,
            ExpiresAt = expiresAt,
        });
    }

    public async Task<Result<PlatformProfile>> GetUserProfileAsync(
        string externalUserId, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);

        string url = $"{GraphApiBase}/{externalUserId}?fields=name,profile_pic";
        HttpResponseMessage response = await client.GetAsync(url, ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Instagram GetUserProfile failed: {StatusCode}", response.StatusCode);
            return new Result<PlatformProfile>.Failure(
                new Error("PROFILE_FETCH_FAILED", "Failed to fetch Instagram user profile.", ErrorType.PlatformError));
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        // Instagram returns "name" (not first_name/last_name like Facebook)
        string? displayName = doc.RootElement.TryGetProperty("name", out JsonElement nameEl)
            ? nameEl.GetString()
            : null;

        string? pictureUrl = doc.RootElement.TryGetProperty("profile_pic", out JsonElement picEl)
            ? picEl.GetString()
            : null;

        return new Result<PlatformProfile>.Success(new PlatformProfile
        {
            ExternalUserId = externalUserId,
            DisplayName = displayName,
            PictureUrl = pictureUrl,
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
        SupportsReactions = true,
        SupportsComments = true,
        RequiresMessagingWindow = true,
        TokenLifetime = TimeSpan.FromDays(60),
    };

    private HttpClient CreateAuthedClient(IntegrationChannel integration)
    {
        HttpClient client = _httpClientFactory.CreateClient("instagram-api");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", integration.Credentials?.AccessToken);
        return client;
    }

    private static async Task<string?> ExtractMessageIdAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            using JsonDocument doc = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            return doc.RootElement.TryGetProperty("message_id", out JsonElement midEl)
                ? midEl.GetString()
                : null;
        }
        catch
        {
            return null;
        }
    }
}
