namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class ShortcutCategory
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("sortOrder")]
    public int SortOrder { get; set; }
}
