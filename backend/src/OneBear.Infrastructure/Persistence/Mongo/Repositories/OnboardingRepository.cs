namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class OnboardingRepository : MongoRepositoryBase<OnboardingState>, IOnboardingRepository
{
    public OnboardingRepository(MongoDbContext context, ILogger<OnboardingRepository> logger)
        : base(context.OnboardingStates, logger) { }

    public async Task<OnboardingState?> GetByUserAsync(string companyId, string userId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<OnboardingState> fb = Builders<OnboardingState>.Filter;
        return await _collection.Find(fb.And(
            fb.Eq(s => s.CompanyId, companyId),
            fb.Eq(s => s.UserId, userId)
        )).FirstOrDefaultAsync(ct);
    }

    public Task<OnboardingState> CreateAsync(OnboardingState state, CancellationToken ct = default)
        => CreateItemAsync(state, ct);

    public Task<OnboardingState> UpdateAsync(OnboardingState state, CancellationToken ct = default)
        => ReplaceItemAsync(state, ct);

    public async Task DeleteExpiredAsync(long nowTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<OnboardingState> fb = Builders<OnboardingState>.Filter;
        await _collection.DeleteManyAsync(fb.And(
            fb.Eq(s => s.IsCompleted, false),
            fb.Lt(s => s.ExpiresAtTimestamp, nowTimestamp)
        ), ct);
    }
}
