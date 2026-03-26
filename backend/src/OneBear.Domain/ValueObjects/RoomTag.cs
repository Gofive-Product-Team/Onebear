namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class RoomTag
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("color")]
    public string? Color { get; set; }
}
