namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;
using OneBear.Domain.ValueObjects;

public class Customer : MongoEntity, IAuditableEntity
{
    // Identity
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("customerType")]
    public string CustomerType { get; set; } = "Individual"; // "Individual" | "Organization"

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Active"; // "Active" | "Inactive"

    // Profile
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }

    // Addresses (multiple)
    [JsonPropertyName("addresses")]
    public List<CustomerAddress> Addresses { get; set; } = new();

    [JsonPropertyName("nationalId")]
    public string? NationalId { get; set; }

    [JsonPropertyName("taxId")]
    public string? TaxId { get; set; }

    // Channel Links
    [JsonPropertyName("channels")]
    public List<CustomerChannel> Channels { get; set; } = new();

    // CRM Fields
    [JsonPropertyName("ltv")]
    public decimal Ltv { get; set; }

    [JsonPropertyName("orderCount")]
    public int OrderCount { get; set; }

    [JsonPropertyName("aov")]
    public decimal Aov { get; set; }

    [JsonPropertyName("firstOrderTimestamp")]
    public long? FirstOrderTimestamp { get; set; }

    [JsonPropertyName("lastOrderTimestamp")]
    public long? LastOrderTimestamp { get; set; }

    [JsonPropertyName("lastActivityTimestamp")]
    public long? LastActivityTimestamp { get; set; }

    // Tags & Segments
    [JsonPropertyName("tags")]
    public List<CustomerTag> Tags { get; set; } = new();

    // Notes
    [JsonPropertyName("pinnedNote")]
    public string? PinnedNote { get; set; }

    [JsonPropertyName("pinnedNoteBy")]
    public string? PinnedNoteBy { get; set; }

    [JsonPropertyName("pinnedNoteTimestamp")]
    public long? PinnedNoteTimestamp { get; set; }

    // Organization (B2B) — Phase 3
    [JsonPropertyName("organizationId")]
    public string? OrganizationId { get; set; }

    [JsonPropertyName("contactIds")]
    public List<string> ContactIds { get; set; } = new();

    // Snooze (Phase 4)
    [JsonPropertyName("snoozeUntil")]
    public long? SnoozeUntil { get; set; }

    // Promotion tracking
    [JsonPropertyName("isPromoted")]
    public bool IsPromoted { get; set; } = true;

    [JsonPropertyName("promotedTimestamp")]
    public long? PromotedTimestamp { get; set; }

    // Audit
    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
