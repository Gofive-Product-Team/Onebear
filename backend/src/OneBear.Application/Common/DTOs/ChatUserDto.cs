namespace OneBear.Application.Common.DTOs;

public class ChatUserDto
{
    public string Id { get; set; } = default!;
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = default!;
    public bool IsOnline { get; set; }
}
