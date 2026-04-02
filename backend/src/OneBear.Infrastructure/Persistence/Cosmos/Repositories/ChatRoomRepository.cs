namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;

public class ChatRoomRepository : CosmosRepositoryBase<ChatRoom>, IChatRoomRepository
{
    public ChatRoomRepository(CosmosDbContext context, ILogger<ChatRoomRepository> logger)
        : base(context.Rooms, logger) { }

    protected override string GetEntityId(ChatRoom entity) => entity.Id;

    public Task<ChatRoom?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<(List<ChatRoom> Items, string? ContinuationToken)> QueryByFilterAsync(
        string companyId, RoomFilter filter, int pageSize = 20, string? continuationToken = null, CancellationToken ct = default)
    {
        List<string> conditions = new() { "c.companyId = @companyId" };
        QueryDefinition query;

        if (filter.State is not null)
            conditions.Add("c.state = @state");
        if (filter.Platform is not null)
            conditions.Add("c.platform = @platform");
        if (filter.AssignToUserId is not null)
            conditions.Add("c.assignToUserId = @assignToUserId");
        if (filter.HasUnread == true)
            conditions.Add("c.unread > 0");
        if (filter.SearchQuery is not null)
            conditions.Add("CONTAINS(LOWER(c.customer.name), LOWER(@searchQuery))");

        string sql = $"SELECT * FROM c WHERE {string.Join(" AND ", conditions)} ORDER BY c.lastMessageTimestamp DESC";
        query = new QueryDefinition(sql).WithParameter("@companyId", companyId);

        if (filter.State is not null)
            query = query.WithParameter("@state", filter.State);
        if (filter.Platform is not null)
            query = query.WithParameter("@platform", filter.Platform);
        if (filter.AssignToUserId is not null)
            query = query.WithParameter("@assignToUserId", filter.AssignToUserId);
        if (filter.SearchQuery is not null)
            query = query.WithParameter("@searchQuery", filter.SearchQuery);

        return await QueryAsync<ChatRoom>(query, new PartitionKey(companyId), pageSize, continuationToken, ct);
    }

    public Task<ChatRoom> CreateAsync(ChatRoom room, CancellationToken ct = default)
        => CreateItemAsync(room, new PartitionKey(room.CompanyId), ct);

    public Task<ChatRoom> UpdateAsync(ChatRoom room, CancellationToken ct = default)
        => ReplaceItemAsync(room, new PartitionKey(room.CompanyId), ct);

    public async Task<int> GetBadgeCountAsync(string companyId, string? assignToUserId, CancellationToken ct = default)
    {
        string sql = "SELECT VALUE COUNT(1) FROM c WHERE c.companyId = @companyId AND c.state != @closed AND c.state != @resolved AND c.unread > 0";
        QueryDefinition query = new QueryDefinition(sql)
            .WithParameter("@companyId", companyId)
            .WithParameter("@closed", ChatState.Closed)
            .WithParameter("@resolved", ChatState.Resolved);

        if (assignToUserId is not null)
        {
            sql += " AND c.assignToUserId = @assignToUserId";
            query = new QueryDefinition(sql)
                .WithParameter("@companyId", companyId)
                .WithParameter("@closed", ChatState.Closed)
                .WithParameter("@resolved", ChatState.Resolved)
                .WithParameter("@assignToUserId", assignToUserId);
        }

        using FeedIterator<int> iterator = _container.GetItemQueryIterator<int>(
            query, requestOptions: new() { PartitionKey = new PartitionKey(companyId) });

        if (iterator.HasMoreResults)
        {
            FeedResponse<int> response = await iterator.ReadNextAsync(ct);
            return response.FirstOrDefault();
        }

        return 0;
    }

    public async Task<ChatRoom?> GetByUserAndIntegrationAsync(
        string companyId, string userId, string integrationId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.userId = @userId AND c.integrationId = @integrationId")
            .WithParameter("@companyId", companyId)
            .WithParameter("@userId", userId)
            .WithParameter("@integrationId", integrationId);

        (List<ChatRoom> items, _) = await QueryAsync<ChatRoom>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }
}
