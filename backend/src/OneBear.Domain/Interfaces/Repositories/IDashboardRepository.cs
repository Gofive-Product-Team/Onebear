namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

/// <summary>
/// Raw data projections for dashboard aggregation queries.
/// </summary>
public interface IDashboardRepository
{
    Task<long> CountRoomsByCompanyAsync(string companyId, CancellationToken ct);
    Task<long> CountActiveRoomsByCompanyAsync(string companyId, CancellationToken ct);
    Task<long> CountResolvedRoomsSinceAsync(string companyId, long sinceTimestamp, CancellationToken ct);

    Task<List<RoomFrtProjection>> GetFrtRoomsAsync(
        string companyId, long fromMs, long toMs, CancellationToken ct);

    Task<List<PlatformCountProjection>> GetPlatformDistributionAsync(
        string companyId, CancellationToken ct);

    Task<List<MessageProjection>> GetMessagesInRangeAsync(
        string companyId, long fromMs, long toMs, CancellationToken ct);

    Task<List<AssignedRoomProjection>> GetAssignedRoomsAsync(
        string companyId, long fromMs, CancellationToken ct);

    Task<List<UserProfile>> GetUserProfilesByIdsAsync(
        List<string> userIds, CancellationToken ct);
}

/// <summary>Projection of FRT-related fields from a room.</summary>
public class RoomFrtProjection
{
    public long? FrtEndTimestamp { get; set; }
    public long? FrtDurationMs { get; set; }
}

/// <summary>Result of platform group-by aggregation.</summary>
public class PlatformCountProjection
{
    public string Platform { get; set; } = "";
    public int Count { get; set; }
}

/// <summary>Projection of message fields needed for volume analysis.</summary>
public class MessageProjection
{
    public long Timestamp { get; set; }
    public string? UserId { get; set; }
    public bool IsAiMessage { get; set; }
}

/// <summary>Projection of assigned room fields for agent performance.</summary>
public class AssignedRoomProjection
{
    public string? AssignToUserId { get; set; }
    public long? FrtDurationMs { get; set; }
}
