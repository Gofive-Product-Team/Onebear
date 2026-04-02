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

public class FacebookAdapter : IPlatformAdapter
{
    private const string GraphApiBase = "https://graph.facebook.com/v21.0";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<FacebookAdapter> _logger;

    public FacebookAdapter(IHttpClientFactory httpClientFactory, ILogger<FacebookAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.Facebook;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("X-Hub-Signature-256", out string? signature) || string.IsNullOrEmpty(signature))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_SIGNATURE", "X-Hub-Signature-256 header is missing.", ErrorType.Validation)));

        string appSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Facebook App Secret not configured");

        byte[] key = Encoding.UTF8.GetBytes(appSecret);
        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(body);
        string computed = "sha256=" + Convert.ToHexStringLower(hash);

        byte[] expectedBytes = Encoding.UTF8.GetBytes(signature);
        byte[] computedBytes = Encoding.UTF8.GetBytes(computed);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_SIGNATURE", "Invalid Facebook webhook signature.", ErrorType.Forbidden)));

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
                    new Error("NO_ENTRY", "No entry in Facebook webhook payload.", ErrorType.Validation)));

        JsonElement entry = entries[0];

        if (!entry.TryGetProperty("messaging", out JsonElement messagingArray) || messagingArray.GetArrayLength() == 0)
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_MESSAGING", "No messaging events in Facebook webhook entry.", ErrorType.Validation)));

        JsonElement messaging = messagingArray[0];
        string senderId = messaging.GetProperty("sender").GetProperty("id").GetString() ?? "";
        long timestamp = messaging.TryGetProperty("timestamp", out JsonElement ts) ? ts.GetInt64() : 0;

        // Reaction event
        if (messaging.TryGetProperty("reaction", out JsonElement reaction))
        {
            string action = reaction.TryGetProperty("action", out JsonElement act) ? act.GetString() ?? "" : "";
            string emoji = reaction.TryGetProperty("emoji", out JsonElement em) ? em.GetString() ?? "" : "";
            string reactionType = action == "unreact" ? MessageType.ReactionRemoved : MessageType.ReactionAdded;

            NormalizedMessage reactionResult = new()
            {
                ExternalUserId = senderId,
                Content = emoji,
                MessageType = reactionType,
                Timestamp = timestamp,
                IsEcho = false,
            };

            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Success(reactionResult));
        }

        // Message event
        if (!messaging.TryGetProperty("message", out JsonElement msg))
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("UNSUPPORTED_EVENT", "Unsupported Facebook webhook event type.", ErrorType.Validation)));

        string platformMessageId = msg.TryGetProperty("mid", out JsonElement mid) ? mid.GetString() ?? "" : "";
        bool isEcho = msg.TryGetProperty("is_echo", out JsonElement echoElement) && echoElement.GetBoolean();

        string messageType;
        string? content = null;
        MessageAttachment? attachment = null;

        // Check for attachments
        if (msg.TryGetProperty("attachments", out JsonElement attachments) && attachments.GetArrayLength() > 0)
        {
            JsonElement firstAttachment = attachments[0];
            string attachmentType = firstAttachment.TryGetProperty("type", out JsonElement typeEl)
                ? typeEl.GetString() ?? "" : "";

            switch (attachmentType)
            {
                case "image":
                    messageType = MessageType.Image;
                    string? imageUrl = firstAttachment.TryGetProperty("payload", out JsonElement imgPayload)
                        && imgPayload.TryGetProperty("url", out JsonElement imgUrl) ? imgUrl.GetString() : null;
                    attachment = new MessageAttachment
                    {
                        FileUrl = imageUrl ?? "",
                        ContentType = "image",
                        FileName = $"{platformMessageId}.jpg",
                    };
                    break;

                case "video":
                    messageType = MessageType.Video;
                    string? videoUrl = firstAttachment.TryGetProperty("payload", out JsonElement vidPayload)
                        && vidPayload.TryGetProperty("url", out JsonElement vidUrl) ? vidUrl.GetString() : null;
                    attachment = new MessageAttachment
                    {
                        FileUrl = videoUrl ?? "",
                        ContentType = "video",
                        FileName = $"{platformMessageId}.mp4",
                    };
                    break;

                case "audio":
                    messageType = MessageType.Audio;
                    string? audioUrl = firstAttachment.TryGetProperty("payload", out JsonElement audPayload)
                        && audPayload.TryGetProperty("url", out JsonElement audUrl) ? audUrl.GetString() : null;
                    attachment = new MessageAttachment
                    {
                        FileUrl = audioUrl ?? "",
                        ContentType = "audio",
                        FileName = $"{platformMessageId}.mp3",
                    };
                    break;

                case "file":
                    messageType = MessageType.File;
                    string? fileUrl = firstAttachment.TryGetProperty("payload", out JsonElement filePayload)
                        && filePayload.TryGetProperty("url", out JsonElement fUrl) ? fUrl.GetString() : null;
                    attachment = new MessageAttachment
                    {
                        FileUrl = fileUrl ?? "",
                        ContentType = "application/octet-stream",
                        FileName = platformMessageId,
                    };
                    break;

                case "location":
                    messageType = MessageType.Location;
                    if (firstAttachment.TryGetProperty("payload", out JsonElement locPayload)
                        && locPayload.TryGetProperty("coordinates", out JsonElement coords))
                    {
                        double lat = coords.TryGetProperty("lat", out JsonElement latEl) ? latEl.GetDouble() : 0;
                        double lng = coords.TryGetProperty("long", out JsonElement lngEl) ? lngEl.GetDouble() : 0;
                        content = $"{lat},{lng}";
                    }
                    break;

                case "fallback":
                    messageType = MessageType.Text;
                    content = msg.TryGetProperty("text", out JsonElement fallbackText)
                        ? fallbackText.GetString() : "[Unsupported attachment]";
                    break;

                default:
                    messageType = MessageType.Text;
                    content = $"[Unsupported attachment type: {attachmentType}]";
                    break;
            }
        }
        // Check for sticker
        else if (msg.TryGetProperty("sticker_id", out JsonElement stickerIdElement))
        {
            messageType = MessageType.Sticker;
            string stickerId = stickerIdElement.GetInt64().ToString();
            content = $"sticker:{stickerId}";
        }
        // Text message
        else if (msg.TryGetProperty("text", out JsonElement textElement))
        {
            messageType = MessageType.Text;
            content = textElement.GetString();
        }
        else
        {
            messageType = MessageType.Text;
            content = "[Unsupported message format]";
        }

        NormalizedMessage result = new()
        {
            ExternalUserId = senderId,
            Content = content,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = platformMessageId,
            Timestamp = timestamp,
            IsEcho = isEcho,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    public Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        var body = new
        {
            recipient = new { id = recipientId },
            message = new { text = content },
        };
        return SendMessageAsync(body, "SendText", integration, ct);
    }

    public Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        string attachmentType = media.MediaType switch
        {
            MessageType.Image => "image",
            MessageType.Video => "video",
            MessageType.Audio => "audio",
            MessageType.File => "file",
            _ => "file",
        };

        var body = new
        {
            recipient = new { id = recipientId },
            message = new
            {
                attachment = new
                {
                    type = attachmentType,
                    payload = new
                    {
                        url = media.Url,
                        is_reusable = true,
                    },
                },
            },
        };
        return SendMessageAsync(body, "SendMedia", integration, ct);
    }

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        var body = new
        {
            recipient = new { id = recipientId },
            message = new
            {
                attachment = new
                {
                    type = "template",
                    payload = content.Contents,
                },
            },
        };
        return SendMessageAsync(body, "SendRichContent", integration, ct);
    }

    public async Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        string appId = integration.Credentials?.AppId
            ?? throw new InvalidOperationException("Facebook App ID not configured");
        string appSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("Facebook App Secret not configured");
        string shortLivedToken = integration.Credentials?.AccessToken
            ?? throw new InvalidOperationException("Facebook access token not configured");

        HttpClient client = _httpClientFactory.CreateClient("facebook-api");
        string url = $"{GraphApiBase}/oauth/access_token"
            + $"?grant_type=fb_exchange_token"
            + $"&client_id={Uri.EscapeDataString(appId)}"
            + $"&client_secret={Uri.EscapeDataString(appSecret)}"
            + $"&fb_exchange_token={Uri.EscapeDataString(shortLivedToken)}";

        HttpResponseMessage response = await client.GetAsync(url, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Facebook RefreshToken failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = false,
                ErrorMessage = error,
            });
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? accessToken = doc.RootElement.TryGetProperty("access_token", out JsonElement at)
            ? at.GetString() : null;
        long expiresIn = doc.RootElement.TryGetProperty("expires_in", out JsonElement ei)
            ? ei.GetInt64() : 0;
        long expiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + (expiresIn * 1000);

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

        HttpResponseMessage response = await client.GetAsync(
            $"{GraphApiBase}/{externalUserId}?fields=first_name,last_name,profile_pic", ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Facebook GetUserProfile failed: {StatusCode}", response.StatusCode);
            return new Result<PlatformProfile>.Failure(
                new Error("PROFILE_FETCH_FAILED", "Failed to fetch Facebook user profile.", ErrorType.PlatformError));
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        string? firstName = doc.RootElement.TryGetProperty("first_name", out JsonElement fn)
            ? fn.GetString() : null;
        string? lastName = doc.RootElement.TryGetProperty("last_name", out JsonElement ln)
            ? ln.GetString() : null;
        string? profilePic = doc.RootElement.TryGetProperty("profile_pic", out JsonElement pp)
            ? pp.GetString() : null;

        string? displayName = (firstName, lastName) switch
        {
            (not null, not null) => $"{firstName} {lastName}",
            (not null, null) => firstName,
            (null, not null) => lastName,
            _ => null,
        };

        return new Result<PlatformProfile>.Success(new PlatformProfile
        {
            ExternalUserId = externalUserId,
            DisplayName = displayName,
            PictureUrl = profilePic,
        });
    }

    public PlatformCapabilities GetCapabilities() => new()
    {
        SupportsImages = true,
        SupportsVideo = true,
        SupportsAudio = true,
        SupportsStickers = true,
        SupportsDocuments = true,
        SupportsLocation = false,
        SupportsRichContent = true,
        SupportsReactions = true,
        SupportsComments = true,
        RequiresMessagingWindow = true,
        TokenLifetime = TimeSpan.FromDays(60),
    };

    private async Task<Result<PlatformSendResult>> SendMessageAsync(
        object body, string operation, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateAuthedClient(integration);
        HttpResponseMessage response = await client.PostAsJsonAsync($"{GraphApiBase}/me/messages", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Facebook {Operation} failed: {StatusCode} {Error}", operation, response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false, ErrorMessage = error, ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        string? messageId = null;
        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        if (doc.RootElement.TryGetProperty("message_id", out JsonElement msgId))
            messageId = msgId.GetString();

        return new Result<PlatformSendResult>.Success(new PlatformSendResult
        {
            Success = true, PlatformMessageId = messageId,
        });
    }

    private HttpClient CreateAuthedClient(IntegrationChannel integration)
    {
        HttpClient client = _httpClientFactory.CreateClient("facebook-api");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", integration.Credentials?.AccessToken);
        return client;
    }
}
