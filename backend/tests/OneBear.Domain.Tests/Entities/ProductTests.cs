namespace OneBear.Domain.Tests.Entities;

using OneBear.Domain.Entities;

public class ProductTests
{
    [Fact]
    public void EffectiveStock_ShouldReturnBaseStock_WhenNoVariants()
    {
        Product product = new() { Stock = 50 };

        Assert.Equal(50, product.EffectiveStock);
    }

    [Fact]
    public void EffectiveStock_ShouldReturnNull_WhenNoVariantsAndStockNull()
    {
        Product product = new() { Stock = null };

        Assert.Null(product.EffectiveStock);
    }

    [Fact]
    public void EffectiveStock_ShouldSumVariantStocks_WhenVariantsExist()
    {
        Product product = new()
        {
            Stock = 100, // base stock ignored when variants present
            Variants = new()
            {
                new ProductVariant { Type = "Size", Value = "S", Stock = 10 },
                new ProductVariant { Type = "Size", Value = "M", Stock = 20 },
                new ProductVariant { Type = "Size", Value = "L", Stock = 15 },
            }
        };

        Assert.Equal(45, product.EffectiveStock);
    }

    [Fact]
    public void EffectiveStock_ShouldReturnZero_WhenVariantsAllZeroStock()
    {
        Product product = new()
        {
            Variants = new()
            {
                new ProductVariant { Type = "Color", Value = "Red", Stock = 0 },
                new ProductVariant { Type = "Color", Value = "Blue", Stock = 0 },
            }
        };

        Assert.Equal(0, product.EffectiveStock);
    }

    [Fact]
    public void EffectiveStock_ShouldHandleNegativeStock_ForPreOrders()
    {
        Product product = new()
        {
            AllowPreOrder = true,
            Variants = new()
            {
                new ProductVariant { Type = "Size", Value = "S", Stock = -5 },
                new ProductVariant { Type = "Size", Value = "M", Stock = 10 },
            }
        };

        Assert.Equal(5, product.EffectiveStock);
    }

    [Fact]
    public void NewProduct_ShouldHaveDefaultValues()
    {
        Product product = new();

        Assert.Equal("General", product.Category);
        Assert.Equal("Active", product.Status);
        Assert.False(product.AllowPreOrder);
        Assert.False(product.IsSample);
        Assert.Empty(product.Variants);
        Assert.Empty(product.Upsells);
        Assert.Empty(product.CrossSells);
        Assert.Empty(product.Images);
        Assert.NotNull(product.Id);
    }
}
