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
    private readonly ActivityLogService _activityLogService;
    private readonly DuplicateDetectionService _duplicateDetectionService;

    public CustomersController(
        CustomerService customerService,
        ActivityLogService activityLogService,
        DuplicateDetectionService duplicateDetectionService)
    {
        _customerService = customerService;
        _activityLogService = activityLogService;
        _duplicateDetectionService = duplicateDetectionService;
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

    /// <summary>Get KPI snapshot (total, at-risk, hot, LTV, new this week).</summary>
    [HttpGet("kpi-snapshot")]
    public async Task<IActionResult> GetKpiSnapshot(
        string companyId,
        CancellationToken ct = default)
    {
        CustomerKpiSnapshotDto snapshot = await _customerService.GetKpiSnapshotAsync(companyId, ct);
        return Ok(snapshot);
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

    /// <summary>Get activity log for a customer (paginated).</summary>
    [HttpGet("{customerId}/activity")]
    public async Task<IActionResult> GetActivityLog(
        string companyId,
        string customerId,
        [FromQuery] string? type = null,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? continuationToken = null,
        CancellationToken ct = default)
    {
        (List<ActivityLogDto> items, string? nextToken) =
            await _activityLogService.GetByCustomerAsync(customerId, type, pageSize, continuationToken, ct);

        return Ok(new { items, continuationToken = nextToken });
    }

    // ─── Phase 4: Bulk Follow-up & Snooze ────────────────────────────────────

    /// <summary>Bulk schedule follow-up for multiple customers.</summary>
    [HttpPost("bulk-followup")]
    public async Task<IActionResult> BulkFollowup(
        string companyId,
        [FromBody] BulkFollowupRequest request,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        int count = await _customerService.BulkFollowupAsync(companyId, request, userId, ct);
        return Ok(new { count });
    }

    /// <summary>Snooze a customer for 24 hours (swipe-right action).</summary>
    [HttpPost("{customerId}/snooze")]
    public async Task<IActionResult> Snooze(
        string companyId,
        string customerId,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<CustomerDetailDto> result = await _customerService.SnoozeAsync(companyId, customerId, userId, ct);
        return result.ToActionResult();
    }

    // ─── Organization Contact Management (Phase 3) ────────────────────────────

    /// <summary>Link an existing Individual customer as a contact of this Organization.</summary>
    [HttpPost("{customerId}/contacts")]
    public async Task<IActionResult> LinkContact(
        string companyId,
        string customerId,
        [FromBody] LinkContactRequest request,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<CustomerDetailDto> result = await _customerService.LinkContactAsync(companyId, customerId, request.ContactCustomerId, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Unlink a contact from this Organization (sets OrganizationId = null on the contact).</summary>
    [HttpDelete("{customerId}/contacts/{contactId}")]
    public async Task<IActionResult> UnlinkContact(
        string companyId,
        string customerId,
        string contactId,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<bool> result = await _customerService.UnlinkContactAsync(companyId, customerId, contactId, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>List all contacts (Individuals) linked to this Organization.</summary>
    [HttpGet("{customerId}/contacts")]
    public async Task<IActionResult> GetContacts(
        string companyId,
        string customerId,
        CancellationToken ct = default)
    {
        List<CustomerListDto> contacts = await _customerService.GetContactsAsync(companyId, customerId, ct);
        return Ok(contacts);
    }

    // ─── Duplicate Detection (Phase 3) ────────────────────────────────────────

    /// <summary>
    /// Check if a customer already exists by phone, email, name (fuzzy), taxId, or nationalId.
    /// Priority: taxId → nationalId → phone → email → name.
    /// </summary>
    [HttpGet("check-duplicate")]
    public async Task<IActionResult> CheckDuplicate(
        string companyId,
        [FromQuery] string? phone = null,
        [FromQuery] string? email = null,
        [FromQuery] string? name = null,
        [FromQuery] string? taxId = null,
        [FromQuery] string? nationalId = null,
        CancellationToken ct = default)
    {
        DuplicateCheckResult result = await _duplicateDetectionService.CheckDuplicateAsync(
            companyId, phone, email, name, taxId, nationalId, ct);
        return Ok(result);
    }
}

// Request body DTOs (controller-level, small inline records)
public record AddTagRequest(string Name);
public record SetPinnedNoteRequest(string Note);
