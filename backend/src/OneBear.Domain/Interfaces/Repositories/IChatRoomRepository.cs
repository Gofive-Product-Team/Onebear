namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface IChatRoomRepository
{
    Task<ChatRoom?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(List<ChatRoom> Items, string? ContinuationToken)> QueryByFilterAsync(
        string companyId, RoomFilter filter, int pageSize = 20, string? continuationToken = null, CancellationToken ct = default);
    Task<ChatRoom> CreateAsync(ChatRoom room, CancellationToken ct = default);
    Task<ChatRoom> UpdateAsync(ChatRoom room, CancellationToken ct = default);
    Task<int> GetBadgeCountAsync(string companyId, string? assignToUserId, CancellationToken ct = default);
    Task<ChatRoom?> GetByUserAndIntegrationAsync(string companyId, string userId, string integrationId, CancellationToken ct = default);
    Task<List<ChatRoom>> GetRoomsWithDueFollowupsAsync(long beforeTimestamp, CancellationToken ct = default);
    Task<List<ChatRoom>> GetRoomsWithAttendeesAsync(CancellationToken ct = default);
}
