namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatMessageRepository : MongoRepositoryBase<ChatMessage>, IChatMessageRepository
{
    public ChatMessageRepository(MongoDbContext context, ILogger<ChatMessageRepository> logger)
        : base(context.Messages, logger) { }

    public Task<ChatMessage?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => ReadAsync(id, ct);

    public async Task<(List<ChatMessage> Items, string? ContinuationToken)> GetByRoomIdAsync(
        string roomId, int pageSize = 20, string? continuationToken = null, bool excludeDeleted = true, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatMessage> fb = Builders<ChatMessage>.Filter;
        FilterDefinition<ChatMessage> filter = fb.Eq(m => m.RoomId, roomId);

        if (excludeDeleted)
        {
            filter = fb.And(filter, fb.Eq(m => m.IsDeleted, false));
        }

        SortDefinition<ChatMessage> sort = Builders<ChatMessage>.Sort.Descending(m => m.Timestamp);

        int skip = 0;
        if (!string.IsNullOrEmpty(continuationToken) && int.TryParse(continuationToken, out int parsedOffset))
        {
            skip = parsedOffset;
        }

        List<ChatMessage> results = await _collection
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

    public Task<ChatMessage> CreateAsync(ChatMessage message, CancellationToken ct = default)
        => CreateItemAsync(message, ct);

    public Task<ChatMessage> UpdateAsync(ChatMessage message, CancellationToken ct = default)
        => ReplaceItemAsync(message, ct);

    public async Task<ChatMessage?> GetByMidAsync(string roomId, string mid, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatMessage> fb = Builders<ChatMessage>.Filter;
        FilterDefinition<ChatMessage> filter = fb.And(
            fb.Eq(m => m.RoomId, roomId),
            fb.Eq(m => m.Mid, mid)
        );

        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<List<ChatMessage>> GetPinnedMessagesAsync(string roomId, int limit = 20, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ChatMessage> fb = Builders<ChatMessage>.Filter;
        FilterDefinition<ChatMessage> filter = fb.And(
            fb.Eq(m => m.RoomId, roomId),
            fb.Eq(m => m.IsPinnedByUser, true)
        );

        SortDefinition<ChatMessage> sort = Builders<ChatMessage>.Sort.Descending(m => m.MessagePinnedTimestamp);

        return await _collection
            .Find(filter)
            .Sort(sort)
            .Limit(limit)
            .ToListAsync(ct);
    }
}
