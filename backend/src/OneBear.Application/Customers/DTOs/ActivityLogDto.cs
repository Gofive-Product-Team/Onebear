namespace OneBear.Application.Customers.DTOs;

public record ActivityLogDto
{
    public string Id { get; init; } = default!;
    public string Type { get; init; } = default!;
    public string Description { get; init; } = default!;
    public string? ActorId { get; init; }
    public string? ActorName { get; init; }
    public string? ReferenceId { get; init; }
    public string? ReferenceType { get; init; }
    public long Timestamp { get; init; }
}
