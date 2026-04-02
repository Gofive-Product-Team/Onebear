namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class IntegrationChannelRepository : IIntegrationChannelRepository
{
    private readonly CosmosDbContext _context;

    public IntegrationChannelRepository(CosmosDbContext context)
    {
        _context = context;
    }

    public Task<IntegrationChannel?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<List<IntegrationChannel>> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<IntegrationChannel?> GetByPlatformAsync(string companyId, string platform, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<IntegrationChannel> CreateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<IntegrationChannel> UpdateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task DeleteAsync(string id, string companyId, CancellationToken ct = default)
        => throw new NotImplementedException();
}
