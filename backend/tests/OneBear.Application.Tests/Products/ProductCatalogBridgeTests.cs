namespace OneBear.Application.Tests.Products;

using Moq;
using OneBear.Application.Products.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class ProductCatalogBridgeTests
{
    private readonly Mock<IProductRepository> _repoMock;
    private readonly ProductCatalogBridge _sut;

    private const string CompanyId = "company-001";

    public ProductCatalogBridgeTests()
    {
        _repoMock = new Mock<IProductRepository>();
        _sut = new ProductCatalogBridge(_repoMock.Object);
    }

    [Fact]
    public async Task GetActiveProducts_ShouldReturnMappedItems()
    {
        List<Product> products = new()
        {
            new Product { Id = "p1", CompanyId = CompanyId, Name = "Shirt", Price = 199, Status = "Active", Description = "Blue" },
            new Product { Id = "p2", CompanyId = CompanyId, Name = "Pants", Price = 399, Status = "Active" },
        };

        _repoMock.Setup(r => r.QueryAsync(CompanyId, It.IsAny<ProductQueryParams>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((products, (string?)null));

        Result<List<ProductCatalogItem>> result = await _sut.GetActiveProductsAsync(CompanyId, CancellationToken.None);

        Assert.IsType<Result<List<ProductCatalogItem>>.Success>(result);
        List<ProductCatalogItem> items = ((Result<List<ProductCatalogItem>>.Success)result).Value;
        Assert.Equal(2, items.Count);
        Assert.Equal("Shirt", items[0].Name);
        Assert.Equal(199, items[0].Price);
        Assert.True(items[0].IsActive);
    }

    [Fact]
    public async Task GetProductById_ShouldReturnProduct_WhenExists()
    {
        Product product = new() { Id = "p1", CompanyId = CompanyId, Name = "Shirt", Price = 199, Status = "Active" };
        _repoMock.Setup(r => r.GetByIdAsync("p1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(product);

        Result<ProductCatalogItem> result = await _sut.GetProductByIdAsync(CompanyId, "p1", CancellationToken.None);

        Assert.IsType<Result<ProductCatalogItem>.Success>(result);
        Assert.Equal("Shirt", ((Result<ProductCatalogItem>.Success)result).Value.Name);
    }

    [Fact]
    public async Task GetProductById_ShouldReturnNotFound_WhenMissing()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        Result<ProductCatalogItem> result = await _sut.GetProductByIdAsync(CompanyId, "missing", CancellationToken.None);

        Assert.IsType<Result<ProductCatalogItem>.Failure>(result);
    }

    [Fact]
    public async Task GetActiveProducts_ShouldQueryWithActiveStatusFilter()
    {
        _repoMock.Setup(r => r.QueryAsync(CompanyId, It.IsAny<ProductQueryParams>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<Product>(), (string?)null));

        await _sut.GetActiveProductsAsync(CompanyId, CancellationToken.None);

        _repoMock.Verify(r => r.QueryAsync(CompanyId,
            It.Is<ProductQueryParams>(q => q.Status == "Active" && q.PageSize == 200),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
