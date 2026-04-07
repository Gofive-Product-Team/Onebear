namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class FollowupScheduleRepository : MongoRepositoryBase<FollowupSchedule>, IFollowupScheduleRepository
{
    public FollowupScheduleRepository(MongoDbContext context, ILogger<FollowupScheduleRepository> logger)
        : base(context.FollowupSchedules, logger) { }

    public Task<FollowupSchedule?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, ct);

    public async Task<List<FollowupSchedule>> GetDueSchedulesAsync(
        string companyId, long beforeTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<FollowupSchedule> fb = Builders<FollowupSchedule>.Filter;
        FilterDefinition<FollowupSchedule> filter = fb.And(
            fb.Eq(s => s.CompanyId, companyId),
            fb.Eq(s => s.IsProcessed, false),
            fb.Lte(s => s.ScheduledTimestamp, beforeTimestamp)
        );

        SortDefinition<FollowupSchedule> sort = Builders<FollowupSchedule>.Sort.Ascending(s => s.ScheduledTimestamp);

        return await _collection.Find(filter).Sort(sort).Limit(100).ToListAsync(ct);
    }

    public async Task<FollowupSchedule?> GetByRoomIdAsync(string companyId, string roomId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<FollowupSchedule> fb = Builders<FollowupSchedule>.Filter;
        FilterDefinition<FollowupSchedule> filter = fb.And(
            fb.Eq(s => s.CompanyId, companyId),
            fb.Eq(s => s.RoomId, roomId),
            fb.Eq(s => s.IsProcessed, false)
        );

        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public Task<FollowupSchedule> CreateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => CreateItemAsync(schedule, ct);

    public Task<FollowupSchedule> UpdateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => ReplaceItemAsync(schedule, ct);
}
