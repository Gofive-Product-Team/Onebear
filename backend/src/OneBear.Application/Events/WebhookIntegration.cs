namespace OneBear.Application.Events;

public record WebhookIntegration
{
    public string RoomId { get; init; } = default!;
    public string CompanyId { get; init; } = default!;
    public string MessageId { get; init; } = default!;
    public string Platform { get; init; } = default!;
    public string EventType { get; init; } = default!;
    public object Payload { get; init; } = default!;
}
