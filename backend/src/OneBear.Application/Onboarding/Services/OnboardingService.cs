namespace OneBear.Application.Onboarding.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Onboarding.DTOs;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class OnboardingService
{
    private readonly IOnboardingRepository _onboardingRepo;
    private readonly IProductRepository _productRepo;
    private readonly ILogger<OnboardingService> _logger;

    private const int MaxChannels = 5;

    public OnboardingService(
        IOnboardingRepository onboardingRepo,
        IProductRepository productRepo,
        ILogger<OnboardingService> logger)
    {
        _onboardingRepo = onboardingRepo;
        _productRepo = productRepo;
        _logger = logger;
    }

    /// <summary>Get or create onboarding state. If expired (GAP 38), creates fresh.</summary>
    public async Task<OnboardingStateDto> GetOrCreateAsync(string companyId, string userId, CancellationToken ct)
    {
        OnboardingState? state = await _onboardingRepo.GetByUserAsync(companyId, userId, ct);

        if (state is not null && !state.IsCompleted && state.IsExpired)
        {
            _logger.LogInformation("Onboarding expired for user {UserId}, resetting to step 1", userId);
            state = null; // will create new
        }

        if (state is not null)
        {
            state.TouchActivity();
            await _onboardingRepo.UpdateAsync(state, ct);
            return MapToDto(state);
        }

        state = new OnboardingState
        {
            CompanyId = companyId,
            UserId = userId,
            CurrentStep = 1,
            CreatedBy = userId,
        };
        state.TouchActivity();
        await _onboardingRepo.CreateAsync(state, ct);
        return MapToDto(state);
    }

    /// <summary>Step 1: Connect a channel (max 5).</summary>
    public async Task<Result<OnboardingStateDto>> ConnectChannelAsync(
        string companyId, string userId, ConnectChannelRequest request, CancellationToken ct)
    {
        OnboardingState? state = await GetActiveState(companyId, userId, ct);
        if (state is null)
            return new Result<OnboardingStateDto>.Failure(new Error("ONBOARDING_EXPIRED", "Onboarding session expired. Please start over.", ErrorType.Validation));

        if (state.ConnectedChannels.Count >= MaxChannels)
            return new Result<OnboardingStateDto>.Failure(new Error("MAX_CHANNELS", "Maximum 5 channels during onboarding", ErrorType.Validation));

        state.ConnectedChannels.Add(new OnboardingChannel
        {
            Platform = request.Platform,
            ChannelName = request.ChannelName,
            IntegrationId = request.IntegrationId,
            ConnectedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        });

        state.TouchActivity();
        await _onboardingRepo.UpdateAsync(state, ct);
        _logger.LogInformation("Onboarding: channel {Platform} connected for user {UserId}", request.Platform, userId);
        return new Result<OnboardingStateDto>.Success(MapToDto(state));
    }

    /// <summary>Step 1→2: Advance to AI Ready step (requires at least 1 channel).</summary>
    public async Task<Result<OnboardingStateDto>> AdvanceToStep2Async(
        string companyId, string userId, CancellationToken ct)
    {
        OnboardingState? state = await GetActiveState(companyId, userId, ct);
        if (state is null)
            return new Result<OnboardingStateDto>.Failure(new Error("ONBOARDING_EXPIRED", "Session expired", ErrorType.Validation));

        if (state.ConnectedChannels.Count == 0)
            return new Result<OnboardingStateDto>.Failure(new Error("NO_CHANNELS", "Connect at least 1 channel first", ErrorType.Validation));

        state.CurrentStep = 2;

        // Auto-create sample product if user has no products (GAP 37)
        int productCount = await _productRepo.GetCountAsync(companyId, ct);
        if (productCount == 0)
        {
            state.SampleProductCreated = true;
            state.PendingProducts.Add(new OnboardingProduct
            {
                Name = "ของขวัญตัวอย่าง",
                Category = "General",
                Price = 99,
                Stock = 100,
            });
        }
        else
        {
            state.CanCloseOrders = true; // existing products = AI can close orders
        }

        state.TouchActivity();
        await _onboardingRepo.UpdateAsync(state, ct);
        return new Result<OnboardingStateDto>.Success(MapToDto(state));
    }

    /// <summary>Step 2→3: Save products (GAP 39: commit only on tap Next) and advance to Done.</summary>
    public async Task<Result<OnboardingStateDto>> CompleteStep2Async(
        string companyId, string userId, CompleteStep2Request request, CancellationToken ct)
    {
        OnboardingState? state = await GetActiveState(companyId, userId, ct);
        if (state is null)
            return new Result<OnboardingStateDto>.Failure(new Error("ONBOARDING_EXPIRED", "Session expired", ErrorType.Validation));

        // Commit all products to database in one batch (GAP 39)
        List<OnboardingProductDto> allProducts = request.Products;
        if (allProducts.Count == 0 && state.PendingProducts.Count > 0)
            allProducts = state.PendingProducts.Select(p => new OnboardingProductDto
            {
                Name = p.Name, Category = p.Category, Price = p.Price, Stock = p.Stock
            }).ToList();

        if (allProducts.Count > 0)
        {
            List<Product> products = allProducts.Select(p => new Product
            {
                CompanyId = companyId,
                Name = p.Name,
                Category = p.Category,
                Price = p.Price,
                Stock = p.Stock,
                IsSample = state.SampleProductCreated && p.Name == "ของขวัญตัวอย่าง",
                CreatedBy = userId,
            }).ToList();

            await _productRepo.CreateManyAsync(products, ct);

            // Check if any real (non-sample) product → AI can close orders (GAP 37)
            bool hasRealProduct = allProducts.Any(p => p.Name != "ของขวัญตัวอย่าง");
            state.CanCloseOrders = hasRealProduct;
        }

        state.CurrentStep = 3;
        state.IsCompleted = true;
        state.TouchActivity();
        await _onboardingRepo.UpdateAsync(state, ct);

        _logger.LogInformation("Onboarding completed for user {UserId}, {ProductCount} products committed", userId, allProducts.Count);
        return new Result<OnboardingStateDto>.Success(MapToDto(state));
    }

    /// <summary>Step 3: Dismiss a tutorial popup (tracked per admin).</summary>
    public async Task<Result<OnboardingStateDto>> DismissTutorialAsync(
        string companyId, string userId, DismissTutorialRequest request, CancellationToken ct)
    {
        OnboardingState? state = await _onboardingRepo.GetByUserAsync(companyId, userId, ct);
        if (state is null)
            return new Result<OnboardingStateDto>.Failure(new Error("NOT_FOUND", "No onboarding state", ErrorType.NotFound));

        if (!state.TutorialsDismissed.Contains(request.TutorialKey))
            state.TutorialsDismissed.Add(request.TutorialKey);

        state.TutorialDismissed = true;
        await _onboardingRepo.UpdateAsync(state, ct);
        return new Result<OnboardingStateDto>.Success(MapToDto(state));
    }

    private async Task<OnboardingState?> GetActiveState(string companyId, string userId, CancellationToken ct)
    {
        OnboardingState? state = await _onboardingRepo.GetByUserAsync(companyId, userId, ct);
        if (state is null || state.IsCompleted || state.IsExpired) return null;
        return state;
    }

    private static OnboardingStateDto MapToDto(OnboardingState s) => new()
    {
        Id = s.Id,
        CurrentStep = s.CurrentStep,
        IsCompleted = s.IsCompleted,
        ConnectedChannels = s.ConnectedChannels.Select(c => new OnboardingChannelDto
        {
            Platform = c.Platform, ChannelName = c.ChannelName,
            IntegrationId = c.IntegrationId, TestMessageReceived = c.TestMessageReceived,
        }).ToList(),
        TestMessageReceived = s.TestMessageReceived,
        AiEnabled = s.AiEnabled,
        SampleProductCreated = s.SampleProductCreated,
        PendingProducts = s.PendingProducts.Select(p => new OnboardingProductDto
        {
            Name = p.Name, Category = p.Category, Price = p.Price, Stock = p.Stock,
        }).ToList(),
        CanAnswerFaq = s.CanAnswerFaq,
        CanCloseOrders = s.CanCloseOrders,
        TutorialDismissed = s.TutorialDismissed,
        TutorialsDismissed = s.TutorialsDismissed,
    };
}
