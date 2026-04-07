namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class Company : MongoEntity
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("logo")]
    public string? Logo { get; set; }

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("taxId")]
    public string? TaxId { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("website")]
    public string? Website { get; set; }

    [JsonPropertyName("planId")]
    public string PlanId { get; set; } = "free";

    [JsonPropertyName("ownerUserId")]
    public string OwnerUserId { get; set; } = "";

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
