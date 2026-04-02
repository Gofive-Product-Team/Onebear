namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatUserRepository : CosmosRepositoryBase<ChatUser>, IChatUserRepository
{
    public ChatUserRepository(CosmosDbContext context, ILogger<ChatUserRepository> logger)
        : base(context.Users, logger) { }

    protected override string GetEntityId(ChatUser entity) => entity.Id;

    public Task<ChatUser?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<ChatUser?> GetByExternalIdAsync(
        string companyId, string externalId, string platform, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.externalId = @externalId AND c.platform = @platform")
            .WithParameter("@companyId", companyId)
            .WithParameter("@externalId", externalId)
            .WithParameter("@platform", platform);

        (List<ChatUser> items, _) = await QueryAsync<ChatUser>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public async Task<List<ChatUser>> GetByIdsAsync(
        string companyId, IEnumerable<string> ids, CancellationToken ct = default)
    {
        string[] idArray = ids.Distinct().ToArray();
        if (idArray.Length == 0) return new();

        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId AND ARRAY_CONTAINS(@ids, c.id)")
            .WithParameter("@companyId", companyId)
            .WithParameter("@ids", idArray);

        (List<ChatUser> items, _) = await QueryAsync<ChatUser>(
            query, new PartitionKey(companyId), idArray.Length, null, ct);
        return items;
    }

    public Task<ChatUser> UpsertAsync(ChatUser user, CancellationToken ct = default)
        => UpsertItemAsync(user, new PartitionKey(user.CompanyId), ct);

    public async Task<(List<ChatUser> Items, string? ContinuationToken)> QueryByTypeAsync(
        string companyId, string userType, int pageSize = 50, string? continuationToken = null, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.type = @type AND c.isActive = true")
            .WithParameter("@companyId", companyId)
            .WithParameter("@type", userType);

        return await QueryAsync<ChatUser>(query, new PartitionKey(companyId), pageSize, continuationToken, ct);
    }
}
