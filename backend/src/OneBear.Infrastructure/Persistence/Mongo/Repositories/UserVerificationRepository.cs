namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class UserVerificationRepository : MongoRepositoryBase<UserVerification>, IUserVerificationRepository
{
    public UserVerificationRepository(MongoDbContext context, ILogger<UserVerificationRepository> logger)
        : base(context.UserVerifications, logger) { }

    public Task<UserVerification?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, ct);

    public async Task<List<UserVerification>> GetByUserIdAsync(string companyId, string userId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<UserVerification> fb = Builders<UserVerification>.Filter;
        FilterDefinition<UserVerification> filter = fb.And(
            fb.Eq(v => v.CompanyId, companyId),
            fb.Eq(v => v.UserId, userId)
        );

        return await _collection.Find(filter).Limit(50).ToListAsync(ct);
    }

    public Task<UserVerification> CreateAsync(UserVerification verification, CancellationToken ct = default)
        => CreateItemAsync(verification, ct);

    public Task<UserVerification> UpdateAsync(UserVerification verification, CancellationToken ct = default)
        => ReplaceItemAsync(verification, ct);
}
