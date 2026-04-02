namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class UserVerificationRepository : CosmosRepositoryBase<UserVerification>, IUserVerificationRepository
{
    public UserVerificationRepository(CosmosDbContext context, ILogger<UserVerificationRepository> logger)
        : base(context.UserVerifications, logger) { }

    protected override string GetEntityId(UserVerification entity) => entity.Id;

    public Task<UserVerification?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<List<UserVerification>> GetByUserIdAsync(string companyId, string userId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.userId = @userId")
            .WithParameter("@companyId", companyId)
            .WithParameter("@userId", userId);

        (List<UserVerification> items, _) = await QueryAsync<UserVerification>(
            query, new PartitionKey(companyId), 50, null, ct);
        return items;
    }

    public Task<UserVerification> CreateAsync(UserVerification verification, CancellationToken ct = default)
        => CreateItemAsync(verification, new PartitionKey(verification.CompanyId), ct);

    public Task<UserVerification> UpdateAsync(UserVerification verification, CancellationToken ct = default)
        => ReplaceItemAsync(verification, new PartitionKey(verification.CompanyId), ct);
}
