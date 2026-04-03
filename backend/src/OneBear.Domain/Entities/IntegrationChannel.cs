namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;
using OneBear.Domain.ValueObjects;

public class IntegrationChannel : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("hasChatFeature")]
    public bool HasChatFeature { get; set; }

    [JsonPropertyName("credentials")]
    public PlatformCredentials? Credentials { get; set; }

    [JsonPropertyName("greetingMessages")]
    public List<GreetingMessage> GreetingMessages { get; set; } = new();

    [JsonPropertyName("autoReplies")]
    public List<AutoReply> AutoReplies { get; set; } = new();

    [JsonPropertyName("autoAssignment")]
    public AutoAssignmentSettings? AutoAssignment { get; set; }

    [JsonPropertyName("platformSettings")]
    public Dictionary<string, object>? PlatformSettings { get; set; }

    [JsonPropertyName("shortcuts")]
    public List<Shortcut> Shortcuts { get; set; } = new();

    [JsonPropertyName("shortcutCategories")]
    public List<ShortcutCategory> ShortcutCategories { get; set; } = new();

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
