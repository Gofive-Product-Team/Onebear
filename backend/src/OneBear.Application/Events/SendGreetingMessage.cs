namespace OneBear.Application.Events;

public record SendGreetingMessage
{
    public string RoomId { get; init; } = default!;
    public string CompanyId { get; init; } = default!;
    public string IntegrationId { get; init; } = default!;
    public string Platform { get; init; } = default!;
    public string RecipientExternalId { get; init; } = default!;
}
