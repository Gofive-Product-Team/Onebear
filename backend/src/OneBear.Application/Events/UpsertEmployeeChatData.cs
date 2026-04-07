namespace OneBear.Application.Events;

public record UpsertEmployeeChatData
{
    public string CompanyId { get; init; } = default!;
    public string UserId { get; init; } = default!;
    public string DisplayName { get; init; } = default!;
    public string? PictureUrl { get; init; }
}
