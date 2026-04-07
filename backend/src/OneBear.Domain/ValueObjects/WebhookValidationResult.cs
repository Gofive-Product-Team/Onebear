namespace OneBear.Domain.ValueObjects;

public record WebhookValidationResult
{
    public bool IsValid { get; init; }
    public string? Challenge { get; init; }

    public static WebhookValidationResult Valid => new() { IsValid = true };
    public static WebhookValidationResult Invalid => new() { IsValid = false };
}
