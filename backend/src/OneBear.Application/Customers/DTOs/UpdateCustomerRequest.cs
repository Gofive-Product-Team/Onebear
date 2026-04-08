namespace OneBear.Application.Customers.DTOs;

using OneBear.Domain.ValueObjects;

public record UpdateCustomerRequest
{
    public string? Name { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Avatar { get; init; }
    public string? NationalId { get; init; }
    public string? TaxId { get; init; }
    public List<CustomerAddress>? Addresses { get; init; }
}
