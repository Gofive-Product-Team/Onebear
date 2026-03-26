namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IChatMessageRepository
{
    Task<ChatMessage?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(IReadOnlyList<ChatMessage> Items, string? ContinuationToken)> ListByRoomAsync(string roomId, string companyId, int pageSize, string? continuationToken, CancellationToken ct = default);
    Task<ChatMessage> CreateAsync(ChatMessage message, CancellationToken ct = default);
    Task<ChatMessage> UpdateAsync(ChatMessage message, CancellationToken ct = default);
}
