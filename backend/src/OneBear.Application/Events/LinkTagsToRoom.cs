namespace OneBear.Application.Events;

public record LinkTagsToRoom
{
    public string RoomId { get; init; } = default!;
    public string CompanyId { get; init; } = default!;
    public List<string> TagIds { get; init; } = new();
    public string Source { get; init; } = default!;
}
