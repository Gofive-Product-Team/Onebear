namespace OneBear.Application.Customers.DTOs;

public record CustomerListDto
{
    public string Id { get; init; } = default!;
    public string CustomerType { get; init; } = default!;
    public string Name { get; init; } = default!;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Avatar { get; init; }
    public List<CustomerChannelDto> Channels { get; init; } = new();
    public List<CustomerTagDto> Tags { get; init; } = new(); // max 2, priority ordered
    public decimal Ltv { get; init; }
    public int OrderCount { get; init; }
    public decimal Aov { get; init; }
    public long? LastOrderTimestamp { get; init; }
    public long? LastActivityTimestamp { get; init; }
    public string? LastMessagePreview { get; init; }
    public string? PinnedNote { get; init; }
    public bool IsAtRisk { get; init; }
    public int? DaysSinceLastPurchase { get; init; }
    public string? SuggestedAction { get; init; }
    public string? SuggestedActionType { get; init; }
}
