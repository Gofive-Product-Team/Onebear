namespace OneBear.Infrastructure.PlatformAdapters;

using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.ValueObjects;

public class EmailAdapter : IPlatformAdapter
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EmailAdapter> _logger;

    public EmailAdapter(IHttpClientFactory httpClientFactory, ILogger<EmailAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Platform => SocialPlatform.Email;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
    {
        if (!headers.TryGetValue("X-Api-Key", out string? apiKey) || string.IsNullOrEmpty(apiKey))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("MISSING_API_KEY", "X-Api-Key header is missing.", ErrorType.Validation)));

        string expectedKey = integration.Credentials?.ChannelSecret
            ?? throw new InvalidOperationException("Email API key not configured in integration credentials");

        if (!string.Equals(apiKey, expectedKey, StringComparison.Ordinal))
            return Task.FromResult<Result<WebhookValidationResult>>(
                new Result<WebhookValidationResult>.Failure(
                    new Error("INVALID_API_KEY", "Invalid email webhook API key.", ErrorType.Forbidden)));

        return Task.FromResult<Result<WebhookValidationResult>>(
            new Result<WebhookValidationResult>.Success(WebhookValidationResult.Valid));
    }

    public Task<Result<NormalizedMessage>> ParseInboundMessageAsync(
        JsonDocument payload, IntegrationChannel integration, CancellationToken ct)
    {
        JsonElement root = payload.RootElement;

        if (!root.TryGetProperty("from", out JsonElement fromEl) || string.IsNullOrEmpty(fromEl.GetString()))
            return Task.FromResult<Result<NormalizedMessage>>(
                new Result<NormalizedMessage>.Failure(
                    new Error("MISSING_FROM", "Email payload missing 'from' field.", ErrorType.Validation)));

        string fromAddress = fromEl.GetString()!;
        string? subject = root.TryGetProperty("subject", out JsonElement subjectEl) ? subjectEl.GetString() : null;
        string? textBody = root.TryGetProperty("text", out JsonElement textEl) ? textEl.GetString() : null;
        string? htmlBody = root.TryGetProperty("html", out JsonElement htmlEl) ? htmlEl.GetString() : null;
        string? messageId = root.TryGetProperty("message_id", out JsonElement msgIdEl) ? msgIdEl.GetString() : null;
        long timestamp = root.TryGetProperty("timestamp", out JsonElement tsEl) ? tsEl.GetInt64() : DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Prefer plain text over HTML; fall back to HTML if text is empty
        string? body = !string.IsNullOrWhiteSpace(textBody) ? textBody : htmlBody;

        // Compose display content: prepend subject if present
        string? content = !string.IsNullOrEmpty(subject)
            ? $"Subject: {subject}\n\n{body}"
            : body;

        // Parse attachments — use the first attachment if any
        MessageAttachment? attachment = null;
        if (root.TryGetProperty("attachments", out JsonElement attachmentsEl) && attachmentsEl.ValueKind == JsonValueKind.Array && attachmentsEl.GetArrayLength() > 0)
        {
            JsonElement firstAtt = attachmentsEl[0];
            string? fileName = firstAtt.TryGetProperty("filename", out JsonElement fnEl) ? fnEl.GetString() : null;
            string? contentType = firstAtt.TryGetProperty("content_type", out JsonElement ctEl) ? ctEl.GetString() : null;
            string? url = firstAtt.TryGetProperty("url", out JsonElement urlEl) ? urlEl.GetString() : null;

            if (!string.IsNullOrEmpty(url))
            {
                attachment = new MessageAttachment
                {
                    FileUrl = url,
                    ContentType = contentType ?? "application/octet-stream",
                    FileName = fileName ?? "attachment",
                };
            }
        }

        string messageType = attachment != null ? MessageType.File : MessageType.EmailMessage;

        NormalizedMessage result = new()
        {
            ExternalUserId = fromAddress,
            Content = content,
            MessageType = messageType,
            Attachment = attachment,
            PlatformMessageId = messageId,
            Timestamp = timestamp,
            IsEcho = false,
            DisplayName = fromAddress,
        };

        return Task.FromResult<Result<NormalizedMessage>>(
            new Result<NormalizedMessage>.Success(result));
    }

    public async Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateClient(integration);

        string fromAddress = integration.Credentials?.ChannelId
            ?? throw new InvalidOperationException("Email 'from' address not configured (ChannelId)");

        var body = new
        {
            to = recipientId,
            from = fromAddress,
            subject = "Re: Your conversation",
            text = content,
            html = $"<p>{System.Net.WebUtility.HtmlEncode(content)}</p>",
        };

        HttpResponseMessage response = await client.PostAsJsonAsync("send", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Email SendText failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        // Try to extract message ID from the response
        string? platformMessageId = null;
        try
        {
            using JsonDocument doc = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            if (doc.RootElement.TryGetProperty("message_id", out JsonElement idEl))
                platformMessageId = idEl.GetString();
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

    public async Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
    {
        HttpClient client = CreateClient(integration);

        string fromAddress = integration.Credentials?.ChannelId
            ?? throw new InvalidOperationException("Email 'from' address not configured (ChannelId)");

        var body = new
        {
            to = recipientId,
            from = fromAddress,
            subject = "Re: Your conversation",
            text = $"Attachment: {media.FileName ?? media.Url}",
            html = $"<p>Attachment: <a href=\"{media.Url}\">{media.FileName ?? "Download"}</a></p>",
            attachments = new[]
            {
                new { url = media.Url, filename = media.FileName ?? "attachment", content_type = media.MediaType },
            },
        };

        HttpResponseMessage response = await client.PostAsJsonAsync("send", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            string error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Email SendMedia failed: {StatusCode} {Error}", response.StatusCode, error);
            return new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = false,
                ErrorMessage = error,
                ErrorCode = ((int)response.StatusCode).ToString(),
            });
        }

        return new Result<PlatformSendResult>.Success(new PlatformSendResult { Success = true });
    }

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
    {
        // Email does not support rich content (templates, carousels, etc.)
        return Task.FromResult<Result<PlatformSendResult>>(
            new Result<PlatformSendResult>.Failure(
                new Error("UNSUPPORTED", "Email does not support rich content.", ErrorType.Validation)));
    }

    public Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
    {
        // Email uses API key authentication; no token refresh needed
        return Task.FromResult<Result<TokenRefreshResult>>(
            new Result<TokenRefreshResult>.Success(new TokenRefreshResult { Success = true }));
    }

    public Task<Result<PlatformProfile>> GetUserProfileAsync(
        string externalUserId, IntegrationChannel integration, CancellationToken ct)
    {
        // For email, the user ID is the email address — return it as the display name
        return Task.FromResult<Result<PlatformProfile>>(
            new Result<PlatformProfile>.Success(new PlatformProfile
            {
                ExternalUserId = externalUserId,
                DisplayName = externalUserId,
                PictureUrl = null,
                StatusMessage = null,
            }));
    }

    public PlatformCapabilities GetCapabilities() => new()
    {
        SupportsImages = true,
        SupportsVideo = false,
        SupportsAudio = false,
        SupportsStickers = false,
        SupportsDocuments = true,
        SupportsLocation = false,
        SupportsRichContent = false,
        SupportsReactions = false,
        SupportsComments = false,
        RequiresMessagingWindow = false,
        TokenLifetime = null,
    };

    private HttpClient CreateClient(IntegrationChannel integration)
    {
        HttpClient client = _httpClientFactory.CreateClient("email-api");

        string apiKey = integration.Credentials?.ChannelSecret
            ?? throw new InvalidOperationException("Email API key not configured");

        client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        return client;
    }
}
