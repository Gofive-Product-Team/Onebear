namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(List<Customer> Items, string? ContinuationToken)> QueryAsync(string companyId, CustomerQueryParams query, CancellationToken ct = default);
    Task<Customer> CreateAsync(Customer customer, CancellationToken ct = default);
    Task<Customer> UpdateAsync(Customer customer, CancellationToken ct = default);
    Task DeleteAsync(string id, string companyId, CancellationToken ct = default);
    Task<CustomerSegmentCounts> GetSegmentCountsAsync(string companyId, CancellationToken ct = default);
    Task<Customer?> GetByPhoneAsync(string companyId, string phone, CancellationToken ct = default);
    Task<Customer?> GetByEmailAsync(string companyId, string email, CancellationToken ct = default);
}
