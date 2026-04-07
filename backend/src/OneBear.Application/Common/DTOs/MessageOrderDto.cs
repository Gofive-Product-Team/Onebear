namespace OneBear.Application.Common.DTOs;
public record MessageOrderDto
{
    public string? OrderId { get; init; }
    public decimal? Total { get; init; }
    public string? Status { get; init; }
    public string? Currency { get; init; }
}
