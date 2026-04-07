namespace OneBear.Application.Customers.DTOs;

public record CustomerTagDto
{
    public string Name { get; init; } = default!;
    public bool IsAiAssigned { get; init; }
    public string? Reason { get; init; }
}
