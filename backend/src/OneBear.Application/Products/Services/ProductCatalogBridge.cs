namespace OneBear.Application.Products.Services;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

/// <summary>
/// Bridges the IProductCatalogService interface (used by AI chatbot) to the real Product repository.
/// </summary>
public class ProductCatalogBridge : IProductCatalogService
{
    private readonly IProductRepository _productRepo;

    public ProductCatalogBridge(IProductRepository productRepo)
    {
        _productRepo = productRepo;
    }

    public async Task<Result<List<ProductCatalogItem>>> GetActiveProductsAsync(string companyId, CancellationToken ct)
    {
        ProductQueryParams query = new() { Status = "Active", PageSize = 200 };
        (List<Product> items, _) = await _productRepo.QueryAsync(companyId, query, ct);

        List<ProductCatalogItem> catalogItems = items.Select(p => new ProductCatalogItem
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Price = p.Price,
            ImageUrl = p.ImageUrl ?? p.Images.FirstOrDefault(i => i.IsPrimary)?.Url ?? p.Images.FirstOrDefault()?.Url,
            IsActive = true,
        }).ToList();

        return new Result<List<ProductCatalogItem>>.Success(catalogItems);
    }

    public async Task<Result<ProductCatalogItem>> GetProductByIdAsync(string companyId, string productId, CancellationToken ct)
    {
        Product? product = await _productRepo.GetByIdAsync(productId, companyId, ct);
        if (product is null)
            return new Result<ProductCatalogItem>.Failure(
                new Error("PRODUCT_NOT_FOUND", "Product not found", ErrorType.NotFound));

        return new Result<ProductCatalogItem>.Success(new ProductCatalogItem
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            ImageUrl = product.ImageUrl ?? product.Images.FirstOrDefault(i => i.IsPrimary)?.Url,
            IsActive = product.Status == "Active",
        });
    }
}
