namespace OneBear.Domain.ValueObjects;

public record RichContentPayload
{
    public string Type { get; init; } = default!;
    public string AltText { get; init; } = default!;
    public object Contents { get; init; } = default!;
}
