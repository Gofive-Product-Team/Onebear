namespace OneBear.Application.Customers.DTOs;

public record BulkFollowupRequest
{
    public List<string> CustomerIds { get; init; } = new();
    public string Channel { get; init; } = default!;
    public string Message { get; init; } = default!;
}
