namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class CompanyFeatureSettings : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("features")]
    public Dictionary<string, bool> Features { get; set; } = new();

    [JsonPropertyName("settings")]
    public Dictionary<string, string> Settings { get; set; } = new();

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
