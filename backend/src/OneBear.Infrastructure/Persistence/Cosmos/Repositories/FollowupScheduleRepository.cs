namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class FollowupScheduleRepository : CosmosRepositoryBase<FollowupSchedule>, IFollowupScheduleRepository
{
    public FollowupScheduleRepository(CosmosDbContext context, ILogger<FollowupScheduleRepository> logger)
        : base(context.FollowupSchedules, logger) { }

    protected override string GetEntityId(FollowupSchedule entity) => entity.Id;

    public Task<FollowupSchedule?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<List<FollowupSchedule>> GetDueSchedulesAsync(
        string companyId, long beforeTimestamp, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.isProcessed = false AND c.scheduledTimestamp <= @before ORDER BY c.scheduledTimestamp ASC")
            .WithParameter("@companyId", companyId)
            .WithParameter("@before", beforeTimestamp);

        (List<FollowupSchedule> items, _) = await QueryAsync<FollowupSchedule>(
            query, new PartitionKey(companyId), 100, null, ct);
        return items;
    }

    public async Task<FollowupSchedule?> GetByRoomIdAsync(string companyId, string roomId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.roomId = @roomId AND c.isProcessed = false")
            .WithParameter("@companyId", companyId)
            .WithParameter("@roomId", roomId);

        (List<FollowupSchedule> items, _) = await QueryAsync<FollowupSchedule>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<FollowupSchedule> CreateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => CreateItemAsync(schedule, new PartitionKey(schedule.CompanyId), ct);

    public Task<FollowupSchedule> UpdateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => ReplaceItemAsync(schedule, new PartitionKey(schedule.CompanyId), ct);
}
