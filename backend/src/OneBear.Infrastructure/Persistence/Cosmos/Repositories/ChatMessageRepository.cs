namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatMessageRepository : CosmosRepositoryBase<ChatMessage>, IChatMessageRepository
{
    public ChatMessageRepository(CosmosDbContext context, ILogger<ChatMessageRepository> logger)
        : base(context.Messages, logger) { }

    protected override string GetEntityId(ChatMessage entity) => entity.Id;

    public Task<ChatMessage?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(roomId), ct);

    public async Task<(List<ChatMessage> Items, string? ContinuationToken)> GetByRoomIdAsync(
        string roomId, int pageSize = 20, string? continuationToken = null, bool excludeDeleted = true, CancellationToken ct = default)
    {
        string sql = excludeDeleted
            ? "SELECT * FROM c WHERE c.roomId = @roomId AND c.isDeleted = false ORDER BY c.timestamp DESC"
            : "SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.timestamp DESC";

        QueryDefinition query = new QueryDefinition(sql)
            .WithParameter("@roomId", roomId);

        return await QueryAsync<ChatMessage>(query, new PartitionKey(roomId), pageSize, continuationToken, ct);
    }

    public Task<ChatMessage> CreateAsync(ChatMessage message, CancellationToken ct = default)
        => CreateItemAsync(message, new PartitionKey(message.RoomId), ct);

    public Task<ChatMessage> UpdateAsync(ChatMessage message, CancellationToken ct = default)
        => ReplaceItemAsync(message, new PartitionKey(message.RoomId), ct);

    public async Task<ChatMessage?> GetByMidAsync(string roomId, string mid, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.roomId = @roomId AND c.mid = @mid")
            .WithParameter("@roomId", roomId)
            .WithParameter("@mid", mid);

        (List<ChatMessage> items, _) = await QueryAsync<ChatMessage>(
            query, new PartitionKey(roomId), 1, null, ct);
        return items.FirstOrDefault();
    }
}
