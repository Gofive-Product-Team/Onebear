namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class UserProfile : MongoEntity
{
    [JsonPropertyName("keycloakUserId")]
    public string KeycloakUserId { get; set; } = "";

    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = "";

    [JsonPropertyName("permissions")]
    public List<int> Permissions { get; set; } = new();

    [JsonPropertyName("roleId")]
    public string RoleId { get; set; } = "";

    [JsonPropertyName("roleName")]
    public string RoleName { get; set; } = "";

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("lastLoginTimestamp")]
    public long? LastLoginTimestamp { get; set; }
}
