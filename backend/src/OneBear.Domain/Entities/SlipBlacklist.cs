namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class SlipBlacklist : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = "";

    [JsonPropertyName("fingerprint")]
    public string Fingerprint { get; set; } = "";

    [JsonPropertyName("orderId")]
    public string? OrderId { get; set; }

    [JsonPropertyName("result")]
    public string Result { get; set; } = "";

    [JsonPropertyName("approvedBy")]
    public string ApprovedBy { get; set; } = "";

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}
