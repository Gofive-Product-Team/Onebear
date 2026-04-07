namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class RoleRepository : MongoRepositoryBase<Role>, IRoleRepository
{
    public RoleRepository(MongoDbContext context, ILogger<RoleRepository> logger)
        : base(context.Roles, logger) { }

    public async Task<List<Role>> GetByCompanyIdAsync(string companyId, CancellationToken ct)
    {
        FilterDefinition<Role> filter = Builders<Role>.Filter.Eq(r => r.CompanyId, companyId);
        return await _collection.Find(filter).ToListAsync(ct);
    }

    public async Task<Role?> GetByIdAsync(string id, CancellationToken ct)
        => await ReadAsync(id, ct);

    public Task<Role> CreateAsync(Role role, CancellationToken ct)
        => CreateItemAsync(role, ct);

    public Task<Role> UpdateAsync(Role role, CancellationToken ct)
        => ReplaceItemAsync(role, ct);

    public Task DeleteAsync(string id, CancellationToken ct)
        => DeleteItemAsync(id, ct);
}
