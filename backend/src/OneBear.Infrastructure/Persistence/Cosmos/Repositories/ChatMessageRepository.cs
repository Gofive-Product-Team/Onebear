namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatMessageRepository : IChatMessageRepository
{
    private readonly CosmosDbContext _context;

    public ChatMessageRepository(CosmosDbContext context)
    {
        _context = context;
    }

    public Task<ChatMessage?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<(List<ChatMessage> Items, string? ContinuationToken)> GetByRoomIdAsync(
        string roomId, int pageSize = 20, string? continuationToken = null, bool excludeDeleted = true, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatMessage> CreateAsync(ChatMessage message, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatMessage> UpdateAsync(ChatMessage message, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatMessage?> GetByMidAsync(string roomId, string mid, CancellationToken ct = default)
        => throw new NotImplementedException();
}
