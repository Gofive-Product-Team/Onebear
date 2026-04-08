namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IOnboardingRepository
{
    Task<OnboardingState?> GetByUserAsync(string companyId, string userId, CancellationToken ct = default);
    Task<OnboardingState> CreateAsync(OnboardingState state, CancellationToken ct = default);
    Task<OnboardingState> UpdateAsync(OnboardingState state, CancellationToken ct = default);
    Task DeleteExpiredAsync(long nowTimestamp, CancellationToken ct = default);
}
