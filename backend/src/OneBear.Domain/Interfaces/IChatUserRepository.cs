namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IChatUserRepository
{
    Task<ChatUser?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(IReadOnlyList<ChatUser> Items, string? ContinuationToken)> ListAsync(string companyId, int pageSize, string? continuationToken, CancellationToken ct = default);
    Task<ChatUser> CreateAsync(ChatUser user, CancellationToken ct = default);
    Task<ChatUser> UpdateAsync(ChatUser user, CancellationToken ct = default);
}
