namespace OneBear.Application.Customers.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Customers.DTOs;
using OneBear.Application.Customers.Mappings;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;
using System.Collections.Generic;

public class CustomerService
{
    private readonly ICustomerRepository _customerRepo;
    private readonly TagRecalculationService _tagRecalcService;
    private readonly ActivityLogService _activityLogService;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(
        ICustomerRepository customerRepo,
        TagRecalculationService tagRecalcService,
        ActivityLogService activityLogService,
        ILogger<CustomerService> logger)
    {
        _customerRepo = customerRepo;
        _tagRecalcService = tagRecalcService;
        _activityLogService = activityLogService;
        _logger = logger;
    }

    public async Task<Result<CustomerDetailDto>> GetByIdAsync(
        string companyId, string customerId, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(customer));
    }

    public async Task<(List<CustomerListDto> Items, string? ContinuationToken)> ListAsync(
        string companyId, CustomerQueryParams query, CancellationToken ct = default)
    {
        (List<Customer> items, string? continuationToken) = await _customerRepo.QueryAsync(companyId, query, ct);
        List<CustomerListDto> dtos = items.Select(CustomerMapper.ToListDto).ToList();
        return (dtos, continuationToken);
    }

    public async Task<Result<CustomerDetailDto>> CreateAsync(
        string companyId, CreateCustomerRequest request, string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return new Result<CustomerDetailDto>.Failure(
                new Error("VALIDATION_ERROR", "Customer name is required", ErrorType.Validation));

        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        Customer customer = new()
        {
            CompanyId = companyId,
            CustomerType = request.CustomerType ?? "Individual",
            Status = "Active",
            Name = request.Name.Trim(),
            Email = request.Email?.Trim(),
            Phone = request.Phone?.Trim(),
            Avatar = request.Avatar,
            IsPromoted = true,
            PromotedTimestamp = now,
            Tags =
            [
                new CustomerTag
                {
                    Name = "New",
                    IsAiAssigned = false,
                    AssignedTimestamp = now,
                    AssignedBy = userId
                }
            ],
            CreatedBy = userId,
            CreatedTimestamp = now,
            UpdatedBy = userId,
            UpdatedTimestamp = now
        };

        customer = _tagRecalcService.RecalculateTagsAsync(customer);
        Customer created = await _customerRepo.CreateAsync(customer, ct);
        _logger.LogInformation("Customer {CustomerId} created by {UserId} for company {CompanyId}",
            created.Id, userId, companyId);

        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(created));
    }

    public async Task<Result<CustomerDetailDto>> UpdateAsync(
        string companyId, string customerId, UpdateCustomerRequest request, string userId, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        if (request.Name is not null)
            customer.Name = request.Name.Trim();
        if (request.Email is not null)
            customer.Email = request.Email.Trim();
        if (request.Phone is not null)
            customer.Phone = request.Phone.Trim();
        if (request.Avatar is not null)
            customer.Avatar = request.Avatar;
        if (request.NationalId is not null)
            customer.NationalId = request.NationalId.Trim();
        if (request.TaxId is not null)
            customer.TaxId = request.TaxId.Trim();

        customer.UpdatedBy = userId;
        customer = _tagRecalcService.RecalculateTagsAsync(customer);

        Customer updated = await _customerRepo.UpdateAsync(customer, ct);
        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(updated));
    }

    public async Task<Result<bool>> DeleteAsync(
        string companyId, string customerId, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<bool>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        // Soft delete: set Status = Inactive
        customer.Status = "Inactive";
        customer.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _customerRepo.UpdateAsync(customer, ct);
        return new Result<bool>.Success(true);
    }

    public async Task<Result<CustomerDetailDto>> AddTagAsync(
        string companyId, string customerId, string tagName, string userId, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        bool alreadyHasTag = customer.Tags.Any(t => string.Equals(t.Name, tagName, StringComparison.OrdinalIgnoreCase));
        if (!alreadyHasTag)
        {
            customer.Tags.Add(new CustomerTag
            {
                Name = tagName,
                IsAiAssigned = false,
                AssignedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                AssignedBy = userId
            });
            customer.UpdatedBy = userId;
            await _customerRepo.UpdateAsync(customer, ct);
        }

        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(customer));
    }

    public async Task<Result<CustomerDetailDto>> RemoveTagAsync(
        string companyId, string customerId, string tagName, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        customer.Tags.RemoveAll(t => string.Equals(t.Name, tagName, StringComparison.OrdinalIgnoreCase));
        customer.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _customerRepo.UpdateAsync(customer, ct);
        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(customer));
    }

    public async Task<Result<CustomerDetailDto>> SetPinnedNoteAsync(
        string companyId, string customerId, string note, string userId, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        customer.PinnedNote = note;
        customer.PinnedNoteBy = userId;
        customer.PinnedNoteTimestamp = now;
        customer.UpdatedBy = userId;

        await _customerRepo.UpdateAsync(customer, ct);
        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(customer));
    }

    public async Task<Result<CustomerDetailDto>> RemovePinnedNoteAsync(
        string companyId, string customerId, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        customer.PinnedNote = null;
        customer.PinnedNoteBy = null;
        customer.PinnedNoteTimestamp = null;
        customer.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _customerRepo.UpdateAsync(customer, ct);
        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(customer));
    }

    public async Task<Result<CustomerDetailDto>> PromoteAsync(
        string companyId, string customerId, CancellationToken ct = default)
    {
        Customer? customer = await _customerRepo.GetByIdAsync(customerId, companyId, ct);
        if (customer is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Customer {customerId} not found", ErrorType.NotFound));

        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        customer.IsPromoted = true;
        customer.PromotedTimestamp = now;

        // Add "New" and "Hot" tags if not already present
        foreach (string tagName in new[] { "New", "Hot" })
        {
            if (!customer.Tags.Any(t => string.Equals(t.Name, tagName, StringComparison.OrdinalIgnoreCase)))
            {
                customer.Tags.Add(new CustomerTag
                {
                    Name = tagName,
                    IsAiAssigned = false,
                    AssignedTimestamp = now,
                    AssignedBy = "system"
                });
            }
        }

        customer.UpdatedTimestamp = now;
        customer = _tagRecalcService.RecalculateTagsAsync(customer);

        await _customerRepo.UpdateAsync(customer, ct);
        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(customer));
    }

    public async Task<CustomerSegmentCountsDto> GetSegmentCountsAsync(
        string companyId, CancellationToken ct = default)
    {
        CustomerSegmentCounts counts = await _customerRepo.GetSegmentCountsAsync(companyId, ct);
        return new CustomerSegmentCountsDto
        {
            All = counts.All,
            Hot = counts.Hot,
            Vip = counts.Vip,
            AtRisk = counts.AtRisk,
            New = counts.New,
            Cold = counts.Cold,
            Organization = counts.Organization
        };
    }

    public async Task<CustomerKpiSnapshotDto> GetKpiSnapshotAsync(
        string companyId, CancellationToken ct = default)
    {
        CustomerSegmentCounts counts = await _customerRepo.GetSegmentCountsAsync(companyId, ct);
        decimal totalLtv = await _customerRepo.GetTotalLtvAsync(companyId, ct);
        int newThisWeek = await _customerRepo.GetNewThisWeekCountAsync(companyId, ct);

        string? alertMessage = counts.AtRisk > 0
            ? $"{counts.AtRisk} VIP customers are at risk of going cold"
            : null;

        return new CustomerKpiSnapshotDto
        {
            TotalCustomers = counts.All,
            AtRiskCount = counts.AtRisk,
            HotCount = counts.Hot,
            NewThisWeek = newThisWeek,
            TotalLtv = totalLtv,
            AlertMessage = alertMessage
        };
    }

    // ─── Organization Contact Management (Phase 3) ───────────────────────────

    /// <summary>Links an Individual customer as a contact of an Organization customer.</summary>
    public async Task<Result<CustomerDetailDto>> LinkContactAsync(
        string companyId, string orgCustomerId, string contactCustomerId, string userId, CancellationToken ct = default)
    {
        Customer? org = await _customerRepo.GetByIdAsync(orgCustomerId, companyId, ct);
        if (org is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Organization {orgCustomerId} not found", ErrorType.NotFound));

        if (org.CustomerType != "Organization")
            return new Result<CustomerDetailDto>.Failure(
                new Error("VALIDATION_ERROR", $"Customer {orgCustomerId} is not an Organization", ErrorType.Validation));

        Customer? contact = await _customerRepo.GetByIdAsync(contactCustomerId, companyId, ct);
        if (contact is null)
            return new Result<CustomerDetailDto>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Contact {contactCustomerId} not found", ErrorType.NotFound));

        if (contact.CustomerType != "Individual")
            return new Result<CustomerDetailDto>.Failure(
                new Error("VALIDATION_ERROR", $"Customer {contactCustomerId} is not an Individual", ErrorType.Validation));

        contact.OrganizationId = orgCustomerId;
        contact.UpdatedBy = userId;
        contact.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _customerRepo.UpdateAsync(contact, ct);

        await _activityLogService.LogActivityAsync(
            companyId, orgCustomerId,
            type: "contact_linked",
            description: $"Contact {contact.Name} linked to organization",
            actorId: userId,
            referenceId: contactCustomerId,
            referenceType: "Customer",
            ct: ct);

        _logger.LogInformation(
            "Contact {ContactId} linked to org {OrgId} by {UserId}", contactCustomerId, orgCustomerId, userId);

        return new Result<CustomerDetailDto>.Success(CustomerMapper.ToDetailDto(org));
    }

    /// <summary>Removes an Individual customer from an Organization (sets OrganizationId = null).</summary>
    public async Task<Result<bool>> UnlinkContactAsync(
        string companyId, string orgCustomerId, string contactCustomerId, string userId, CancellationToken ct = default)
    {
        Customer? contact = await _customerRepo.GetByIdAsync(contactCustomerId, companyId, ct);
        if (contact is null)
            return new Result<bool>.Failure(
                new Error("CUSTOMER_NOT_FOUND", $"Contact {contactCustomerId} not found", ErrorType.NotFound));

        contact.OrganizationId = null;
        contact.UpdatedBy = userId;
        contact.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _customerRepo.UpdateAsync(contact, ct);

        await _activityLogService.LogActivityAsync(
            companyId, orgCustomerId,
            type: "contact_unlinked",
            description: $"Contact {contact.Name} unlinked from organization",
            actorId: userId,
            referenceId: contactCustomerId,
            referenceType: "Customer",
            ct: ct);

        _logger.LogInformation(
            "Contact {ContactId} unlinked from org {OrgId} by {UserId}", contactCustomerId, orgCustomerId, userId);

        return new Result<bool>.Success(true);
    }

    /// <summary>Returns all Individual customers linked to an Organization.</summary>
    public async Task<List<CustomerListDto>> GetContactsAsync(
        string companyId, string orgCustomerId, CancellationToken ct = default)
    {
        List<Customer> contacts = await _customerRepo.GetByOrganizationIdAsync(companyId, orgCustomerId, ct);
        return contacts.Select(CustomerMapper.ToListDto).ToList();
    }

    // ─── Activity / Messaging ─────────────────────────────────────────────────

    /// <summary>
    /// Updates LastActivityTimestamp for a customer linked to a ChatUser, then recalculates tags.
    /// Called when messages are received or sent.
    /// </summary>
    public async Task UpdateActivityAsync(
        string companyId, string chatUserId, CancellationToken ct = default)
    {
        // Find customer by linked chat user channel (chatUserId matches CustomerChannel.ChatUserId)
        CustomerQueryParams query = new() { PageSize = 1 };
        (List<Customer> items, _) = await _customerRepo.QueryAsync(companyId, query, ct);

        // We need to search by chatUserId — use a dedicated lookup
        // For now, use the generic query and filter in memory for MVP
        // TODO: Add GetByChatUserIdAsync to ICustomerRepository when needed at scale
        Customer? customer = null;
        foreach (Customer candidate in items)
        {
            if (candidate.Channels.Any(ch => ch.ChatUserId == chatUserId))
            {
                customer = candidate;
                break;
            }
        }

        if (customer is null)
        {
            _logger.LogDebug("No customer linked to ChatUser {ChatUserId} in company {CompanyId}", chatUserId, companyId);
            return;
        }

        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        customer.LastActivityTimestamp = now;
        customer = _tagRecalcService.RecalculateTagsAsync(customer);

        await _customerRepo.UpdateAsync(customer, ct);
        _logger.LogDebug("Updated activity timestamp for customer {CustomerId}", customer.Id);
    }
}
