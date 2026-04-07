namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface ICompanyRepository
{
    Task<Company?> GetByIdAsync(string id, CancellationToken ct);
    Task<Company> CreateAsync(Company company, CancellationToken ct);
    Task<Company> UpdateAsync(Company company, CancellationToken ct);
}
