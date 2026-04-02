namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class UserVerification : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("verificationType")]
    public string VerificationType { get; set; } = default!;

    [JsonPropertyName("verificationValue")]
    public string VerificationValue { get; set; } = default!;

    [JsonPropertyName("isVerified")]
    public bool IsVerified { get; set; }

    [JsonPropertyName("verifiedTimestamp")]
    public long? VerifiedTimestamp { get; set; }

    [JsonPropertyName("expiresTimestamp")]
    public long? ExpiresTimestamp { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }
}
