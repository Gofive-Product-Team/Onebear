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

    [JsonPropertyName("slaLevel1Minutes")]
    public int SlaLevel1Minutes { get; set; } = 15;

    [JsonPropertyName("slaLevel2Minutes")]
    public int SlaLevel2Minutes { get; set; } = 30;

    [JsonPropertyName("slaLevel3Minutes")]
    public int SlaLevel3Minutes { get; set; } = 60;

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
