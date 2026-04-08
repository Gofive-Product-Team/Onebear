namespace OneBear.Application.Products.DTOs;

using OneBear.Domain.Entities;

public record ProductDto
{
    public string Id { get; init; } = default!;
    public string Name { get; init; } = default!;
    public string Category { get; init; } = default!;
    public string? Description { get; init; }
    public decimal Price { get; init; }
    public int? Stock { get; init; }
    public int? EffectiveStock { get; init; }
    public bool AllowPreOrder { get; init; }
    public string Status { get; init; } = default!;
    public string? ImageUrl { get; init; }
    public List<ProductImageDto> Images { get; init; } = new();
    public List<ProductVariantDto> Variants { get; init; } = new();
    public List<ProductRelationshipDto> Upsells { get; init; } = new();
    public List<ProductRelationshipDto> CrossSells { get; init; } = new();
    public decimal? UpsellMaxPrice { get; init; }
    public bool IsSample { get; init; }
    public long CreatedTimestamp { get; init; }
    public long? UpdatedTimestamp { get; init; }
}

public record ProductImageDto
{
    public string Url { get; init; } = default!;
    public int SortOrder { get; init; }
    public bool IsPrimary { get; init; }
}

public record ProductVariantDto
{
    public string Id { get; init; } = default!;
    public string Type { get; init; } = default!;
    public string Value { get; init; } = default!;
    public int Stock { get; init; }
    public decimal PriceAdjustment { get; init; }
}

public record ProductRelationshipDto
{
    public string ProductId { get; init; } = default!;
    public string? ProductName { get; init; }
    public decimal? CustomPrice { get; init; }
    public int SortOrder { get; init; }
}

public record CreateProductRequest
{
    public string Name { get; init; } = default!;
    public string Category { get; init; } = "General";
    public string? Description { get; init; }
    public decimal Price { get; init; }
    public int? Stock { get; init; }
    public bool AllowPreOrder { get; init; }
    public string? ImageUrl { get; init; }
    public List<ProductImageDto>? Images { get; init; }
    public List<CreateVariantRequest>? Variants { get; init; }
    public List<CreateRelationshipRequest>? Upsells { get; init; }
    public List<CreateRelationshipRequest>? CrossSells { get; init; }
    public decimal? UpsellMaxPrice { get; init; }
}

public record UpdateProductRequest
{
    public string? Name { get; init; }
    public string? Category { get; init; }
    public string? Description { get; init; }
    public decimal? Price { get; init; }
    public int? Stock { get; init; }
    public bool? AllowPreOrder { get; init; }
    public string? Status { get; init; }
    public string? ImageUrl { get; init; }
    public List<ProductImageDto>? Images { get; init; }
    public List<CreateVariantRequest>? Variants { get; init; }
    public List<CreateRelationshipRequest>? Upsells { get; init; }
    public List<CreateRelationshipRequest>? CrossSells { get; init; }
    public decimal? UpsellMaxPrice { get; init; }
}

public record CreateVariantRequest
{
    public string Type { get; init; } = default!;
    public string Value { get; init; } = default!;
    public int Stock { get; init; }
    public decimal PriceAdjustment { get; init; }
}

public record CreateRelationshipRequest
{
    public string ProductId { get; init; } = default!;
    public decimal? CustomPrice { get; init; }
    public int SortOrder { get; init; }
}

public record CsvImportResult
{
    public int Created { get; init; }
    public int Updated { get; init; }
    public int Skipped { get; init; }
    public List<CsvImportError> Errors { get; init; } = new();
}

public record CsvImportError
{
    public int Row { get; init; }
    public string Field { get; init; } = default!;
    public string Message { get; init; } = default!;
}
