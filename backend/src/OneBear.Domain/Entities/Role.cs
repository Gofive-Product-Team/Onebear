namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class Role : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("permissions")]
    public List<int> Permissions { get; set; } = new();

    [JsonPropertyName("isSystem")]
    public bool IsSystem { get; set; }

    [JsonPropertyName("isOwnerRole")]
    public bool IsOwnerRole { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
