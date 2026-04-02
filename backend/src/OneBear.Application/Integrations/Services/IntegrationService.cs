namespace OneBear.Application.Integrations.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Common.Interfaces;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class IntegrationService : IIntegrationService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    private readonly IIntegrationChannelRepository _repo;
    private readonly ICacheService _cache;
    private readonly ILogger<IntegrationService> _logger;

    public IntegrationService(
        IIntegrationChannelRepository repo,
        ICacheService cache,
        ILogger<IntegrationService> logger)
    {
        _repo = repo;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IntegrationChannel?> GetByIdAsync(string integrationId, string companyId, CancellationToken ct)
    {
        string cacheKey = $"int:{integrationId}";

        IntegrationChannel? cached = await _cache.GetAsync<IntegrationChannel>(cacheKey, ct);
        if (cached is not null)
        {
            return cached;
        }

        IntegrationChannel? channel = await _repo.GetByIdAsync(integrationId, companyId, ct);
        if (channel is not null)
        {
            await _cache.SetAsync(cacheKey, channel, CacheTtl, ct);
        }

        return channel;
    }

    public async Task<Result<IntegrationChannel>> ValidateAndGetAsync(
        string integrationId, string companyId, CancellationToken ct)
    {
        IntegrationChannel? channel = await GetByIdAsync(integrationId, companyId, ct);

        if (channel is null)
        {
            _logger.LogWarning("Integration {IntegrationId} not found for company {CompanyId}",
                integrationId, companyId);
            return new Result<IntegrationChannel>.Failure(
                new Error("INTEGRATION_NOT_FOUND", $"Integration '{integrationId}' not found.", ErrorType.NotFound));
        }

        if (!channel.IsActive)
        {
            _logger.LogWarning("Integration {IntegrationId} is inactive", integrationId);
            return new Result<IntegrationChannel>.Failure(
                new Error("INTEGRATION_INACTIVE", $"Integration '{integrationId}' is not active.", ErrorType.Validation));
        }

        if (!channel.HasChatFeature)
        {
            _logger.LogWarning("Integration {IntegrationId} does not have chat feature enabled", integrationId);
            return new Result<IntegrationChannel>.Failure(
                new Error("INTEGRATION_NO_CHAT", $"Integration '{integrationId}' does not have chat feature enabled.", ErrorType.Validation));
        }

        return new Result<IntegrationChannel>.Success(channel);
    }
}
