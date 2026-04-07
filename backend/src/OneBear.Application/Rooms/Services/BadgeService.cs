namespace OneBear.Application.Rooms.Services;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class BadgeService
{
    private static readonly TimeSpan BadgeCacheTtl = TimeSpan.FromSeconds(30);

    private readonly IChatRoomRepository _roomRepo;
    private readonly ICacheService _cache;
    private readonly ILogger<BadgeService> _logger;

    public BadgeService(
        IChatRoomRepository roomRepo,
        ICacheService cache,
        ILogger<BadgeService> logger)
    {
        _roomRepo = roomRepo;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Result<BadgeCountResult>> GetBadgeCountAsync(
        string companyId, string userId, CancellationToken ct = default)
    {
        string cacheKey = $"badge:{companyId}:{userId}";

        BadgeCountResult? cached = await _cache.GetAsync<BadgeCountResult>(cacheKey, ct);
        if (cached is not null)
            return new Result<BadgeCountResult>.Success(cached);

        // Total unread across all rooms for this company
        int total = await _roomRepo.GetBadgeCountAsync(companyId, assignToUserId: null, ct);

        // Unread for rooms assigned to this user
        int mine = await _roomRepo.GetBadgeCountAsync(companyId, assignToUserId: userId, ct);

        // Unassigned = total - all assigned (rooms with no assignee)
        int unassigned = total - mine;
        if (unassigned < 0) unassigned = 0;

        BadgeCountResult result = new()
        {
            Total = total,
            Mine = mine,
            Unassigned = unassigned
        };

        await _cache.SetAsync(cacheKey, result, BadgeCacheTtl, ct);

        return new Result<BadgeCountResult>.Success(result);
    }
}

public class BadgeCountResult
{
    public int Total { get; set; }
    public int Mine { get; set; }
    public int Unassigned { get; set; }
    public int FollowUp { get; set; }
}
