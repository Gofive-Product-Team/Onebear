namespace OneBear.Application.Integrations.Mappings;

using OneBear.Application.Common.DTOs;
using OneBear.Application.Integrations.DTOs;
using OneBear.Domain.Entities;
using OneBear.Domain.ValueObjects;

public static class IntegrationMapper
{
    public static IntegrationChannelDto ToDto(IntegrationChannel channel)
    {
        return new IntegrationChannelDto
        {
            Id = channel.Id,
            Platform = channel.Platform,
            Name = channel.Name,
            Status = channel.IsActive ? "active" : "inactive",
            IsActive = channel.IsActive,
            HasChatFeature = channel.HasChatFeature,
            WebhookUrl = channel.WebhookUrl,
            Credentials = channel.Credentials is not null
                ? ToCredentialSummary(channel.Credentials)
                : null,
            CreatedTimestamp = channel.CreatedTimestamp,
            UpdatedTimestamp = channel.UpdatedTimestamp,
        };
    }

    public static PlatformCredentialSummaryDto ToCredentialSummary(PlatformCredentials credentials)
    {
        string? maskedPhone = MaskPhoneNumber(credentials.PhoneNumberId);

        return new PlatformCredentialSummaryDto
        {
            ChannelId = credentials.ChannelId,
            PageName = credentials.PageName,
            PageId = credentials.PageId,
            PhoneNumber = maskedPhone,
            ShopId = credentials.ShopId,
            ShopName = credentials.ShopName,
            EmailAddress = credentials.EmailAddress,
            HasAccessToken = !string.IsNullOrEmpty(credentials.AccessToken),
            HasRefreshToken = !string.IsNullOrEmpty(credentials.RefreshToken),
            TokenExpiresAt = credentials.TokenExpiresAt,
            TokenStatus = ComputeTokenStatus(credentials.TokenExpiresAt),
        };
    }

    public static string ComputeTokenStatus(long? tokenExpiresAt)
    {
        if (tokenExpiresAt is null)
            return "valid";

        long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        long expiresAtMs = tokenExpiresAt.Value;

        if (nowMs >= expiresAtMs)
            return "expired";

        long fourHoursMs = (long)TimeSpan.FromHours(4).TotalMilliseconds;
        if (expiresAtMs - nowMs <= fourHoursMs)
            return "expiring_soon";

        return "valid";
    }

    private static string? MaskPhoneNumber(string? phoneNumber)
    {
        if (string.IsNullOrEmpty(phoneNumber))
            return null;

        if (phoneNumber.Length <= 4)
            return phoneNumber;

        string lastFour = phoneNumber[^4..];
        string masked = new string('*', phoneNumber.Length - 4);
        return masked + lastFour;
    }
}
