namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;

public class ChatRoomRepository : MongoRepositoryBase<ChatRoom>, IChatRoomRepository
{
    public ChatRoomRepository(MongoDbContext context, ILogger<ChatRoomRepository> logger)
        : base(context.Rooms, logger) { }

    public Task<ChatRoom?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, ct);

    public async Task<(List<ChatRoom> Items, string? ContinuationToken)> QueryByFilterAsync(
        string companyId, RoomFilter filter, int pageSize = 20, string? continuationToken = null, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatRoom> fb = Builders<ChatRoom>.Filter;
        List<FilterDefinition<ChatRoom>> filters = new()
        {
            fb.Eq(r => r.CompanyId, companyId)
        };

        if (filter.State is not null)
            filters.Add(fb.Eq(r => r.State, filter.State));
        if (filter.Platform is not null)
            filters.Add(fb.Eq(r => r.Platform, filter.Platform));
        if (filter.AssignToUserId is not null)
            filters.Add(fb.Eq(r => r.AssignToUserId, filter.AssignToUserId));
        if (filter.HasUnread == true)
            filters.Add(fb.Gt(r => r.Unread, 0));
        if (filter.SearchQuery is not null)
            filters.Add(fb.Regex("customer.name", new BsonRegularExpression(filter.SearchQuery, "i")));

        FilterDefinition<ChatRoom> combinedFilter = fb.And(filters);
        SortDefinition<ChatRoom> sort = Builders<ChatRoom>.Sort.Descending(r => r.LastMessageTimestamp);

        int skip = 0;
        if (!string.IsNullOrEmpty(continuationToken) && int.TryParse(continuationToken, out int parsedOffset))
        {
            skip = parsedOffset;
        }

        List<ChatRoom> results = await _collection
            .Find(combinedFilter)
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

    public Task<ChatRoom> CreateAsync(ChatRoom room, CancellationToken ct = default)
        => CreateItemAsync(room, ct);

    public Task<ChatRoom> UpdateAsync(ChatRoom room, CancellationToken ct = default)
        => ReplaceItemAsync(room, ct);

    public async Task<int> GetBadgeCountAsync(string companyId, string? assignToUserId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatRoom> fb = Builders<ChatRoom>.Filter;
        FilterDefinition<ChatRoom> filter = fb.And(
            fb.Eq(r => r.CompanyId, companyId),
            fb.Ne(r => r.State, ChatState.Closed),
            fb.Ne(r => r.State, ChatState.Resolved),
            fb.Gt(r => r.Unread, 0)
        );

        if (assignToUserId is not null)
        {
            filter = fb.And(filter, fb.Eq(r => r.AssignToUserId, assignToUserId));
        }

        long count = await _collection.CountDocumentsAsync(filter, cancellationToken: ct);
        return (int)count;
    }

    public async Task<int> GetPinnedCountAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatRoom> fb = Builders<ChatRoom>.Filter;
        FilterDefinition<ChatRoom> filter = fb.And(
            fb.Eq(r => r.CompanyId, companyId),
            fb.Eq(r => r.IsPinned, true)
        );
        long count = await _collection.CountDocumentsAsync(filter, cancellationToken: ct);
        return (int)count;
    }

    public async Task<ChatRoom?> GetByUserAndIntegrationAsync(
        string companyId, string userId, string integrationId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatRoom> fb = Builders<ChatRoom>.Filter;
        FilterDefinition<ChatRoom> filter = fb.And(
            fb.Eq(r => r.CompanyId, companyId),
            fb.Eq(r => r.UserId, userId),
            fb.Eq(r => r.IntegrationId, integrationId)
        );

        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<List<ChatRoom>> GetRoomsWithDueFollowupsAsync(long beforeTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatRoom> fb = Builders<ChatRoom>.Filter;
        FilterDefinition<ChatRoom> filter = fb.And(
            fb.Ne(r => r.FollowupTimestamp, null),
            fb.Lte(r => r.FollowupTimestamp, beforeTimestamp)
        );

        return await _collection.Find(filter).Limit(100).ToListAsync(ct);
    }

    public async Task<List<ChatRoom>> GetRoomsWithAttendeesAsync(CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatRoom> fb = Builders<ChatRoom>.Filter;
        FilterDefinition<ChatRoom> filter = fb.Where(r => r.AttendedUserIds != null && r.AttendedUserIds.Count > 0);

        return await _collection.Find(filter).Limit(100).ToListAsync(ct);
    }

    /// <summary>
    /// Returns InProgress rooms assigned to an agent with an active FRT clock (not yet stopped),
    /// suitable for SLA escalation checks.
    /// </summary>
    public async Task<List<ChatRoom>> GetRoomsForSlaCheckAsync(CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatRoom> fb = Builders<ChatRoom>.Filter;
        FilterDefinition<ChatRoom> filter = fb.And(
            fb.Eq(r => r.State, ChatState.InProgress),
            fb.Ne(r => r.AssignToUserId, null),
            fb.Ne(r => r.FrtStartTimestamp, null),
            fb.Eq(r => r.IsFrtStopped, false)
        );

        return await _collection.Find(filter).Limit(500).ToListAsync(ct);
    }
}
