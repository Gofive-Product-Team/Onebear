namespace OneBear.Application.Common.DTOs;

public record SessionTimingSummaryDto
{
    public long? LatestFrtMs { get; init; }
    public long? LatestRtMs { get; init; }
    public double? AverageFrtMs { get; init; }
    public double? AverageRtMs { get; init; }
    public int SessionCount { get; init; }
}
