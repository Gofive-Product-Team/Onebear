namespace OneBear.Application.Customers.Services;

using OneBear.Application.Customers.DTOs;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ActivityLogService
{
    private readonly IActivityLogRepository _activityLogRepo;

    public ActivityLogService(IActivityLogRepository activityLogRepo)
    {
        _activityLogRepo = activityLogRepo;
    }

    /// <summary>
    /// Creates a new activity log entry for a customer.
    /// </summary>
    public async Task LogActivityAsync(
        string companyId,
        string customerId,
        string type,
        string description,
        string? actorId = null,
        string? actorName = null,
        string? referenceId = null,
        string? referenceType = null,
        CancellationToken ct = default)
    {
        ActivityLog log = new()
        {
            CompanyId = companyId,
            CustomerId = customerId,
            Type = type,
            Description = description,
            ActorId = actorId,
            ActorName = actorName,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await _activityLogRepo.CreateAsync(log, ct);
    }

    /// <summary>
    /// Returns a paginated list of activity log entries for a customer.
    /// </summary>
    public async Task<(List<ActivityLogDto> Items, string? ContinuationToken)> GetByCustomerAsync(
        string customerId,
        string? type,
        int pageSize,
        string? continuationToken,
        CancellationToken ct = default)
    {
        (List<ActivityLog> items, string? nextToken) =
            await _activityLogRepo.GetByCustomerAsync(customerId, type, pageSize, continuationToken, ct);

        List<ActivityLogDto> dtos = items.Select(a => new ActivityLogDto
        {
            Id = a.Id,
            Type = a.Type,
            Description = a.Description,
            ActorId = a.ActorId,
            ActorName = a.ActorName,
            ReferenceId = a.ReferenceId,
            ReferenceType = a.ReferenceType,
            Timestamp = a.Timestamp
        }).ToList();

        return (dtos, nextToken);
    }
}
