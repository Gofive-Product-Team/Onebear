namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IFollowupScheduleRepository
{
    Task<FollowupSchedule?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(IReadOnlyList<FollowupSchedule> Items, string? ContinuationToken)> ListByRoomAsync(string roomId, string companyId, int pageSize, string? continuationToken, CancellationToken ct = default);
    Task<FollowupSchedule> CreateAsync(FollowupSchedule schedule, CancellationToken ct = default);
    Task<FollowupSchedule> UpdateAsync(FollowupSchedule schedule, CancellationToken ct = default);
}
