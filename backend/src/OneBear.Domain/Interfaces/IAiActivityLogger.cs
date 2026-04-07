namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IAiActivityLogger
{
    Task LogAsync(AiActivityLog log, CancellationToken ct);
    Task<List<AiActivityLog>> GetByRoomAsync(string companyId, string roomId, int limit, CancellationToken ct);
    Task<List<AiActivityLog>> GetByCompanyAsync(string companyId, string? eventType, int limit, CancellationToken ct);
}
