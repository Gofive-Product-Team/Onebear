namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatRoomRepository : IChatRoomRepository
{
    private readonly CosmosDbContext _context;

    public ChatRoomRepository(CosmosDbContext context)
    {
        _context = context;
    }

    public Task<ChatRoom?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<(List<ChatRoom> Items, string? ContinuationToken)> QueryByFilterAsync(
        string companyId, RoomFilter filter, int pageSize = 20, string? continuationToken = null, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatRoom> CreateAsync(ChatRoom room, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatRoom> UpdateAsync(ChatRoom room, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<int> GetBadgeCountAsync(string companyId, string? assignToUserId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatRoom?> GetByUserAndIntegrationAsync(string companyId, string userId, string integrationId, CancellationToken ct = default)
        => throw new NotImplementedException();
}
