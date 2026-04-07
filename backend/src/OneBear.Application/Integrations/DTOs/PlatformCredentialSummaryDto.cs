namespace OneBear.Application.Integrations.DTOs;

public record PlatformCredentialSummaryDto
{
    public string? ChannelId { get; init; }
    public string? PlatformAccountName { get; init; }
    public string? PlatformAccountId { get; init; }
    public string? PhoneNumber { get; init; }
    public string? ShopId { get; init; }
    public string? ShopName { get; init; }
    public string? EmailAddress { get; init; }
    public bool HasAccessToken { get; init; }
    public bool HasRefreshToken { get; init; }
    public long? TokenExpiresAt { get; init; }
    public string? TokenStatus { get; init; }
}
