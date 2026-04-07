namespace OneBear.Application.Chatbot.Services;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class AiActivityLogger : IAiActivityLogger
{
    private readonly IAiActivityLogRepository _repo;
    private readonly ILogger<AiActivityLogger> _logger;

    public AiActivityLogger(IAiActivityLogRepository repo, ILogger<AiActivityLogger> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task LogAsync(AiActivityLog log, CancellationToken ct)
    {
        try
        {
            if (log.Timestamp == 0)
                log.Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            await _repo.CreateAsync(log, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write AI activity log for {EventType} in room {RoomId}", log.EventType, log.RoomId);
        }
    }

    public Task<List<AiActivityLog>> GetByRoomAsync(string companyId, string roomId, int limit, CancellationToken ct)
        => _repo.GetByRoomAsync(companyId, roomId, limit, ct);

    public Task<List<AiActivityLog>> GetByCompanyAsync(string companyId, string? eventType, int limit, CancellationToken ct)
        => _repo.GetByCompanyAsync(companyId, eventType, limit, ct);
}
