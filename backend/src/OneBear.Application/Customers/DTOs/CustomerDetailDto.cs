namespace OneBear.Application.Customers.DTOs;

using OneBear.Domain.ValueObjects;

public record CustomerDetailDto
{
    public string Id { get; init; } = default!;
    public string CustomerType { get; init; } = default!;
    public string Name { get; init; } = default!;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Avatar { get; init; }
    public List<CustomerAddress> Addresses { get; init; } = new();
    public List<CustomerChannelDto> Channels { get; init; } = new();
    public List<CustomerTagDto> Tags { get; init; } = new();
    public decimal Ltv { get; init; }
    public int OrderCount { get; init; }
    public decimal Aov { get; init; }
    public long? LastOrderTimestamp { get; init; }
    public long? LastActivityTimestamp { get; init; }
    public string? LastMessagePreview { get; init; }
    public string? PinnedNote { get; init; }
    public bool IsAtRisk { get; init; }
    public int? DaysSinceLastPurchase { get; init; }

    // Detail-only fields
    public string? NationalId { get; init; }
    public string? TaxId { get; init; }
    public string? PinnedNoteBy { get; init; }
    public long? PinnedNoteTimestamp { get; init; }
    public string? OrganizationId { get; init; }
    public List<string> ContactIds { get; init; } = new();
    public bool IsPromoted { get; init; }
    public long? PromotedTimestamp { get; init; }
    public long CreatedTimestamp { get; init; }
    public long? UpdatedTimestamp { get; init; }
}
