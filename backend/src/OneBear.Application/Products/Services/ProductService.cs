namespace OneBear.Application.Products.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Products.DTOs;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ProductService
{
    private readonly IProductRepository _productRepo;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IProductRepository productRepo, ILogger<ProductService> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }

    public async Task<Result<ProductDto>> GetByIdAsync(string id, string companyId, CancellationToken ct)
    {
        Product? product = await _productRepo.GetByIdAsync(id, companyId, ct);
        if (product is null)
            return new Result<ProductDto>.Failure(new Error("PRODUCT_NOT_FOUND", "Product not found", ErrorType.NotFound));

        return new Result<ProductDto>.Success(MapToDto(product));
    }

    public async Task<(List<ProductDto> Items, string? ContinuationToken)> QueryAsync(
        string companyId, ProductQueryParams query, CancellationToken ct)
    {
        (List<Product> items, string? token) = await _productRepo.QueryAsync(companyId, query, ct);
        return (items.Select(MapToDto).ToList(), token);
    }

    public async Task<List<string>> GetCategoriesAsync(string companyId, CancellationToken ct)
    {
        return await _productRepo.GetDistinctCategoriesAsync(companyId, ct);
    }

    public async Task<Result<ProductDto>> CreateAsync(
        string companyId, string userId, CreateProductRequest request, CancellationToken ct)
    {
        // Validate name uniqueness
        Product? existing = await _productRepo.GetByNameAsync(companyId, request.Name, ct);
        if (existing is not null)
            return new Result<ProductDto>.Failure(new Error("PRODUCT_NAME_EXISTS", "A product with this name already exists", ErrorType.Validation));

        // Validate max 3 upsells / 3 cross-sells
        if (request.Upsells?.Count > 3)
            return new Result<ProductDto>.Failure(new Error("MAX_UPSELLS", "Maximum 3 upsells allowed", ErrorType.Validation));
        if (request.CrossSells?.Count > 3)
            return new Result<ProductDto>.Failure(new Error("MAX_CROSS_SELLS", "Maximum 3 cross-sells allowed", ErrorType.Validation));

        Product product = new()
        {
            CompanyId = companyId,
            Name = request.Name.Trim(),
            Category = request.Category,
            Description = request.Description,
            Price = request.Price,
            Stock = request.Stock,
            AllowPreOrder = request.AllowPreOrder,
            ImageUrl = request.ImageUrl,
            Images = request.Images?.Select(i => new ProductImage
            {
                Url = i.Url,
                SortOrder = i.SortOrder,
                IsPrimary = i.IsPrimary
            }).ToList() ?? new(),
            Variants = request.Variants?.Select(v => new ProductVariant
            {
                Type = v.Type,
                Value = v.Value,
                Stock = v.Stock,
                PriceAdjustment = v.PriceAdjustment
            }).ToList() ?? new(),
            Upsells = request.Upsells?.Select(u => new ProductRelationship
            {
                ProductId = u.ProductId,
                CustomPrice = u.CustomPrice,
                SortOrder = u.SortOrder
            }).ToList() ?? new(),
            CrossSells = request.CrossSells?.Select(c => new ProductRelationship
            {
                ProductId = c.ProductId,
                CustomPrice = c.CustomPrice,
                SortOrder = c.SortOrder
            }).ToList() ?? new(),
            UpsellMaxPrice = request.UpsellMaxPrice,
            CreatedBy = userId
        };

        // Resolve relationship product names
        await ResolveRelationshipNamesAsync(companyId, product, ct);

        Product created = await _productRepo.CreateAsync(product, ct);
        _logger.LogInformation("Product created: {ProductId} by {UserId}", created.Id, userId);
        return new Result<ProductDto>.Success(MapToDto(created));
    }

    public async Task<Result<ProductDto>> UpdateAsync(
        string id, string companyId, string userId, UpdateProductRequest request, CancellationToken ct)
    {
        Product? product = await _productRepo.GetByIdAsync(id, companyId, ct);
        if (product is null)
            return new Result<ProductDto>.Failure(new Error("PRODUCT_NOT_FOUND", "Product not found", ErrorType.NotFound));

        // Name uniqueness check (if name changed)
        if (request.Name is not null && request.Name != product.Name)
        {
            Product? existing = await _productRepo.GetByNameAsync(companyId, request.Name, ct);
            if (existing is not null && existing.Id != id)
                return new Result<ProductDto>.Failure(new Error("PRODUCT_NAME_EXISTS", "A product with this name already exists", ErrorType.Validation));
            product.Name = request.Name.Trim();
        }

        if (request.Upsells?.Count > 3)
            return new Result<ProductDto>.Failure(new Error("MAX_UPSELLS", "Maximum 3 upsells allowed", ErrorType.Validation));
        if (request.CrossSells?.Count > 3)
            return new Result<ProductDto>.Failure(new Error("MAX_CROSS_SELLS", "Maximum 3 cross-sells allowed", ErrorType.Validation));

        if (request.Category is not null) product.Category = request.Category;
        if (request.Description is not null) product.Description = request.Description;
        if (request.Price.HasValue) product.Price = request.Price.Value;
        if (request.Stock.HasValue) product.Stock = request.Stock.Value;
        if (request.AllowPreOrder.HasValue) product.AllowPreOrder = request.AllowPreOrder.Value;
        if (request.Status is not null) product.Status = request.Status;
        if (request.ImageUrl is not null) product.ImageUrl = request.ImageUrl;
        if (request.UpsellMaxPrice.HasValue) product.UpsellMaxPrice = request.UpsellMaxPrice.Value;

        if (request.Images is not null)
            product.Images = request.Images.Select(i => new ProductImage
            {
                Url = i.Url, SortOrder = i.SortOrder, IsPrimary = i.IsPrimary
            }).ToList();

        if (request.Variants is not null)
            product.Variants = request.Variants.Select(v => new ProductVariant
            {
                Type = v.Type, Value = v.Value, Stock = v.Stock, PriceAdjustment = v.PriceAdjustment
            }).ToList();

        if (request.Upsells is not null)
            product.Upsells = request.Upsells.Select(u => new ProductRelationship
            {
                ProductId = u.ProductId, CustomPrice = u.CustomPrice, SortOrder = u.SortOrder
            }).ToList();

        if (request.CrossSells is not null)
            product.CrossSells = request.CrossSells.Select(c => new ProductRelationship
            {
                ProductId = c.ProductId, CustomPrice = c.CustomPrice, SortOrder = c.SortOrder
            }).ToList();

        await ResolveRelationshipNamesAsync(companyId, product, ct);
        product.UpdatedBy = userId;

        Product updated = await _productRepo.UpdateAsync(product, ct);
        return new Result<ProductDto>.Success(MapToDto(updated));
    }

    public async Task<Result<bool>> DeleteAsync(string id, string companyId, CancellationToken ct)
    {
        Product? product = await _productRepo.GetByIdAsync(id, companyId, ct);
        if (product is null)
            return new Result<bool>.Failure(new Error("PRODUCT_NOT_FOUND", "Product not found", ErrorType.NotFound));

        await _productRepo.DeleteAsync(id, companyId, ct);
        return new Result<bool>.Success(true);
    }

    public async Task<CsvImportResult> ImportCsvAsync(
        string companyId, string userId, List<CsvProductRow> rows, CancellationToken ct)
    {
        int created = 0, updated = 0, skipped = 0;
        List<CsvImportError> errors = new();

        for (int i = 0; i < rows.Count; i++)
        {
            CsvProductRow row = rows[i];
            int rowNum = i + 2; // +2 for header row + 0-index

            if (string.IsNullOrWhiteSpace(row.Name))
            {
                errors.Add(new CsvImportError { Row = rowNum, Field = "Name", Message = "Name is required" });
                skipped++;
                continue;
            }

            if (row.Price <= 0)
            {
                errors.Add(new CsvImportError { Row = rowNum, Field = "Price", Message = "Price must be > 0" });
                skipped++;
                continue;
            }

            Product? existing = await _productRepo.GetByNameAsync(companyId, row.Name, ct);

            if (existing is not null)
            {
                existing.Category = row.Category ?? existing.Category;
                existing.Price = row.Price;
                existing.Stock = row.Stock;
                existing.Description = row.Description ?? existing.Description;
                existing.ImageUrl = row.ImageUrl ?? existing.ImageUrl;
                existing.UpdatedBy = userId;
                await _productRepo.UpdateAsync(existing, ct);
                updated++;
            }
            else
            {
                Product product = new()
                {
                    CompanyId = companyId,
                    Name = row.Name.Trim(),
                    Category = row.Category ?? "General",
                    Price = row.Price,
                    Stock = row.Stock,
                    Description = row.Description,
                    ImageUrl = row.ImageUrl,
                    CreatedBy = userId
                };
                await _productRepo.CreateAsync(product, ct);
                created++;
            }
        }

        _logger.LogInformation("CSV import: {Created} created, {Updated} updated, {Skipped} skipped for company {CompanyId}",
            created, updated, skipped, companyId);

        return new CsvImportResult { Created = created, Updated = updated, Skipped = skipped, Errors = errors };
    }

    private async Task ResolveRelationshipNamesAsync(string companyId, Product product, CancellationToken ct)
    {
        List<string> relatedIds = product.Upsells.Select(u => u.ProductId)
            .Concat(product.CrossSells.Select(c => c.ProductId))
            .Distinct()
            .ToList();

        if (relatedIds.Count == 0) return;

        List<Product> related = await _productRepo.GetByIdsAsync(companyId, relatedIds, ct);
        Dictionary<string, string> nameMap = related.ToDictionary(p => p.Id, p => p.Name);

        foreach (ProductRelationship rel in product.Upsells.Concat(product.CrossSells))
        {
            if (nameMap.TryGetValue(rel.ProductId, out string? name))
                rel.ProductName = name;
        }
    }

    private static ProductDto MapToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Category = p.Category,
        Description = p.Description,
        Price = p.Price,
        Stock = p.Stock,
        EffectiveStock = p.EffectiveStock,
        AllowPreOrder = p.AllowPreOrder,
        Status = p.Status,
        ImageUrl = p.ImageUrl ?? p.Images.FirstOrDefault(i => i.IsPrimary)?.Url ?? p.Images.FirstOrDefault()?.Url,
        Images = p.Images.Select(i => new ProductImageDto
        {
            Url = i.Url, SortOrder = i.SortOrder, IsPrimary = i.IsPrimary
        }).ToList(),
        Variants = p.Variants.Select(v => new ProductVariantDto
        {
            Id = v.Id, Type = v.Type, Value = v.Value, Stock = v.Stock, PriceAdjustment = v.PriceAdjustment
        }).ToList(),
        Upsells = p.Upsells.Select(u => new ProductRelationshipDto
        {
            ProductId = u.ProductId, ProductName = u.ProductName, CustomPrice = u.CustomPrice, SortOrder = u.SortOrder
        }).ToList(),
        CrossSells = p.CrossSells.Select(c => new ProductRelationshipDto
        {
            ProductId = c.ProductId, ProductName = c.ProductName, CustomPrice = c.CustomPrice, SortOrder = c.SortOrder
        }).ToList(),
        UpsellMaxPrice = p.UpsellMaxPrice,
        IsSample = p.IsSample,
        CreatedTimestamp = p.CreatedTimestamp,
        UpdatedTimestamp = p.UpdatedTimestamp
    };
}

public record CsvProductRow
{
    public string Name { get; init; } = default!;
    public string? Category { get; init; }
    public decimal Price { get; init; }
    public int? Stock { get; init; }
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
}
