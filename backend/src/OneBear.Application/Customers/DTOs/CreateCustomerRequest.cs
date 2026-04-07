namespace OneBear.Application.Customers.DTOs;

public record CreateCustomerRequest
{
    public string Name { get; init; } = default!; // required
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? CustomerType { get; init; } // defaults to "Individual"
    public string? Avatar { get; init; }
}
