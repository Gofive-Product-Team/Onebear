namespace OneBear.Application.Customers.DTOs;

public record LinkContactRequest
{
    public string ContactCustomerId { get; init; } = default!;
}
