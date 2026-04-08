namespace OneBear.Application.Tests.Onboarding;

using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Onboarding.DTOs;
using OneBear.Application.Onboarding.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class OnboardingServiceTests
{
    private readonly Mock<IOnboardingRepository> _onboardingRepoMock;
    private readonly Mock<IProductRepository> _productRepoMock;
    private readonly Mock<ILogger<OnboardingService>> _loggerMock;
    private readonly OnboardingService _sut;

    private const string CompanyId = "company-001";
    private const string UserId = "user-001";

    public OnboardingServiceTests()
    {
        _onboardingRepoMock = new Mock<IOnboardingRepository>();
        _productRepoMock = new Mock<IProductRepository>();
        _loggerMock = new Mock<ILogger<OnboardingService>>();

        _onboardingRepoMock.Setup(r => r.CreateAsync(It.IsAny<OnboardingState>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((OnboardingState s, CancellationToken _) => s);
        _onboardingRepoMock.Setup(r => r.UpdateAsync(It.IsAny<OnboardingState>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((OnboardingState s, CancellationToken _) => s);
        _productRepoMock.Setup(r => r.GetCountAsync(CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _productRepoMock.Setup(r => r.CreateManyAsync(It.IsAny<List<Product>>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        _sut = new OnboardingService(_onboardingRepoMock.Object, _productRepoMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetOrCreate_ShouldCreateNewState_WhenNoneExists()
    {
        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((OnboardingState?)null);

        OnboardingStateDto result = await _sut.GetOrCreateAsync(CompanyId, UserId, CancellationToken.None);

        Assert.Equal(1, result.CurrentStep);
        Assert.False(result.IsCompleted);
        _onboardingRepoMock.Verify(r => r.CreateAsync(It.IsAny<OnboardingState>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetOrCreate_ShouldResetExpiredState()
    {
        OnboardingState expired = CreateState(step: 2, completed: false);
        expired.ExpiresAtTimestamp = DateTimeOffset.UtcNow.AddHours(-1).ToUnixTimeMilliseconds(); // expired

        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expired);

        OnboardingStateDto result = await _sut.GetOrCreateAsync(CompanyId, UserId, CancellationToken.None);

        Assert.Equal(1, result.CurrentStep); // reset to step 1
        _onboardingRepoMock.Verify(r => r.CreateAsync(It.IsAny<OnboardingState>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ConnectChannel_ShouldAddChannel()
    {
        OnboardingState state = CreateState(step: 1);
        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        Result<OnboardingStateDto> result = await _sut.ConnectChannelAsync(CompanyId, UserId,
            new ConnectChannelRequest { Platform = "Line", ChannelName = "My LINE" }, CancellationToken.None);

        Assert.IsType<Result<OnboardingStateDto>.Success>(result);
        Assert.Single(((Result<OnboardingStateDto>.Success)result).Value.ConnectedChannels);
    }

    [Fact]
    public async Task ConnectChannel_ShouldFail_WhenMax5Reached()
    {
        OnboardingState state = CreateState(step: 1);
        for (int i = 0; i < 5; i++)
            state.ConnectedChannels.Add(new OnboardingChannel { Platform = $"Platform{i}" });

        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        Result<OnboardingStateDto> result = await _sut.ConnectChannelAsync(CompanyId, UserId,
            new ConnectChannelRequest { Platform = "Extra" }, CancellationToken.None);

        Assert.IsType<Result<OnboardingStateDto>.Failure>(result);
        Assert.Equal("MAX_CHANNELS", ((Result<OnboardingStateDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task AdvanceToStep2_ShouldFail_WithNoChannels()
    {
        OnboardingState state = CreateState(step: 1);
        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        Result<OnboardingStateDto> result = await _sut.AdvanceToStep2Async(CompanyId, UserId, CancellationToken.None);

        Assert.IsType<Result<OnboardingStateDto>.Failure>(result);
        Assert.Equal("NO_CHANNELS", ((Result<OnboardingStateDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task AdvanceToStep2_ShouldCreateSampleProduct_WhenNoProducts()
    {
        OnboardingState state = CreateState(step: 1);
        state.ConnectedChannels.Add(new OnboardingChannel { Platform = "Line" });
        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>())).ReturnsAsync(state);
        _productRepoMock.Setup(r => r.GetCountAsync(CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(0);

        Result<OnboardingStateDto> result = await _sut.AdvanceToStep2Async(CompanyId, UserId, CancellationToken.None);

        OnboardingStateDto dto = ((Result<OnboardingStateDto>.Success)result).Value;
        Assert.Equal(2, dto.CurrentStep);
        Assert.True(dto.SampleProductCreated);
        Assert.Single(dto.PendingProducts);
        Assert.Equal("ของขวัญตัวอย่าง", dto.PendingProducts[0].Name);
    }

    [Fact]
    public async Task AdvanceToStep2_ShouldSkipSample_WhenProductsExist()
    {
        OnboardingState state = CreateState(step: 1);
        state.ConnectedChannels.Add(new OnboardingChannel { Platform = "Line" });
        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>())).ReturnsAsync(state);
        _productRepoMock.Setup(r => r.GetCountAsync(CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(5);

        Result<OnboardingStateDto> result = await _sut.AdvanceToStep2Async(CompanyId, UserId, CancellationToken.None);

        OnboardingStateDto dto = ((Result<OnboardingStateDto>.Success)result).Value;
        Assert.False(dto.SampleProductCreated);
        Assert.True(dto.CanCloseOrders); // existing products
    }

    [Fact]
    public async Task CompleteStep2_ShouldCommitProducts_AndSetCompleted()
    {
        OnboardingState state = CreateState(step: 2);
        state.SampleProductCreated = true;
        state.PendingProducts.Add(new OnboardingProduct { Name = "ของขวัญตัวอย่าง", Price = 99, Stock = 100 });
        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        CompleteStep2Request request = new()
        {
            Products = new() { new OnboardingProductDto { Name = "Real Product", Category = "Food", Price = 250, Stock = 50 } }
        };

        Result<OnboardingStateDto> result = await _sut.CompleteStep2Async(CompanyId, UserId, request, CancellationToken.None);

        OnboardingStateDto dto = ((Result<OnboardingStateDto>.Success)result).Value;
        Assert.True(dto.IsCompleted);
        Assert.Equal(3, dto.CurrentStep);
        Assert.True(dto.CanCloseOrders); // real product added
        _productRepoMock.Verify(r => r.CreateManyAsync(It.Is<List<Product>>(p => p.Count == 1), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompleteStep2_ShouldNotEnableCloseOrders_WhenOnlySample()
    {
        OnboardingState state = CreateState(step: 2);
        state.SampleProductCreated = true;
        state.PendingProducts.Add(new OnboardingProduct { Name = "ของขวัญตัวอย่าง", Price = 99, Stock = 100 });
        _onboardingRepoMock.Setup(r => r.GetByUserAsync(CompanyId, UserId, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        CompleteStep2Request request = new() { Products = new() }; // empty = use pending (sample only)

        Result<OnboardingStateDto> result = await _sut.CompleteStep2Async(CompanyId, UserId, request, CancellationToken.None);

        OnboardingStateDto dto = ((Result<OnboardingStateDto>.Success)result).Value;
        Assert.False(dto.CanCloseOrders); // only sample → degraded AI (GAP 37)
    }

    private static OnboardingState CreateState(int step, bool completed = false)
    {
        OnboardingState state = new() { Id = "ob-1", CompanyId = CompanyId, UserId = UserId, CurrentStep = step, IsCompleted = completed };
        state.TouchActivity();
        return state;
    }
}
