namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class PlatformCredentials
{
    [JsonPropertyName("channelId")]
    public string? ChannelId { get; set; }

    [JsonPropertyName("channelSecret")]
    public string? ChannelSecret { get; set; }

    [JsonPropertyName("accessToken")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("appId")]
    public string? AppId { get; set; }

    [JsonPropertyName("appSecret")]
    public string? AppSecret { get; set; }

    [JsonPropertyName("phoneNumberId")]
    public string? PhoneNumberId { get; set; }

    [JsonPropertyName("businessAccountId")]
    public string? BusinessAccountId { get; set; }

    [JsonPropertyName("tokenExpiresAt")]
    public long? TokenExpiresAt { get; set; }
}
