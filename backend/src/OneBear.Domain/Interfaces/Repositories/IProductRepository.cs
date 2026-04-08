namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(List<Product> Items, string? ContinuationToken)> QueryAsync(string companyId, ProductQueryParams query, CancellationToken ct = default);
    Task<Product> CreateAsync(Product product, CancellationToken ct = default);
    Task<Product> UpdateAsync(Product product, CancellationToken ct = default);
    Task DeleteAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<Product>> GetByCategoryAsync(string companyId, string category, CancellationToken ct = default);
    Task<List<string>> GetDistinctCategoriesAsync(string companyId, CancellationToken ct = default);
    Task<Product?> GetByNameAsync(string companyId, string name, CancellationToken ct = default);
    Task<List<Product>> GetByIdsAsync(string companyId, List<string> ids, CancellationToken ct = default);
    Task<int> GetCountAsync(string companyId, CancellationToken ct = default);
    Task CreateManyAsync(List<Product> products, CancellationToken ct = default);
}

public class ProductQueryParams
{
    public string? Category { get; set; }
    public string? Status { get; set; } // "Active" | "Inactive"
    public string? Search { get; set; }
    public string? Sort { get; set; } // "name", "price", "stock", "newest"
    public int PageSize { get; set; } = 20;
    public string? ContinuationToken { get; set; }
}
