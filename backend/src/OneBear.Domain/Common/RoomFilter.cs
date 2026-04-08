// src/OneBear.Domain/Common/RoomFilter.cs
namespace OneBear.Domain.Common;

public record RoomFilter
{
    public string? State { get; init; }
    public string? Platform { get; init; }
    public string? AssignToUserId { get; init; }
    public bool? HasUnread { get; init; }
    public string? SearchQuery { get; init; }

    /// <summary>
    /// Sort order: "latest" (default), "unread", "oldest".
    /// </summary>
    public string? Sort { get; init; }
}
