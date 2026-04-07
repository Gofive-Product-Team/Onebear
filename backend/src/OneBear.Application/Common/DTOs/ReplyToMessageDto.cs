namespace OneBear.Application.Common.DTOs;
public record ReplyToMessageDto
{
    public string? MessageId { get; init; }
    public string? Content { get; init; }
    public string? SenderName { get; init; }
}
