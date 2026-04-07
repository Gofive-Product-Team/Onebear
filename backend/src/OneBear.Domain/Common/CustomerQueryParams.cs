// src/OneBear.Domain/Common/CustomerQueryParams.cs
namespace OneBear.Domain.Common;

public record CustomerQueryParams
{
    public string? Segment { get; init; }
    public string? Search { get; init; }
    public string Sort { get; init; } = "recent";
    public int PageSize { get; init; } = 20;
    public string? ContinuationToken { get; init; }
}
