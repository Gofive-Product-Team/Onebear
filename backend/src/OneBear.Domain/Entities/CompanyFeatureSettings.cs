namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class CompanyFeatureSettings : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("features")]
    public Dictionary<string, bool> Features { get; set; } = new();

    [JsonPropertyName("settings")]
    public Dictionary<string, string> Settings { get; set; } = new();

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
