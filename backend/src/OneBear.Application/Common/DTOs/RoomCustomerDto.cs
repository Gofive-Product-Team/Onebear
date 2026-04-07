namespace OneBear.Application.Common.DTOs;
public record RoomCustomerDto
{
    public string? Name { get; init; }
    public string? Avatar { get; init; }
    public string? Platform { get; init; }
}
