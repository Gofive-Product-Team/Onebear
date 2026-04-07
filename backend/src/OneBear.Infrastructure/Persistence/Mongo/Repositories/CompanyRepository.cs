namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class CompanyRepository : MongoRepositoryBase<Company>, ICompanyRepository
{
    public CompanyRepository(MongoDbContext context, ILogger<CompanyRepository> logger)
        : base(context.Companies, logger) { }

    public async Task<Company?> GetByIdAsync(string id, CancellationToken ct)
        => await ReadAsync(id, ct);

    public Task<Company> CreateAsync(Company company, CancellationToken ct)
        => CreateItemAsync(company, ct);

    public Task<Company> UpdateAsync(Company company, CancellationToken ct)
        => ReplaceItemAsync(company, ct);
}
