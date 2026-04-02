namespace OneBear.Infrastructure.PlatformAdapters;

using System.Text.Json;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.ValueObjects;

public class WhatsAppAdapter : IPlatformAdapter
{
    public string Platform => SocialPlatform.WhatsApp;

    public Task<Result<WebhookValidationResult>> ValidateWebhookSignatureAsync(
        byte[] body, IDictionary<string, string> headers, IntegrationChannel integration, CancellationToken ct)
        => throw new NotImplementedException("WhatsApp adapter not yet implemented");

    public Task<Result<NormalizedMessage>> ParseInboundMessageAsync(
        JsonDocument payload, IntegrationChannel integration, CancellationToken ct)
        => throw new NotImplementedException("WhatsApp adapter not yet implemented");

    public Task<Result<PlatformSendResult>> SendTextAsync(
        string recipientId, string content, IntegrationChannel integration, CancellationToken ct)
        => throw new NotImplementedException("WhatsApp adapter not yet implemented");

    public Task<Result<PlatformSendResult>> SendMediaAsync(
        string recipientId, MediaPayload media, IntegrationChannel integration, CancellationToken ct)
        => throw new NotImplementedException("WhatsApp adapter not yet implemented");

    public Task<Result<PlatformSendResult>> SendRichContentAsync(
        string recipientId, RichContentPayload content, IntegrationChannel integration, CancellationToken ct)
        => throw new NotImplementedException("WhatsApp adapter not yet implemented");

    public Task<Result<TokenRefreshResult>> RefreshTokenAsync(
        IntegrationChannel integration, CancellationToken ct)
        => throw new NotImplementedException("WhatsApp adapter not yet implemented");

    public Task<Result<PlatformProfile>> GetUserProfileAsync(
        string externalUserId, IntegrationChannel integration, CancellationToken ct)
        => throw new NotImplementedException("WhatsApp adapter not yet implemented");

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
}
