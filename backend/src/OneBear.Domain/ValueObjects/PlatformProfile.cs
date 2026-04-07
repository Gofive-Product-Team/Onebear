namespace OneBear.Domain.ValueObjects;

public record PlatformProfile
{
    public string ExternalUserId { get; init; } = default!;
    public string? DisplayName { get; init; }
    public string? PictureUrl { get; init; }
    public string? StatusMessage { get; init; }
}
