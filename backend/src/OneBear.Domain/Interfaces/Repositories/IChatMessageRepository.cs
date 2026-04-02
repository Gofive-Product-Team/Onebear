namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IChatMessageRepository
{
    Task<ChatMessage?> GetByIdAsync(string id, string roomId, CancellationToken ct = default);
    Task<(List<ChatMessage> Items, string? ContinuationToken)> GetByRoomIdAsync(
        string roomId, int pageSize = 20, string? continuationToken = null, bool excludeDeleted = true, CancellationToken ct = default);
    Task<ChatMessage> CreateAsync(ChatMessage message, CancellationToken ct = default);
    Task<ChatMessage> UpdateAsync(ChatMessage message, CancellationToken ct = default);
    Task<ChatMessage?> GetByMidAsync(string roomId, string mid, CancellationToken ct = default);
}
