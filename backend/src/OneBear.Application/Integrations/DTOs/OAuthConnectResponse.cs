namespace OneBear.Application.Integrations.DTOs;

using OneBear.Application.Common.DTOs;

public record OAuthConnectResponse(IntegrationChannelDto Integration, string WebhookUrl);
