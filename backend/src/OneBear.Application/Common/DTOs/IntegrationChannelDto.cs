namespace OneBear.Application.Common.DTOs;

using OneBear.Application.Integrations.DTOs;

public class IntegrationChannelDto
{
    public string Id { get; set; } = default!;
    public string Platform { get; set; } = default!;
    public string? Name { get; set; }
    public string Status { get; set; } = default!;
    public bool IsActive { get; set; }
    public bool HasChatFeature { get; set; }
    public string? WebhookUrl { get; set; }
    public PlatformCredentialSummaryDto? Credentials { get; set; }
    public long CreatedTimestamp { get; set; }
    public long? UpdatedTimestamp { get; set; }
}
