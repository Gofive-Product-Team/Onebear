namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatUserRepository : MongoRepositoryBase<ChatUser>, IChatUserRepository
{
    public ChatUserRepository(MongoDbContext context, ILogger<ChatUserRepository> logger)
        : base(context.Users, logger) { }

    public Task<ChatUser?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, ct);

    public async Task<ChatUser?> GetByExternalIdAsync(
        string companyId, string externalId, string platform, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatUser> fb = Builders<ChatUser>.Filter;
        FilterDefinition<ChatUser> filter = fb.And(
            fb.Eq(u => u.CompanyId, companyId),
            fb.Eq(u => u.ExternalId, externalId),
            fb.Eq(u => u.Platform, platform)
        );

        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<List<ChatUser>> GetByIdsAsync(
        string companyId, IEnumerable<string> ids, CancellationToken ct = default)
    {
        string[] idArray = ids.Distinct().ToArray();
        if (idArray.Length == 0) return new();

        FilterDefinitionBuilder<ChatUser> fb = Builders<ChatUser>.Filter;
        FilterDefinition<ChatUser> filter = fb.And(
            fb.Eq(u => u.CompanyId, companyId),
            fb.In(u => u.Id, idArray)
        );

        return await _collection.Find(filter).Limit(idArray.Length).ToListAsync(ct);
    }

    public Task<ChatUser> UpsertAsync(ChatUser user, CancellationToken ct = default)
        => UpsertItemAsync(user, ct);

    public async Task<(List<ChatUser> Items, string? ContinuationToken)> QueryByTypeAsync(
        string companyId, string userType, int pageSize = 50, string? continuationToken = null, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatUser> fb = Builders<ChatUser>.Filter;
        FilterDefinition<ChatUser> filter = fb.And(
            fb.Eq(u => u.CompanyId, companyId),
            fb.Eq(u => u.Type, userType),
            fb.Eq(u => u.IsActive, true)
        );

        SortDefinition<ChatUser> sort = Builders<ChatUser>.Sort.Ascending(u => u.Id);

        int skip = 0;
        if (!string.IsNullOrEmpty(continuationToken) && int.TryParse(continuationToken, out int parsedOffset))
        {
            skip = parsedOffset;
        }

        List<ChatUser> results = await _collection
            .Find(filter)
            .Sort(sort)
            .Skip(skip)
            .Limit(pageSize + 1)
            .ToListAsync(ct);

        bool hasMore = results.Count > pageSize;
        if (hasMore)
        {
            results.RemoveAt(results.Count - 1);
        }

        string? nextToken = hasMore ? (skip + pageSize).ToString() : null;
        return (results, nextToken);
    }
}
