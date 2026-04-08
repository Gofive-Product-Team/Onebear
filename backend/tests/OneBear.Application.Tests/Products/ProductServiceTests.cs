namespace OneBear.Application.Tests.Products;

using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Products.DTOs;
using OneBear.Application.Products.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ProductServiceTests
{
    private readonly Mock<IProductRepository> _repoMock;
    private readonly Mock<ILogger<ProductService>> _loggerMock;
    private readonly ProductService _sut;

    private const string CompanyId = "company-001";
    private const string UserId = "user-001";

    public ProductServiceTests()
    {
        _repoMock = new Mock<IProductRepository>();
        _loggerMock = new Mock<ILogger<ProductService>>();

        _repoMock.Setup(r => r.CreateAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product p, CancellationToken _) => p);

        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product p, CancellationToken _) => p);

        _repoMock.Setup(r => r.GetByIdsAsync(CompanyId, It.IsAny<List<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product>());

        _sut = new ProductService(_repoMock.Object, _loggerMock.Object);
    }

    // ─── GetById ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ShouldReturnProduct_WhenExists()
    {
        Product product = CreateProduct("prod-1", "T-Shirt", 199);
        _repoMock.Setup(r => r.GetByIdAsync("prod-1", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        Result<ProductDto> result = await _sut.GetByIdAsync("prod-1", CompanyId, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Success>(result);
        Result<ProductDto>.Success success = (Result<ProductDto>.Success)result;
        Assert.Equal("T-Shirt", success.Value.Name);
        Assert.Equal(199, success.Value.Price);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync("nonexistent", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        Result<ProductDto> result = await _sut.GetByIdAsync("nonexistent", CompanyId, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Failure>(result);
        Result<ProductDto>.Failure failure = (Result<ProductDto>.Failure)result;
        Assert.Equal("PRODUCT_NOT_FOUND", failure.Error.Code);
        Assert.Equal(ErrorType.NotFound, failure.Error.Type);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldSucceed_WhenNameIsUnique()
    {
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, "New Product", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        CreateProductRequest request = new()
        {
            Name = "New Product",
            Category = "Electronics",
            Price = 999
        };

        Result<ProductDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Success>(result);
        Result<ProductDto>.Success success = (Result<ProductDto>.Success)result;
        Assert.Equal("New Product", success.Value.Name);
        Assert.Equal("Electronics", success.Value.Category);
        Assert.Equal(999, success.Value.Price);
        _repoMock.Verify(r => r.CreateAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Create_ShouldFail_WhenNameAlreadyExists()
    {
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, "Existing", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateProduct("existing-id", "Existing", 100));

        CreateProductRequest request = new() { Name = "Existing", Price = 200 };

        Result<ProductDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Failure>(result);
        Result<ProductDto>.Failure failure = (Result<ProductDto>.Failure)result;
        Assert.Equal("PRODUCT_NAME_EXISTS", failure.Error.Code);
        Assert.Equal(ErrorType.Validation, failure.Error.Type);
        _repoMock.Verify(r => r.CreateAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Create_ShouldFail_WhenMoreThan3Upsells()
    {
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        CreateProductRequest request = new()
        {
            Name = "Test",
            Price = 100,
            Upsells = new()
            {
                new() { ProductId = "a", SortOrder = 0 },
                new() { ProductId = "b", SortOrder = 1 },
                new() { ProductId = "c", SortOrder = 2 },
                new() { ProductId = "d", SortOrder = 3 }, // 4th = over limit
            }
        };

        Result<ProductDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Failure>(result);
        Result<ProductDto>.Failure failure = (Result<ProductDto>.Failure)result;
        Assert.Equal("MAX_UPSELLS", failure.Error.Code);
    }

    [Fact]
    public async Task Create_ShouldFail_WhenMoreThan3CrossSells()
    {
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        CreateProductRequest request = new()
        {
            Name = "Test",
            Price = 100,
            CrossSells = new()
            {
                new() { ProductId = "a" },
                new() { ProductId = "b" },
                new() { ProductId = "c" },
                new() { ProductId = "d" },
            }
        };

        Result<ProductDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Failure>(result);
        Assert.Equal("MAX_CROSS_SELLS", ((Result<ProductDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task Create_ShouldAllowExactly3Upsells()
    {
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        CreateProductRequest request = new()
        {
            Name = "Test",
            Price = 100,
            Upsells = new()
            {
                new() { ProductId = "a" },
                new() { ProductId = "b" },
                new() { ProductId = "c" },
            }
        };

        Result<ProductDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Success>(result);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ShouldSucceed_WhenProductExists()
    {
        Product product = CreateProduct("prod-1", "Old Name", 100);
        _repoMock.Setup(r => r.GetByIdAsync("prod-1", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, "New Name", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        UpdateProductRequest request = new() { Name = "New Name", Price = 299 };

        Result<ProductDto> result = await _sut.UpdateAsync("prod-1", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Success>(result);
        Result<ProductDto>.Success success = (Result<ProductDto>.Success)result;
        Assert.Equal("New Name", success.Value.Name);
        Assert.Equal(299, success.Value.Price);
    }

    [Fact]
    public async Task Update_ShouldFail_WhenNewNameConflictsWithAnotherProduct()
    {
        Product product = CreateProduct("prod-1", "My Product", 100);
        Product conflicting = CreateProduct("prod-2", "Taken Name", 200);

        _repoMock.Setup(r => r.GetByIdAsync("prod-1", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, "Taken Name", It.IsAny<CancellationToken>()))
            .ReturnsAsync(conflicting);

        UpdateProductRequest request = new() { Name = "Taken Name" };

        Result<ProductDto> result = await _sut.UpdateAsync("prod-1", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Failure>(result);
        Assert.Equal("PRODUCT_NAME_EXISTS", ((Result<ProductDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task Update_ShouldAllowSameName_WhenNameUnchanged()
    {
        Product product = CreateProduct("prod-1", "Same Name", 100);
        _repoMock.Setup(r => r.GetByIdAsync("prod-1", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        // Name unchanged — should not trigger uniqueness check
        UpdateProductRequest request = new() { Price = 150 };

        Result<ProductDto> result = await _sut.UpdateAsync("prod-1", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Success>(result);
        _repoMock.Verify(r => r.GetByNameAsync(CompanyId, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Update_ShouldReturnNotFound_WhenProductMissing()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        UpdateProductRequest request = new() { Name = "Whatever" };

        Result<ProductDto> result = await _sut.UpdateAsync("missing", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<ProductDto>.Failure>(result);
        Assert.Equal("PRODUCT_NOT_FOUND", ((Result<ProductDto>.Failure)result).Error.Code);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ShouldSucceed_WhenProductExists()
    {
        Product product = CreateProduct("prod-1", "To Delete", 100);
        _repoMock.Setup(r => r.GetByIdAsync("prod-1", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        Result<bool> result = await _sut.DeleteAsync("prod-1", CompanyId, CancellationToken.None);

        Assert.IsType<Result<bool>.Success>(result);
        _repoMock.Verify(r => r.DeleteAsync("prod-1", CompanyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenProductMissing()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        Result<bool> result = await _sut.DeleteAsync("missing", CompanyId, CancellationToken.None);

        Assert.IsType<Result<bool>.Failure>(result);
        Assert.Equal("PRODUCT_NOT_FOUND", ((Result<bool>.Failure)result).Error.Code);
    }

    // ─── CSV Import ───────────────────────────────────────────────────────────

    [Fact]
    public async Task ImportCsv_ShouldCreateNewProducts_WhenNameNotExists()
    {
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        List<CsvProductRow> rows = new()
        {
            new() { Name = "Product A", Price = 100, Category = "Food" },
            new() { Name = "Product B", Price = 200, Category = "Drink" },
        };

        CsvImportResult result = await _sut.ImportCsvAsync(CompanyId, UserId, rows, CancellationToken.None);

        Assert.Equal(2, result.Created);
        Assert.Equal(0, result.Updated);
        Assert.Equal(0, result.Skipped);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public async Task ImportCsv_ShouldUpdateExisting_WhenNameMatches()
    {
        Product existing = CreateProduct("prod-1", "Product A", 100);
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, "Product A", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, "Product B", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        List<CsvProductRow> rows = new()
        {
            new() { Name = "Product A", Price = 150 },
            new() { Name = "Product B", Price = 200 },
        };

        CsvImportResult result = await _sut.ImportCsvAsync(CompanyId, UserId, rows, CancellationToken.None);

        Assert.Equal(1, result.Created);
        Assert.Equal(1, result.Updated);
    }

    [Fact]
    public async Task ImportCsv_ShouldSkipInvalidRows()
    {
        _repoMock.Setup(r => r.GetByNameAsync(CompanyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        List<CsvProductRow> rows = new()
        {
            new() { Name = "", Price = 100 },     // empty name
            new() { Name = "Good", Price = 0 },    // zero price
            new() { Name = "OK", Price = 50 },     // valid
        };

        CsvImportResult result = await _sut.ImportCsvAsync(CompanyId, UserId, rows, CancellationToken.None);

        Assert.Equal(1, result.Created);
        Assert.Equal(2, result.Skipped);
        Assert.Equal(2, result.Errors.Count);
        Assert.Contains(result.Errors, e => e.Field == "Name");
        Assert.Contains(result.Errors, e => e.Field == "Price");
    }

    // ─── Query ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Query_ShouldReturnMappedDtos()
    {
        List<Product> products = new()
        {
            CreateProduct("p1", "Product 1", 100),
            CreateProduct("p2", "Product 2", 200),
        };

        _repoMock.Setup(r => r.QueryAsync(CompanyId, It.IsAny<ProductQueryParams>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((products, "20"));

        ProductQueryParams query = new() { PageSize = 20 };
        (List<ProductDto> items, string? token) = await _sut.QueryAsync(CompanyId, query, CancellationToken.None);

        Assert.Equal(2, items.Count);
        Assert.Equal("Product 1", items[0].Name);
        Assert.Equal("Product 2", items[1].Name);
        Assert.Equal("20", token);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static Product CreateProduct(string id, string name, decimal price)
    {
        return new Product
        {
            Id = id,
            CompanyId = CompanyId,
            Name = name,
            Price = price,
            Category = "General",
            Status = "Active",
            CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };
    }
}
