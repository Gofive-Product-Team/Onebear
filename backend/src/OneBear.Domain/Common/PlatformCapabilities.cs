namespace OneBear.Domain.Common;

public record PlatformCapabilities
{
    public bool SupportsImages { get; init; }
    public bool SupportsVideo { get; init; }
    public bool SupportsAudio { get; init; }
    public bool SupportsStickers { get; init; }
    public bool SupportsDocuments { get; init; }
    public bool SupportsLocation { get; init; }
    public bool SupportsRichContent { get; init; }
    public bool SupportsReactions { get; init; }
    public bool SupportsComments { get; init; }
    public bool RequiresMessagingWindow { get; init; }
    public TimeSpan? TokenLifetime { get; init; }
}
