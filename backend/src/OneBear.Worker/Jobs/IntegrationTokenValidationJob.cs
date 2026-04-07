namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;
using Quartz;

[DisallowConcurrentExecution]
public class IntegrationTokenValidationJob : IJob
{
    private static readonly TimeSpan RefreshThreshold = TimeSpan.FromHours(4);

    private readonly IIntegrationChannelRepository _integrationRepo;
    private readonly IServiceProvider _sp;
    private readonly ILogger<IntegrationTokenValidationJob> _logger;

    public IntegrationTokenValidationJob(
        IIntegrationChannelRepository integrationRepo,
        IServiceProvider sp,
        ILogger<IntegrationTokenValidationJob> logger)
    {
        _integrationRepo = integrationRepo;
        _sp = sp;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        CancellationToken ct = context.CancellationToken;
        _logger.LogInformation("Starting integration token validation job");

        int refreshed = 0;
        int failed = 0;

        // Query all active integrations with tokens expiring within the threshold
        long thresholdTimestamp = DateTimeOffset.UtcNow.Add(RefreshThreshold).ToUnixTimeMilliseconds();
        List<IntegrationChannel> expiringIntegrations =
            await _integrationRepo.GetAllWithExpiringTokensAsync(thresholdTimestamp, ct);

        _logger.LogInformation("Found {Count} integrations with expiring tokens", expiringIntegrations.Count);

        foreach (IntegrationChannel integration in expiringIntegrations)
        {
            try
            {
                // LINE uses long-lived tokens — skip refresh
                if (integration.Platform == SocialPlatform.Line)
                    continue;

                // WhatsApp with permanent system user tokens — skip if no expiry set
                if (integration.Platform == SocialPlatform.WhatsApp
                    && integration.Credentials?.TokenExpiresAt is null)
                    continue;

                IPlatformAdapter adapter = _sp.GetRequiredKeyedService<IPlatformAdapter>(integration.Platform);
                Result<TokenRefreshResult> result = await adapter.RefreshTokenAsync(integration, ct);

                if (result is Result<TokenRefreshResult>.Success success && success.Value.Success)
                {
                    // Update credentials with new tokens
                    if (integration.Credentials is not null)
                    {
                        if (!string.IsNullOrEmpty(success.Value.AccessToken))
                            integration.Credentials.AccessToken = success.Value.AccessToken;
                        if (!string.IsNullOrEmpty(success.Value.RefreshToken))
                            integration.Credentials.RefreshToken = success.Value.RefreshToken;
                        if (success.Value.ExpiresAt > 0)
                            integration.Credentials.TokenExpiresAt = success.Value.ExpiresAt;
                    }

                    await _integrationRepo.UpdateAsync(integration, ct);
                    refreshed++;

                    _logger.LogInformation(
                        "Refreshed token for integration {IntegrationId} ({Platform})",
                        integration.Id, integration.Platform);
                }
                else
                {
                    failed++;
                    string errorMsg = result is Result<TokenRefreshResult>.Failure f
                        ? f.Error.Message
                        : result is Result<TokenRefreshResult>.Success s2
                            ? s2.Value.ErrorMessage ?? "Unknown error"
                            : "Unknown error";

                    _logger.LogWarning(
                        "Failed to refresh token for integration {IntegrationId} ({Platform}): {Error}",
                        integration.Id, integration.Platform, errorMsg);
                }
            }
            catch (Exception ex)
            {
                failed++;
                _logger.LogError(ex,
                    "Error refreshing token for integration {IntegrationId} ({Platform})",
                    integration.Id, integration.Platform);
            }
        }

        _logger.LogInformation(
            "Token validation job completed: {Refreshed} refreshed, {Failed} failed",
            refreshed, failed);
    }
}
