namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.ValueObjects;

public class IntegrationChannel : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("credentials")]
    public PlatformCredentials? Credentials { get; set; }

    [JsonPropertyName("autoReply")]
    public AutoReply? AutoReply { get; set; }

    [JsonPropertyName("greetingMessage")]
    public GreetingMessage? GreetingMessage { get; set; }

    [JsonPropertyName("autoAssignment")]
    public AutoAssignmentSettings? AutoAssignment { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("externalPageId")]
    public string? ExternalPageId { get; set; }

    [JsonPropertyName("externalPageName")]
    public string? ExternalPageName { get; set; }

    [JsonPropertyName("externalPagePictureUrl")]
    public string? ExternalPagePictureUrl { get; set; }

    [JsonPropertyName("webhookUrl")]
    public string? WebhookUrl { get; set; }

    [JsonPropertyName("webhookSecret")]
    public string? WebhookSecret { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
