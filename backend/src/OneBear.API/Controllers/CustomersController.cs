namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Customers.DTOs;
using OneBear.Application.Customers.Services;
using OneBear.Domain.Common;

[ApiController]
[Route("api/v1/companies/{companyId}/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly CustomerService _customerService;

    public CustomersController(CustomerService customerService)
    {
        _customerService = customerService;
    }

    /// <summary>List customers (paginated, filtered, sorted).</summary>
    [HttpGet]
    public async Task<IActionResult> ListCustomers(
        string companyId,
        [FromQuery] string? segment = null,
        [FromQuery] string? search = null,
        [FromQuery] string sort = "recent",
        [FromQuery] int pageSize = 20,
        [FromQuery] string? continuationToken = null,
        CancellationToken ct = default)
    {
        CustomerQueryParams query = new()
        {
            Segment = segment,
            Search = search,
            Sort = sort,
            PageSize = pageSize,
            ContinuationToken = continuationToken
        };

        (List<CustomerListDto> items, string? nextToken) = await _customerService.ListAsync(companyId, query, ct);

        return Ok(new { items, continuationToken = nextToken });
    }

    /// <summary>Get segment counts for filter chips.</summary>
    [HttpGet("segment-counts")]
    public async Task<IActionResult> GetSegmentCounts(
        string companyId,
        CancellationToken ct = default)
    {
        CustomerSegmentCountsDto counts = await _customerService.GetSegmentCountsAsync(companyId, ct);
        return Ok(counts);
    }

    /// <summary>Get customer detail.</summary>
    [HttpGet("{customerId}")]
    public async Task<IActionResult> GetCustomer(
        string companyId,
        string customerId,
        CancellationToken ct = default)
    {
        Result<CustomerDetailDto> result = await _customerService.GetByIdAsync(companyId, customerId, ct);
        return result.ToActionResult();
    }

    /// <summary>Create a new customer (manual).</summary>
    [HttpPost]
    public async Task<IActionResult> CreateCustomer(
        string companyId,
        [FromBody] CreateCustomerRequest request,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<CustomerDetailDto> result = await _customerService.CreateAsync(companyId, request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Update customer profile.</summary>
    [HttpPut("{customerId}")]
    public async Task<IActionResult> UpdateCustomer(
        string companyId,
        string customerId,
        [FromBody] UpdateCustomerRequest request,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<CustomerDetailDto> result = await _customerService.UpdateAsync(companyId, customerId, request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Soft delete customer (set Inactive).</summary>
    [HttpDelete("{customerId}")]
    public async Task<IActionResult> DeleteCustomer(
        string companyId,
        string customerId,
        CancellationToken ct = default)
    {
        Result<bool> result = await _customerService.DeleteAsync(companyId, customerId, ct);
        return result.ToActionResult();
    }

    /// <summary>Add a tag to a customer.</summary>
    [HttpPost("{customerId}/tags")]
    public async Task<IActionResult> AddTag(
        string companyId,
        string customerId,
        [FromBody] AddTagRequest body,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<CustomerDetailDto> result = await _customerService.AddTagAsync(companyId, customerId, body.Name, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Remove a tag from a customer.</summary>
    [HttpDelete("{customerId}/tags/{tagName}")]
    public async Task<IActionResult> RemoveTag(
        string companyId,
        string customerId,
        string tagName,
        CancellationToken ct = default)
    {
        Result<CustomerDetailDto> result = await _customerService.RemoveTagAsync(companyId, customerId, tagName, ct);
        return result.ToActionResult();
    }

    /// <summary>Set or update pinned note.</summary>
    [HttpPut("{customerId}/pinned-note")]
    public async Task<IActionResult> SetPinnedNote(
        string companyId,
        string customerId,
        [FromBody] SetPinnedNoteRequest body,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<CustomerDetailDto> result = await _customerService.SetPinnedNoteAsync(companyId, customerId, body.Note, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Remove pinned note.</summary>
    [HttpDelete("{customerId}/pinned-note")]
    public async Task<IActionResult> RemovePinnedNote(
        string companyId,
        string customerId,
        CancellationToken ct = default)
    {
        Result<CustomerDetailDto> result = await _customerService.RemovePinnedNoteAsync(companyId, customerId, ct);
        return result.ToActionResult();
    }

    /// <summary>Promote a temporary contact to a full CRM customer.</summary>
    [HttpPost("{customerId}/promote")]
    public async Task<IActionResult> Promote(
        string companyId,
        string customerId,
        CancellationToken ct = default)
    {
        Result<CustomerDetailDto> result = await _customerService.PromoteAsync(companyId, customerId, ct);
        return result.ToActionResult();
    }
}

// Request body DTOs (controller-level, small inline records)
public record AddTagRequest(string Name);
public record SetPinnedNoteRequest(string Note);
