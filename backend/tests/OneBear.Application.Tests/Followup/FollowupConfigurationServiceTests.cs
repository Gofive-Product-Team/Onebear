namespace OneBear.Application.Tests.Followup;

using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Followup.DTOs;
using OneBear.Application.Followup.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class FollowupConfigurationServiceTests
{
    private readonly Mock<IFollowupConfigurationRepository> _repoMock;
    private readonly Mock<ILogger<FollowupConfigurationService>> _loggerMock;
    private readonly FollowupConfigurationService _sut;

    private const string CompanyId = "company-001";
    private const string UserId = "user-001";

    public FollowupConfigurationServiceTests()
    {
        _repoMock = new Mock<IFollowupConfigurationRepository>();
        _loggerMock = new Mock<ILogger<FollowupConfigurationService>>();

        _repoMock.Setup(r => r.UpsertAsync(It.IsAny<FollowupConfiguration>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((FollowupConfiguration c, CancellationToken _) => c);

        _sut = new FollowupConfigurationService(_repoMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetOrCreateDefault_ShouldReturnExisting_WhenConfigExists()
    {
        FollowupConfiguration existing = new()
        {
            Id = "config-1",
            CompanyId = CompanyId,
            ChannelRules = new() { new FollowupChannelRule { Platform = "Line", Enabled = true } }
        };
        _repoMock.Setup(r => r.GetByCompanyIdAsync(CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        FollowupConfigDto result = await _sut.GetOrCreateDefaultAsync(CompanyId, CancellationToken.None);

        Assert.Single(result.ChannelRules);
        Assert.Equal("Line", result.ChannelRules[0].Platform);
        _repoMock.Verify(r => r.UpsertAsync(It.IsAny<FollowupConfiguration>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetOrCreateDefault_ShouldCreateDefaults_WhenNoConfigExists()
    {
        _repoMock.Setup(r => r.GetByCompanyIdAsync(CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FollowupConfiguration?)null);

        FollowupConfigDto result = await _sut.GetOrCreateDefaultAsync(CompanyId, CancellationToken.None);

        Assert.Equal(7, result.ChannelRules.Count); // 7 platforms
        Assert.All(result.ChannelRules, r => Assert.True(r.Enabled));
        Assert.All(result.ChannelRules, r => Assert.Equal(2, r.MaxAttempts));
        Assert.All(result.ChannelRules, r => Assert.Equal(2, r.Attempts.Count));
        _repoMock.Verify(r => r.UpsertAsync(It.IsAny<FollowupConfiguration>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_ShouldSucceed_WithValidRules()
    {
        _repoMock.Setup(r => r.GetByCompanyIdAsync(CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FollowupConfiguration { CompanyId = CompanyId });

        UpdateFollowupConfigRequest request = new()
        {
            ChannelRules = new()
            {
                new FollowupChannelRuleDto
                {
                    Platform = "Line",
                    Enabled = true,
                    TriggerDelayHours = 3,
                    MaxAttempts = 3,
                    DebounceHours = 6,
                    Attempts = new() { new FollowupAttemptDto { Number = 1, DelayHours = 3, MessageTemplate = "test" } }
                }
            }
        };

        Result<FollowupConfigDto> result = await _sut.UpdateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<FollowupConfigDto>.Success>(result);
        FollowupConfigDto dto = ((Result<FollowupConfigDto>.Success)result).Value;
        Assert.Single(dto.ChannelRules);
        Assert.Equal(3, dto.ChannelRules[0].TriggerDelayHours);
    }

    [Fact]
    public async Task Update_ShouldFail_WhenTriggerDelayOutOfRange()
    {
        UpdateFollowupConfigRequest request = new()
        {
            ChannelRules = new()
            {
                new FollowupChannelRuleDto { Platform = "Line", TriggerDelayHours = 30, MaxAttempts = 2, DebounceHours = 4 } // >24
            }
        };

        Result<FollowupConfigDto> result = await _sut.UpdateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<FollowupConfigDto>.Failure>(result);
        Assert.Equal("INVALID_DELAY", ((Result<FollowupConfigDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task Update_ShouldFail_WhenMaxAttemptsOutOfRange()
    {
        UpdateFollowupConfigRequest request = new()
        {
            ChannelRules = new()
            {
                new FollowupChannelRuleDto { Platform = "Facebook", TriggerDelayHours = 2, MaxAttempts = 10, DebounceHours = 4 } // >5
            }
        };

        Result<FollowupConfigDto> result = await _sut.UpdateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<FollowupConfigDto>.Failure>(result);
        Assert.Equal("INVALID_ATTEMPTS", ((Result<FollowupConfigDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task Update_ShouldFail_WhenDebounceOutOfRange()
    {
        UpdateFollowupConfigRequest request = new()
        {
            ChannelRules = new()
            {
                new FollowupChannelRuleDto { Platform = "WhatsApp", TriggerDelayHours = 2, MaxAttempts = 2, DebounceHours = 1 } // <2
            }
        };

        Result<FollowupConfigDto> result = await _sut.UpdateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<FollowupConfigDto>.Failure>(result);
        Assert.Equal("INVALID_DEBOUNCE", ((Result<FollowupConfigDto>.Failure)result).Error.Code);
    }
}
