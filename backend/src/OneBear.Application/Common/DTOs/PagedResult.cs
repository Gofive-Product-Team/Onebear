namespace OneBear.Application.Common.DTOs;

public class PagedResult<T>
{
    public IReadOnlyList<T> Data { get; set; } = Array.Empty<T>();
    public string? ContinuationToken { get; set; }
    public bool HasMore { get; set; }

    public static PagedResult<T> Empty() => new();

    public static PagedResult<T> From(IReadOnlyList<T> data, string? continuationToken)
    {
        return new PagedResult<T>
        {
            Data = data,
            ContinuationToken = continuationToken,
            HasMore = !string.IsNullOrEmpty(continuationToken)
        };
    }
}
