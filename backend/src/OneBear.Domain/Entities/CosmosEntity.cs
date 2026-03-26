namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public abstract class CosmosEntity
{
    [JsonPropertyName("_etag")]
    public string? ETag { get; set; }

    [JsonPropertyName("_ts")]
    public long? Timestamp { get; set; }
}
