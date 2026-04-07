namespace OneBear.Domain.ValueObjects;

public record MediaPayload
{
    public string MediaType { get; init; } = default!;
    public string Url { get; init; } = default!;
    public string? PreviewUrl { get; init; }
    public string? FileName { get; init; }
    public long? Duration { get; init; }
    public string? PackageId { get; init; }
    public string? StickerId { get; init; }
}
