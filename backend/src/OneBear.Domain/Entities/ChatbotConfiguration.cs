namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.ValueObjects;

public class ChatbotConfiguration : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("integrationId")]
    public string? IntegrationId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("systemPrompt")]
    public string? SystemPrompt { get; set; }

    [JsonPropertyName("model")]
    public string? Model { get; set; }

    [JsonPropertyName("temperature")]
    public double Temperature { get; set; } = 0.7;

    [JsonPropertyName("maxTokens")]
    public int MaxTokens { get; set; } = 1024;

    [JsonPropertyName("knowledgeSources")]
    public List<KnowledgeSource> KnowledgeSources { get; set; } = new();

    [JsonPropertyName("shortcuts")]
    public List<Shortcut> Shortcuts { get; set; } = new();

    [JsonPropertyName("shortcutCategories")]
    public List<ShortcutCategory> ShortcutCategories { get; set; } = new();

    [JsonPropertyName("businessHours")]
    public List<DaySchedule> BusinessHours { get; set; } = new();

    [JsonPropertyName("offlineMessage")]
    public string? OfflineMessage { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
