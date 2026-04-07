namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IRoleRepository
{
    Task<List<Role>> GetByCompanyIdAsync(string companyId, CancellationToken ct);
    Task<Role?> GetByIdAsync(string id, CancellationToken ct);
    Task<Role> CreateAsync(Role role, CancellationToken ct);
    Task<Role> UpdateAsync(Role role, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}
