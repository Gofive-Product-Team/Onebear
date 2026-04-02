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

public class WhatsAppAdapter : IPlatformAdapter
{
    private const string GraphApiBase = "https://graph.facebook.com/v21.0";
    private const string FacebookTokenEndpoint = "https://graph.facebook.com/v21.0/oauth/access_token";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WhatsAppAdapter> _logger;

    public WhatsAppAdapter(IHttpClientFactory httpClientFactory, ILogger<WhatsAppAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.WhatsApp;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("X-Hub-Signature-256", out string? signature) || string.IsNullOrEmpty(signature))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_SIGNATURE", "X-Hub-Signature-256 header is missing.", ErrorType.Validation)));

        string appSecret = integration.Credentials?.AppSecret
            ?? throw new InvalidOperationException("WhatsApp app secret not configured");

        byte[] key = Encoding.UTF8.GetBytes(appSecret);
        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(body);
        string computed = "sha256=" + Convert.ToHexString(hash).ToLowerInvariant();

        byte[] expectedBytes = Encoding.UTF8.GetBytes(signature);
        byte[] computedBytes = Encoding.UTF8.GetBytes(computed);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_SIGNATURE", "Invalid WhatsApp webhook signature.", ErrorType.Forbidden)));

        return Task.FromResult<Result<WebhookValidationResult>>(
            new Result<WebhookValidationResult>.Success(WebhookValidationResult.Valid));
    }

    public Task<Result<NormalizedMessage>> ParseInboundMessageAsync(
        JsonDocument payload, IntegrationChannel integration, CancellationToken ct)
    {
        JsonElement root = payload.RootElement;

        // Validate top-level structure
        if (!root.TryGetProperty("entry", out JsonElement entryArray) || entryArray.GetArrayLength() == 0)
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_ENTRY", "No entry in WhatsApp webhook payload.", ErrorType.Validation)));

        JsonElement entry = entryArray[0];
        if (!entry.TryGetProperty("changes", out JsonElement changes) || changes.GetArrayLength() == 0)
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_CHANGES", "No changes in WhatsApp webhook entry.", ErrorType.Validation)));

        JsonElement value = changes[0].GetProperty("value");

        // Status updates (sent/delivered/read) -- treat as echo/skip
        if (value.TryGetProperty("statuses", out JsonElement statuses) && statuses.GetArrayLength() > 0)
        {
            JsonElement status = statuses[0];
            string statusValue = status.TryGetProperty("status", out JsonElement sv)
                ? sv.GetString() ?? "unknown"
                : "unknown";

            NormalizedMessage statusMessage = new()
            {
                ExternalUserId = status.TryGetProperty("recipient_id", out JsonElement rid)
                    ? rid.GetString() ?? ""
                    : "",
                Content = $"[Status: {statusValue}]",
                MessageType = MessageType.System,
                PlatformMessageId = status.TryGetProperty("id", out JsonElement sid)
                    ? sid.GetString()
                    : null,
                Timestamp = status.TryGetProperty("timestamp", out JsonElement sts)
                    ? ParseTimestamp(sts)
                    : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                IsEcho = true,
            };

            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Success(statusMessage));
        }

        // Actual messages
        if (!value.TryGetProperty("messages", out JsonElement messages) || messages.GetArrayLength() == 0)
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("NO_MESSAGES", "No messages or statuses in WhatsApp webhook payload.", ErrorType.Validation)));

        JsonElement msg = messages[0];

        // Extract contact info
        string? displayName = null;
        if (value.TryGetProperty("contacts", out JsonElement contacts) && contacts.GetArrayLength() > 0)
        {
            JsonElement contact = contacts[0];
            if (contact.TryGetProperty("profile", out JsonElement profile))
                displayName = profile.TryGetProperty("name", out JsonElement name) ? name.GetString() : null;
        }

        string externalUserId = msg.TryGetProperty("from", out JsonElement from) ? from.GetString() ?? "" : "";
        string? platformMessageId = msg.TryGetProperty("id", out JsonElement mid) ? mid.GetString() : null;
        long timestamp = msg.TryGetProperty("timestamp", out JsonElement ts)
            ? ParseTimestamp(ts)
            : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        string msgType = msg.TryGetProperty("type", out JsonElement typeEl)
            ? typeEl.GetString() ?? "text"
            : "text";

        string messageType;
        string? content = null;
        MessageAttachment? attachment = null;

        switch (msgType)
        {
            case "text":
                messageType = MessageType.Text;
                content = msg.TryGetProperty("text", out JsonElement textEl)
                    && textEl.TryGetProperty("body", out JsonElement bodyEl)
                        ? bodyEl.GetString()
                        : null;
                break;

            case "image":
                messageType = MessageType.Image;
                attachment = ParseMediaAttachment(msg, "image", "image/jpeg", ".jpg");
                break;

            case "video":
                messageType = MessageType.Video;
                attachment = ParseMediaAttachment(msg, "video", "video/mp4", ".mp4");
                break;

            case "audio":
                messageType = MessageType.Audio;
                attachment = ParseMediaAttachment(msg, "audio", "audio/ogg", ".ogg");
                break;

            case "document":
                messageType = MessageType.File;
                if (msg.TryGetProperty("document", out JsonElement docEl))
                {
                    string docId = docEl.TryGetProperty("id", out JsonElement did) ? did.GetString() ?? "" : "";
                    string? fileName = docEl.TryGetProperty("filename", out JsonElement fn) ? fn.GetString() : null;
                    string? mimeType = docEl.TryGetProperty("mime_type", out JsonElement mt) ? mt.GetString() : null;
                    attachment = new MessageAttachment
                    {
                        FileUrl = $"{GraphApiBase}/{docId}",
                        ContentType = mimeType ?? "application/octet-stream",
                        FileName = fileName ?? docId,
                    };
                    content = docEl.TryGetProperty("caption", out JsonElement cap) ? cap.GetString() : null;
                }
                break;

            case "sticker":
                messageType = MessageType.Sticker;
                attachment = ParseMediaAttachment(msg, "sticker", "image/webp", ".webp");
                break;

            case "location":
                messageType = MessageType.Location;
                if (msg.TryGetProperty("location", out JsonElement locEl))
                {
                    double lat = locEl.TryGetProperty("latitude", out JsonElement latEl) ? latEl.GetDouble() : 0;
                    double lng = locEl.TryGetProperty("longitude", out JsonElement lngEl) ? lngEl.GetDouble() : 0;
                    string? locName = locEl.TryGetProperty("name", out JsonElement locNameEl) ? locNameEl.GetString() : null;
                    string? address = locEl.TryGetProperty("address", out JsonElement addrEl) ? addrEl.GetString() : null;
                    content = !string.IsNullOrEmpty(locName)
                        ? $"{lat},{lng}|{locName}|{address ?? ""}"
                        : $"{lat},{lng}";
                }
                break;

            case "contacts":
                messageType = MessageType.Text;
                content = ParseContactsMessage(msg);
                break;

            case "reaction":
                if (msg.TryGetProperty("reaction", out JsonElement reactionEl))
                {
                    string? emoji = reactionEl.TryGetProperty("emoji", out JsonElement emojiEl) ? emojiEl.GetString() : null;
                    string? reactedMsgId = reactionEl.TryGetProperty("message_id", out JsonElement rmid) ? rmid.GetString() : null;

                    if (string.IsNullOrEmpty(emoji))
                    {
                        // Empty emoji = reaction removed
                        messageType = MessageType.ReactionRemoved;
                        content = reactedMsgId;
                    }
                    else
                    {
                        messageType = MessageType.ReactionAdded;
                        content = $"{emoji}|{reactedMsgId}";
                    }
                }
                else
                {
                    messageType = MessageType.System;
                    content = "[Reaction]";
                }
                break;

            case "button":
                messageType = MessageType.Text;
                content = msg.TryGetProperty("button", out JsonElement btnEl)
                    && btnEl.TryGetProperty("text", out JsonElement btnText)
                        ? btnText.GetString()
                        : "[Button response]";
                break;

            case "interactive":
                messageType = MessageType.Text;
                content = ParseInteractiveMessage(msg);
                break;

            default:
                messageType = MessageType.Text;
                content = $"[Unsupported message type: {msgType}]";
                _logger.LogWarning("Unsupported WhatsApp message type: {MessageType}", msgType);
                break;
        }

        // Check for captions on image/video
        if (content is null && msgType is "image" or "video")
        {
            if (msg.TryGetProperty(msgType, out JsonElement mediaEl)
                && mediaEl.TryGetProperty("caption", out JsonElement captionEl))
            {
                content = captionEl.GetString();
            }
        }

        NormalizedMessage result = new()
        {
            ExternalUserId = externalUserId,
            Content = content,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = platformMessageId,
            Timestamp = timestamp,
            IsEcho = false,
            DisplayName = displayName,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    public async Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        object body = new
        {
            messaging_product = "whatsapp",
            to = recipientId,
            type = "text",
            text = new { body = content },
        };

        return await SendMessageAsync(body, "SendText", integration, ct);
    }

    public async Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        object body = media.MediaType switch
        {
            MessageType.Image => new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "image",
                image = new { link = media.Url },
            },
            MessageType.Video => new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "video",
                video = new { link = media.Url },
            },
            MessageType.Audio => new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "audio",
                audio = new { link = media.Url },
            },
            MessageType.File => new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "document",
                document = (object)new { link = media.Url, filename = media.FileName ?? "document" },
            },
            MessageType.Sticker => new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "sticker",
                sticker = (object)new { link = media.Url },
            },
            _ => (object)new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "text",
                text = new { body = $"[Unsupported media: {media.MediaType}]" },
            },
        };

        return await SendMessageAsync(body, "SendMedia", integration, ct);
    }

    public async Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        // Rich content maps to WhatsApp template messages
        // Contents is expected to be a template definition object with name, language, and components
        object body;

        if (content.Contents is JsonElement jsonElement)
        {
            // If Contents is already a JsonElement, extract template fields
            string templateName = jsonElement.TryGetProperty("name", out JsonElement nameEl)
                ? nameEl.GetString() ?? "unknown"
                : "unknown";

            string languageCode = jsonElement.TryGetProperty("language", out JsonElement langEl)
                && langEl.TryGetProperty("code", out JsonElement codeEl)
                    ? codeEl.GetString() ?? "en"
                    : "en";

            body = new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "template",
                template = content.Contents,
            };
        }
        else
        {
            // Fallback: pass Contents directly as the template object
            body = new
            {
                messaging_product = "whatsapp",
                to = recipientId,
                type = "template",
                template = content.Contents,
            };
        }

        return await SendMessageAsync(body, "SendRichContent", integration, ct);
    }

    public async Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        // WhatsApp Cloud API uses permanent system user tokens in production.
        // If TokenExpiresAt is not set, the token is permanent -- no refresh needed.
        if (integration.Credentials?.TokenExpiresAt is null)
        {
            return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
            {
                Success = true,
                AccessToken = integration.Credentials?.AccessToken,
            });
        }

        // Temporary tokens need Facebook-style token exchange
        string? appId = integration.Credentials.AppId;
        string? appSecret = integration.Credentials.AppSecret;
        string? currentToken = integration.Credentials.AccessToken;

        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret) || string.IsNullOrEmpty(currentToken))
        {
            return new Result<TokenRefreshResult>.Failure(
                new Error("MISSING_CREDENTIALS",
                    "AppId, AppSecret, and AccessToken are required for token refresh.",
                    ErrorType.Validation));
        }

        HttpClient client = _httpClientFactory.CreateClient("whatsapp-api");

        string url = $"{FacebookTokenEndpoint}?grant_type=fb_exchange_token"
            + $"&client_id={Uri.EscapeDataString(appId)}"
            + $"&client_secret={Uri.EscapeDataString(appSecret)}"
            + $"&fb_exchange_token={Uri.EscapeDataString(currentToken)}";

        HttpResponseMessage response = await client.GetAsync(url, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("WhatsApp token refresh failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<TokenRefreshResult>.Failure(
                new Error("TOKEN_REFRESH_FAILED",
                    $"Failed to refresh WhatsApp token: {response.StatusCode}",
                    ErrorType.PlatformError));
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        JsonElement root = doc.RootElement;

        string? newToken = root.TryGetProperty("access_token", out JsonElement at) ? at.GetString() : null;
        long? expiresIn = root.TryGetProperty("expires_in", out JsonElement ei) ? ei.GetInt64() : null;

        if (string.IsNullOrEmpty(newToken))
        {
            return new Result<TokenRefreshResult>.Failure(
                new Error("TOKEN_REFRESH_FAILED", "No access_token in refresh response.", ErrorType.PlatformError));
        }

        long? expiresAt = expiresIn.HasValue
            ? DateTimeOffset.UtcNow.AddSeconds(expiresIn.Value).ToUnixTimeMilliseconds()
            : null;

        return new Result<TokenRefreshResult>.Success(new TokenRefreshResult
        {
            Success = true,
            AccessToken = newToken,
            ExpiresAt = expiresAt,
        });
    }

    public Task<Result<PlatformProfile>> GetUserProfileAsync(
        string externalUserId, IntegrationChannel integration, CancellationToken ct)
    {
        // WhatsApp Cloud API does not have a dedicated user profile endpoint.
        // Contact info (name) comes in the webhook payload via contacts[].profile.name.
        // We cannot fetch profile on demand, so return a Failure.
        return Task.FromResult<Result<PlatformProfile>>(
            new Result<PlatformProfile>.Failure(
                new Error("PROFILE_NOT_SUPPORTED",
                    "WhatsApp does not provide a user profile API. Profile info is available only in webhook payloads.",
                    ErrorType.NotFound)));
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
        SupportsReactions = true,
        SupportsComments = false,
        RequiresMessagingWindow = true,
        TokenLifetime = null,
    };

    private async Task<Result<PlatformSendResult>> SendMessageAsync(
        object body, string operation, IntegrationChannel integration, CancellationToken ct)
    {
        string phoneNumberId = integration.Credentials?.PhoneNumberId
            ?? throw new InvalidOperationException("WhatsApp phone number ID not configured");

        HttpClient client = CreateAuthedClient(integration);
        string url = $"{GraphApiBase}/{phoneNumberId}/messages";

        HttpResponseMessage response = await client.PostAsJsonAsync(url, body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("WhatsApp {Operation} failed: {StatusCode} {Error}",
                operation, response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        // Parse response to extract message ID
        string? platformMessageId = null;
        using JsonDocument doc = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        if (doc.RootElement.TryGetProperty("messages", out JsonElement msgs)
            && msgs.GetArrayLength() > 0
            && msgs[0].TryGetProperty("id", out JsonElement msgId))
        {
            platformMessageId = msgId.GetString();
        }

        return new Result<PlatformSendResult>.Success(new PlatformSendResult
        {
            Success = true,
            PlatformMessageId = platformMessageId,
        });
    }

    private HttpClient CreateAuthedClient(IntegrationChannel integration)
    {
        HttpClient client = _httpClientFactory.CreateClient("whatsapp-api");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", integration.Credentials?.AccessToken);
        return client;
    }

    private static MessageAttachment? ParseMediaAttachment(
        JsonElement msg, string mediaKey, string defaultContentType, string defaultExtension)
    {
        if (!msg.TryGetProperty(mediaKey, out JsonElement mediaEl))
            return null;

        string mediaId = mediaEl.TryGetProperty("id", out JsonElement idEl) ? idEl.GetString() ?? "" : "";
        string? mimeType = mediaEl.TryGetProperty("mime_type", out JsonElement mt) ? mt.GetString() : null;

        return new MessageAttachment
        {
            FileUrl = $"{GraphApiBase}/{mediaId}",
            ContentType = mimeType ?? defaultContentType,
            FileName = $"{mediaId}{defaultExtension}",
        };
    }

    private static string ParseContactsMessage(JsonElement msg)
    {
        if (!msg.TryGetProperty("contacts", out JsonElement contactsEl) || contactsEl.GetArrayLength() == 0)
            return "[Contact shared]";

        JsonElement firstContact = contactsEl[0];
        string? contactName = null;
        if (firstContact.TryGetProperty("name", out JsonElement nameEl))
        {
            contactName = nameEl.TryGetProperty("formatted_name", out JsonElement fn)
                ? fn.GetString()
                : nameEl.TryGetProperty("first_name", out JsonElement firstName)
                    ? firstName.GetString()
                    : null;
        }

        string? phone = null;
        if (firstContact.TryGetProperty("phones", out JsonElement phones) && phones.GetArrayLength() > 0)
        {
            phone = phones[0].TryGetProperty("phone", out JsonElement p) ? p.GetString() : null;
        }

        if (contactName is not null && phone is not null)
            return $"[Contact: {contactName} ({phone})]";
        if (contactName is not null)
            return $"[Contact: {contactName}]";
        return "[Contact shared]";
    }

    private static string ParseInteractiveMessage(JsonElement msg)
    {
        if (!msg.TryGetProperty("interactive", out JsonElement interactive))
            return "[Interactive response]";

        string? interactiveType = interactive.TryGetProperty("type", out JsonElement typeEl)
            ? typeEl.GetString()
            : null;

        switch (interactiveType)
        {
            case "button_reply":
                if (interactive.TryGetProperty("button_reply", out JsonElement btnReply))
                {
                    string? title = btnReply.TryGetProperty("title", out JsonElement t) ? t.GetString() : null;
                    return title ?? "[Button reply]";
                }
                break;

            case "list_reply":
                if (interactive.TryGetProperty("list_reply", out JsonElement listReply))
                {
                    string? title = listReply.TryGetProperty("title", out JsonElement t) ? t.GetString() : null;
                    string? description = listReply.TryGetProperty("description", out JsonElement d) ? d.GetString() : null;
                    return description is not null ? $"{title}: {description}" : title ?? "[List reply]";
                }
                break;
        }

        return "[Interactive response]";
    }

    private static long ParseTimestamp(JsonElement timestampEl)
    {
        // WhatsApp sends timestamps as Unix seconds (string), convert to milliseconds
        if (timestampEl.ValueKind == JsonValueKind.String)
        {
            string? tsStr = timestampEl.GetString();
            if (long.TryParse(tsStr, out long seconds))
                return seconds * 1000;
        }
        else if (timestampEl.ValueKind == JsonValueKind.Number)
        {
            long value = timestampEl.GetInt64();
            // If value is less than a reasonable millisecond timestamp (year ~2001), it's seconds
            if (value < 1_000_000_000_000)
                return value * 1000;
            return value;
        }

        return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }
}
