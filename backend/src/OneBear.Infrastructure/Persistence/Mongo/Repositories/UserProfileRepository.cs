namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class UserProfileRepository : MongoRepositoryBase<UserProfile>, IUserProfileRepository
{
    public UserProfileRepository(MongoDbContext context, ILogger<UserProfileRepository> logger)
        : base(context.UserProfiles, logger) { }

    public async Task<UserProfile?> GetByKeycloakUserIdAsync(string keycloakUserId, CancellationToken ct)
    {
        FilterDefinition<UserProfile> filter = Builders<UserProfile>.Filter.Eq(x => x.KeycloakUserId, keycloakUserId);
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<UserProfile?> GetByEmailAsync(string email, CancellationToken ct)
    {
        FilterDefinition<UserProfile> filter = Builders<UserProfile>.Filter.Eq(x => x.Email, email);
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<List<UserProfile>> GetByCompanyIdAsync(string companyId, CancellationToken ct)
    {
        FilterDefinitionBuilder<UserProfile> fb = Builders<UserProfile>.Filter;
        FilterDefinition<UserProfile> filter = fb.And(
            fb.Eq(x => x.CompanyId, companyId),
            fb.Eq(x => x.IsActive, true)
        );
        return await _collection.Find(filter).ToListAsync(ct);
    }

    public Task<UserProfile> CreateAsync(UserProfile profile, CancellationToken ct)
        => CreateItemAsync(profile, ct);

    public Task<UserProfile> UpdateAsync(UserProfile profile, CancellationToken ct)
        => ReplaceItemAsync(profile, ct);
}
