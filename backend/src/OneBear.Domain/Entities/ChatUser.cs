namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

public class ChatUser : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("externalId")]
    public string ExternalId { get; set; } = default!;

    [JsonPropertyName("originalName")]
    public string? OriginalName { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("pictureUrl")]
    public string? PictureUrl { get; set; }

    [JsonPropertyName("integrationId")]
    public string? IntegrationId { get; set; }

    [JsonPropertyName("platform")]
    public string? Platform { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = Enums.UserType.Customer;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("profileUpdateTimestamp")]
    public long? ProfileUpdateTimestamp { get; set; }

    [JsonPropertyName("platformMetadata")]
    public Dictionary<string, string>? PlatformMetadata { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
