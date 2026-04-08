namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

public class Product : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("category")]
    public string Category { get; set; } = "General";

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("stock")]
    public int? Stock { get; set; } // null = unlimited

    [JsonPropertyName("allowPreOrder")]
    public bool AllowPreOrder { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Active"; // "Active" | "Inactive"

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("images")]
    public List<ProductImage> Images { get; set; } = new();

    [JsonPropertyName("variants")]
    public List<ProductVariant> Variants { get; set; } = new();

    [JsonPropertyName("upsells")]
    public List<ProductRelationship> Upsells { get; set; } = new();

    [JsonPropertyName("crossSells")]
    public List<ProductRelationship> CrossSells { get; set; } = new();

    [JsonPropertyName("upsellMaxPrice")]
    public decimal? UpsellMaxPrice { get; set; }

    [JsonPropertyName("isSample")]
    public bool IsSample { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    /// <summary>
    /// Total stock across all variants, or the base stock if no variants.
    /// </summary>
    public int? EffectiveStock => Variants.Count > 0
        ? Variants.Sum(v => v.Stock)
        : Stock;
}

public class ProductImage
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;

    [JsonPropertyName("sortOrder")]
    public int SortOrder { get; set; }

    [JsonPropertyName("isPrimary")]
    public bool IsPrimary { get; set; }
}

public class ProductVariant
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("type")]
    public string Type { get; set; } = default!; // e.g., "Size", "Color"

    [JsonPropertyName("value")]
    public string Value { get; set; } = default!; // e.g., "Small", "Red"

    [JsonPropertyName("stock")]
    public int Stock { get; set; }

    [JsonPropertyName("priceAdjustment")]
    public decimal PriceAdjustment { get; set; } // +/- from base price
}

public class ProductRelationship
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = default!;

    [JsonPropertyName("productName")]
    public string? ProductName { get; set; }

    [JsonPropertyName("customPrice")]
    public decimal? CustomPrice { get; set; } // null = use product's base price

    [JsonPropertyName("sortOrder")]
    public int SortOrder { get; set; }
}
