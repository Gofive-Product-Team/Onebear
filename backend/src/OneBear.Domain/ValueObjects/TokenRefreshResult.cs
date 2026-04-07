namespace OneBear.Domain.ValueObjects;

public record TokenRefreshResult
{
    public bool Success { get; init; }
    public string? AccessToken { get; init; }
    public string? RefreshToken { get; init; }
    public long? ExpiresAt { get; init; }
    public string? ErrorMessage { get; init; }
}
