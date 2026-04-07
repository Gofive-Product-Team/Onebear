namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IFollowupScheduleRepository
{
    Task<FollowupSchedule?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<FollowupSchedule>> GetDueSchedulesAsync(string companyId, long beforeTimestamp, CancellationToken ct = default);
    Task<FollowupSchedule?> GetByRoomIdAsync(string companyId, string roomId, CancellationToken ct = default);
    Task<FollowupSchedule> CreateAsync(FollowupSchedule schedule, CancellationToken ct = default);
    Task<FollowupSchedule> UpdateAsync(FollowupSchedule schedule, CancellationToken ct = default);
}
