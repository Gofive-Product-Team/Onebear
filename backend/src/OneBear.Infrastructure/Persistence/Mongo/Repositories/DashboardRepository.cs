namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly MongoDbContext _dbContext;

    public DashboardRepository(MongoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> CountRoomsByCompanyAsync(string companyId, CancellationToken ct)
    {
        FilterDefinition<ChatRoom> filter = Builders<ChatRoom>.Filter.Eq(r => r.CompanyId, companyId);
        return await _dbContext.Rooms.CountDocumentsAsync(filter, cancellationToken: ct);
    }

    public async Task<long> CountActiveRoomsByCompanyAsync(string companyId, CancellationToken ct)
    {
        FilterDefinition<ChatRoom> filter =
            Builders<ChatRoom>.Filter.Eq(r => r.CompanyId, companyId) &
            Builders<ChatRoom>.Filter.In(r => r.State, new[] { ChatState.New, ChatState.InProgress });
        return await _dbContext.Rooms.CountDocumentsAsync(filter, cancellationToken: ct);
    }

    public async Task<long> CountResolvedRoomsSinceAsync(string companyId, long sinceTimestamp, CancellationToken ct)
    {
        FilterDefinition<ChatRoom> filter =
            Builders<ChatRoom>.Filter.Eq(r => r.CompanyId, companyId) &
            Builders<ChatRoom>.Filter.Eq(r => r.State, ChatState.Resolved) &
            Builders<ChatRoom>.Filter.Gte(r => r.RtEndTimestamp, sinceTimestamp);
        return await _dbContext.Rooms.CountDocumentsAsync(filter, cancellationToken: ct);
    }

    public async Task<List<RoomFrtProjection>> GetFrtRoomsAsync(
        string companyId, long fromMs, long toMs, CancellationToken ct)
    {
        FilterDefinition<ChatRoom> filter =
            Builders<ChatRoom>.Filter.Eq(r => r.CompanyId, companyId) &
            Builders<ChatRoom>.Filter.Eq(r => r.IsFrtStopped, true) &
            Builders<ChatRoom>.Filter.Ne(r => r.FrtDurationMs, null) &
            Builders<ChatRoom>.Filter.Gte(r => r.FrtEndTimestamp, fromMs) &
            Builders<ChatRoom>.Filter.Lte(r => r.FrtEndTimestamp, toMs);

        return await _dbContext.Rooms.Find(filter)
            .Project(r => new RoomFrtProjection
            {
                FrtEndTimestamp = r.FrtEndTimestamp,
                FrtDurationMs = r.FrtDurationMs
            })
            .ToListAsync(ct);
    }

    public async Task<List<PlatformCountProjection>> GetPlatformDistributionAsync(
        string companyId, CancellationToken ct)
    {
        FilterDefinition<ChatRoom> filter = Builders<ChatRoom>.Filter.Eq(r => r.CompanyId, companyId);

        List<PlatformCountProjection> result = await _dbContext.Rooms.Aggregate()
            .Match(filter)
            .Group(r => r.Platform, g => new PlatformCountProjection
            {
                Platform = g.Key,
                Count = g.Count()
            })
            .ToListAsync(ct);

        return result;
    }

    public async Task<List<MessageProjection>> GetMessagesInRangeAsync(
        string companyId, long fromMs, long toMs, CancellationToken ct)
    {
        FilterDefinition<ChatMessage> filter =
            Builders<ChatMessage>.Filter.Eq(m => m.CompanyId, companyId) &
            Builders<ChatMessage>.Filter.Gte(m => m.Timestamp, fromMs) &
            Builders<ChatMessage>.Filter.Lte(m => m.Timestamp, toMs);

        return await _dbContext.Messages.Find(filter)
            .Project(m => new MessageProjection
            {
                Timestamp = m.Timestamp,
                UserId = m.UserId,
                IsAiMessage = m.IsAiMessage
            })
            .ToListAsync(ct);
    }

    public async Task<List<AssignedRoomProjection>> GetAssignedRoomsAsync(
        string companyId, long fromMs, CancellationToken ct)
    {
        FilterDefinition<ChatRoom> filter =
            Builders<ChatRoom>.Filter.Eq(r => r.CompanyId, companyId) &
            Builders<ChatRoom>.Filter.Ne(r => r.AssignToUserId, null) &
            Builders<ChatRoom>.Filter.Gte(r => r.CreatedTimestamp, fromMs);

        return await _dbContext.Rooms.Find(filter)
            .Project(r => new AssignedRoomProjection
            {
                AssignToUserId = r.AssignToUserId,
                FrtDurationMs = r.FrtDurationMs
            })
            .ToListAsync(ct);
    }

    public async Task<List<UserProfile>> GetUserProfilesByIdsAsync(
        List<string> userIds, CancellationToken ct)
    {
        FilterDefinition<UserProfile> filter =
            Builders<UserProfile>.Filter.In(p => p.KeycloakUserId, userIds) |
            Builders<UserProfile>.Filter.In(p => p.Id, userIds);

        return await _dbContext.UserProfiles.Find(filter).ToListAsync(ct);
    }
}
