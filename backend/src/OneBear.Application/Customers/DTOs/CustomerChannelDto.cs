namespace OneBear.Application.Customers.DTOs;

public record CustomerChannelDto
{
    public string Platform { get; init; } = default!;
    public string? DisplayName { get; init; }
}
