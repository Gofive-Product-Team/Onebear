namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Common;

public interface IProductCatalogService
{
    Task<Result<List<ProductCatalogItem>>> GetActiveProductsAsync(string companyId, CancellationToken ct);
    Task<Result<ProductCatalogItem>> GetProductByIdAsync(string companyId, string productId, CancellationToken ct);
}

public class ProductCatalogItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}
