namespace OneBear.Application.Common.DTOs;
public record MessageProductDto
{
    public string? Name { get; init; }
    public string? ImageUrl { get; init; }
    public decimal? Price { get; init; }
    public string? Url { get; init; }
}
