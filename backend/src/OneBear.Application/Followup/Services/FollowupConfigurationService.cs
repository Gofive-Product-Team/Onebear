namespace OneBear.Application.Followup.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Followup.DTOs;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class FollowupConfigurationService
{
    private readonly IFollowupConfigurationRepository _configRepo;
    private readonly ILogger<FollowupConfigurationService> _logger;

    public FollowupConfigurationService(
        IFollowupConfigurationRepository configRepo,
        ILogger<FollowupConfigurationService> logger)
    {
        _configRepo = configRepo;
        _logger = logger;
    }

    public async Task<FollowupConfigDto> GetOrCreateDefaultAsync(string companyId, CancellationToken ct)
    {
        FollowupConfiguration? config = await _configRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is not null)
            return MapToDto(config);

        // Create default configuration with all platforms
        config = new FollowupConfiguration
        {
            CompanyId = companyId,
            ChannelRules = CreateDefaultRules(),
        };
        await _configRepo.UpsertAsync(config, ct);
        return MapToDto(config);
    }

    public async Task<Result<FollowupConfigDto>> UpdateAsync(
        string companyId, string userId, UpdateFollowupConfigRequest request, CancellationToken ct)
    {
        // Validate rules
        foreach (FollowupChannelRuleDto rule in request.ChannelRules)
        {
            if (rule.TriggerDelayHours < 1 || rule.TriggerDelayHours > 24)
                return new Result<FollowupConfigDto>.Failure(
                    new Error("INVALID_DELAY", $"Trigger delay must be 1-24 hours for {rule.Platform}", ErrorType.Validation));
            if (rule.MaxAttempts < 1 || rule.MaxAttempts > 5)
                return new Result<FollowupConfigDto>.Failure(
                    new Error("INVALID_ATTEMPTS", $"Max attempts must be 1-5 for {rule.Platform}", ErrorType.Validation));
            if (rule.DebounceHours < 2 || rule.DebounceHours > 48)
                return new Result<FollowupConfigDto>.Failure(
                    new Error("INVALID_DEBOUNCE", $"Debounce must be 2-48 hours for {rule.Platform}", ErrorType.Validation));
        }

        FollowupConfiguration? config = await _configRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
        {
            config = new FollowupConfiguration { CompanyId = companyId, CreatedBy = userId };
        }

        config.ChannelRules = request.ChannelRules.Select(r => new FollowupChannelRule
        {
            Platform = r.Platform,
            Enabled = r.Enabled,
            SendWindowStart = r.SendWindowStart,
            SendWindowEnd = r.SendWindowEnd,
            TriggerDelayHours = r.TriggerDelayHours,
            MaxAttempts = r.MaxAttempts,
            DebounceHours = r.DebounceHours,
            Attempts = r.Attempts.Select(a => new FollowupAttemptTemplate
            {
                Number = a.Number,
                DelayHours = a.DelayHours,
                MessageTemplate = a.MessageTemplate,
            }).ToList(),
        }).ToList();

        config.UpdatedBy = userId;
        await _configRepo.UpsertAsync(config, ct);

        _logger.LogInformation("Follow-up configuration updated for company {CompanyId} by {UserId}", companyId, userId);
        return new Result<FollowupConfigDto>.Success(MapToDto(config));
    }

    private static List<FollowupChannelRule> CreateDefaultRules()
    {
        string[] platforms = { "Line", "Facebook", "Instagram", "WhatsApp", "Lazada", "TikTok", "Shopee" };
        return platforms.Select(p => new FollowupChannelRule
        {
            Platform = p,
            Enabled = true,
            SendWindowStart = "09:00",
            SendWindowEnd = "21:00",
            TriggerDelayHours = 2,
            MaxAttempts = 2,
            DebounceHours = 4,
            Attempts = new()
            {
                new FollowupAttemptTemplate
                {
                    Number = 1,
                    DelayHours = 2,
                    MessageTemplate = "สินค้า {{product_name}} ยังมีอยู่นะคะ ราคา {{product_price}} สนใจสั่งไหมคะ?"
                },
                new FollowupAttemptTemplate
                {
                    Number = 2,
                    DelayHours = 4,
                    MessageTemplate = "{{customer_name}} คะ สินค้า {{product_name}} กำลังจะหมด อย่าพลาดนะคะ!"
                }
            }
        }).ToList();
    }

    private static FollowupConfigDto MapToDto(FollowupConfiguration c) => new()
    {
        Id = c.Id,
        ChannelRules = c.ChannelRules.Select(r => new FollowupChannelRuleDto
        {
            Platform = r.Platform,
            Enabled = r.Enabled,
            SendWindowStart = r.SendWindowStart,
            SendWindowEnd = r.SendWindowEnd,
            TriggerDelayHours = r.TriggerDelayHours,
            MaxAttempts = r.MaxAttempts,
            DebounceHours = r.DebounceHours,
            Attempts = r.Attempts.Select(a => new FollowupAttemptDto
            {
                Number = a.Number,
                DelayHours = a.DelayHours,
                MessageTemplate = a.MessageTemplate,
            }).ToList(),
        }).ToList(),
        UpdatedTimestamp = c.UpdatedTimestamp,
    };
}
