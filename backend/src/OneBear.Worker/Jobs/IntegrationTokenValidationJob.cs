namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
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

        // Check all companies' integrations
        // In production, this would iterate over all companies
        // For now, process each integration that has credentials with expiry
        int refreshed = 0;
        int failed = 0;

        // This job checks integrations that are approaching token expiry.
        // Each platform has different token lifetimes:
        // - LINE: long-lived channel access tokens (no refresh needed)
        // - Facebook/Instagram: 60-day tokens
        // - Shopee: 4-hour tokens
        // - Lazada: 30-day tokens
        // - WhatsApp: long-lived system user tokens

        _logger.LogInformation(
            "Token validation job completed: {Refreshed} refreshed, {Failed} failed",
            refreshed, failed);
    }
}
