namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Products.DTOs;
using OneBear.Application.Products.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Interfaces.Repositories;

[ApiController]
[Route("api/v1/companies/{companyId}/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;

    public ProductsController(ProductService productService)
    {
        _productService = productService;
    }

    /// <summary>List products (paginated, filtered, sorted).</summary>
    [HttpGet]
    public async Task<IActionResult> ListProducts(
        string companyId,
        [FromQuery] string? category = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sort = null,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? continuationToken = null,
        CancellationToken ct = default)
    {
        ProductQueryParams query = new()
        {
            Category = category,
            Status = status,
            Search = search,
            Sort = sort,
            PageSize = pageSize,
            ContinuationToken = continuationToken
        };

        (List<ProductDto> items, string? nextToken) = await _productService.QueryAsync(companyId, query, ct);
        return Ok(new { data = items, continuationToken = nextToken, hasMore = nextToken != null });
    }

    /// <summary>Get distinct categories for filter dropdown.</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(string companyId, CancellationToken ct)
    {
        List<string> categories = await _productService.GetCategoriesAsync(companyId, ct);
        return Ok(categories);
    }

    /// <summary>Get product by ID.</summary>
    [HttpGet("{productId}", Name = "GetProduct")]
    public async Task<IActionResult> GetProduct(string companyId, string productId, CancellationToken ct)
    {
        Result<ProductDto> result = await _productService.GetByIdAsync(productId, companyId, ct);
        return result.ToActionResult();
    }

    /// <summary>Create a new product.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateProduct(
        string companyId,
        [FromBody] CreateProductRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<ProductDto> result = await _productService.CreateAsync(companyId, userId, request, ct);
        return result.ToCreatedResult("GetProduct", new { companyId, productId = (result as Result<ProductDto>.Success)?.Value?.Id });
    }

    /// <summary>Update a product.</summary>
    [HttpPut("{productId}")]
    public async Task<IActionResult> UpdateProduct(
        string companyId,
        string productId,
        [FromBody] UpdateProductRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<ProductDto> result = await _productService.UpdateAsync(productId, companyId, userId, request, ct);
        return result.ToActionResult();
    }

    /// <summary>Delete a product.</summary>
    [HttpDelete("{productId}")]
    public async Task<IActionResult> DeleteProduct(string companyId, string productId, CancellationToken ct)
    {
        Result<bool> result = await _productService.DeleteAsync(productId, companyId, ct);
        return result switch
        {
            Result<bool>.Success => NoContent(),
            _ => result.ToActionResult()
        };
    }

    /// <summary>Import products via CSV data.</summary>
    [HttpPost("import")]
    public async Task<IActionResult> ImportCsv(
        string companyId,
        [FromBody] List<CsvProductRow> rows,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        CsvImportResult result = await _productService.ImportCsvAsync(companyId, userId, rows, ct);
        return Ok(result);
    }
}
