namespace OneBear.Domain.ValueObjects;

public record PlatformSendResult
{
    public bool Success { get; init; }
    public string? PlatformMessageId { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
}
