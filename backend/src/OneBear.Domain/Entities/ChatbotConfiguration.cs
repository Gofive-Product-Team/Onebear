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

    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("scheduleMode")]
    public string ScheduleMode { get; set; } = "always";

    [JsonPropertyName("daySchedules")]
    public List<DaySchedule> DaySchedules { get; set; } = new();

    [JsonPropertyName("businessOverview")]
    public string? BusinessOverview { get; set; }

    [JsonPropertyName("responseStyle")]
    public string? ResponseStyle { get; set; }

    [JsonPropertyName("instructions")]
    public string? Instructions { get; set; }

    [JsonPropertyName("knowledgeSources")]
    public List<KnowledgeSource> KnowledgeSources { get; set; } = new();

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
