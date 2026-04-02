namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatUserRepository : IChatUserRepository
{
    private readonly CosmosDbContext _context;

    public ChatUserRepository(CosmosDbContext context)
    {
        _context = context;
    }

    public Task<ChatUser?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatUser?> GetByExternalIdAsync(string companyId, string externalId, string platform, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<List<ChatUser>> GetByIdsAsync(string companyId, IEnumerable<string> ids, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatUser> UpsertAsync(ChatUser user, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<(List<ChatUser> Items, string? ContinuationToken)> QueryByTypeAsync(
        string companyId, string userType, int pageSize = 50, string? continuationToken = null, CancellationToken ct = default)
        => throw new NotImplementedException();
}
