namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class KnowledgeSource
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("sourceType")]
    public string SourceType { get; set; } = default!;

    [JsonPropertyName("sourceUrl")]
    public string? SourceUrl { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;
}
