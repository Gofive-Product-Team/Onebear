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

    [JsonPropertyName("isChatbotEnabled")]
    public bool IsChatbotEnabled { get; set; }

    [JsonPropertyName("isAutoAssignEnabled")]
    public bool IsAutoAssignEnabled { get; set; }

    [JsonPropertyName("isFollowupEnabled")]
    public bool IsFollowupEnabled { get; set; }

    [JsonPropertyName("isSatisfactionSurveyEnabled")]
    public bool IsSatisfactionSurveyEnabled { get; set; }

    [JsonPropertyName("maxAgents")]
    public int MaxAgents { get; set; }

    [JsonPropertyName("maxIntegrations")]
    public int MaxIntegrations { get; set; }

    [JsonPropertyName("enabledPlatforms")]
    public List<string> EnabledPlatforms { get; set; } = new();

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
