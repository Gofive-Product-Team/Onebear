namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IChatUserRepository
{
    Task<ChatUser?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<ChatUser?> GetByExternalIdAsync(string companyId, string externalId, string platform, CancellationToken ct = default);
    Task<List<ChatUser>> GetByIdsAsync(string companyId, IEnumerable<string> ids, CancellationToken ct = default);
    Task<ChatUser> UpsertAsync(ChatUser user, CancellationToken ct = default);
    Task<(List<ChatUser> Items, string? ContinuationToken)> QueryByTypeAsync(
        string companyId, string userType, int pageSize = 50, string? continuationToken = null, CancellationToken ct = default);
}
