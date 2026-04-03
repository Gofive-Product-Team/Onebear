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

    [JsonPropertyName("pageName")]
    public string? PageName { get; set; }

    [JsonPropertyName("pageId")]
    public string? PageId { get; set; }

    [JsonPropertyName("shopId")]
    public string? ShopId { get; set; }

    [JsonPropertyName("shopName")]
    public string? ShopName { get; set; }

    [JsonPropertyName("shopCipher")]
    public string? ShopCipher { get; set; }

    [JsonPropertyName("refreshTokenExpiresAt")]
    public long? RefreshTokenExpiresAt { get; set; }

    [JsonPropertyName("emailAddress")]
    public string? EmailAddress { get; set; }

    [JsonPropertyName("smtpHost")]
    public string? SmtpHost { get; set; }

    [JsonPropertyName("smtpPort")]
    public int? SmtpPort { get; set; }

    [JsonPropertyName("imapHost")]
    public string? ImapHost { get; set; }

    [JsonPropertyName("imapPort")]
    public int? ImapPort { get; set; }

    [JsonPropertyName("emailPassword")]
    public string? EmailPassword { get; set; }
}
