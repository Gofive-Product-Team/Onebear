// src/OneBear.Domain/Common/CustomerSegmentCounts.cs
namespace OneBear.Domain.Common;

public record CustomerSegmentCounts
{
    public int All { get; init; }
    public int Hot { get; init; }
    public int Vip { get; init; }
    public int AtRisk { get; init; }
    public int New { get; init; }
    public int Cold { get; init; }
    public int Organization { get; init; }
}
