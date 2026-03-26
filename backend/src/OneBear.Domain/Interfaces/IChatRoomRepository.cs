namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IChatRoomRepository
{
    Task<ChatRoom?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(IReadOnlyList<ChatRoom> Items, string? ContinuationToken)> ListAsync(string companyId, int pageSize, string? continuationToken, CancellationToken ct = default);
    Task<ChatRoom> CreateAsync(ChatRoom room, CancellationToken ct = default);
    Task<ChatRoom> UpdateAsync(ChatRoom room, CancellationToken ct = default);
}
