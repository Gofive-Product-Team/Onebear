namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class FollowupScheduleRepository : IFollowupScheduleRepository
{
    private readonly CosmosDbContext _context;

    public FollowupScheduleRepository(CosmosDbContext context)
    {
        _context = context;
    }

    public Task<FollowupSchedule?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<List<FollowupSchedule>> GetDueSchedulesAsync(string companyId, long beforeTimestamp, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<FollowupSchedule?> GetByRoomIdAsync(string companyId, string roomId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<FollowupSchedule> CreateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<FollowupSchedule> UpdateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => throw new NotImplementedException();
}
