namespace OneBear.Application.Customers.DTOs;

public record CustomerSegmentCountsDto
{
    public int All { get; init; }
    public int Hot { get; init; }
    public int Vip { get; init; }
    public int AtRisk { get; init; }
    public int New { get; init; }
    public int Cold { get; init; }
    public int Organization { get; init; }
}
