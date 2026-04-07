namespace OneBear.Application.Common.Interfaces;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface IIntegrationService
{
    Task<Result<IntegrationChannel>> ValidateAndGetAsync(string integrationId, string companyId, CancellationToken ct);
    Task<IntegrationChannel?> GetByIdAsync(string integrationId, string companyId, CancellationToken ct);
    Task<IntegrationChannel?> GetByBotIdAsync(string platform, string botId, CancellationToken ct);
}
