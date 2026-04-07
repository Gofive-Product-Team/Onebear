namespace OneBear.Application.Customers.Services;

using OneBear.Application.Customers.DTOs;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

/// <summary>
/// Checks for duplicate customers using priority-based field matching.
/// Priority order: taxId → nationalId → phone → email → name (fuzzy).
/// </summary>
public class DuplicateDetectionService
{
    private readonly ICustomerRepository _customerRepo;

    public DuplicateDetectionService(ICustomerRepository customerRepo)
    {
        _customerRepo = customerRepo;
    }

    public async Task<DuplicateCheckResult> CheckDuplicateAsync(
        string companyId,
        string? phone,
        string? email,
        string? name,
        string? taxId,
        string? nationalId,
        CancellationToken ct = default)
    {
        // Priority 1: TaxId (exact match)
        if (!string.IsNullOrWhiteSpace(taxId))
        {
            Customer? match = await _customerRepo.GetByTaxIdAsync(companyId, taxId.Trim(), ct);
            if (match is not null)
                return BuildResult(match, "taxId");
        }

        // Priority 2: NationalId (exact match)
        if (!string.IsNullOrWhiteSpace(nationalId))
        {
            Customer? match = await _customerRepo.GetByNationalIdAsync(companyId, nationalId.Trim(), ct);
            if (match is not null)
                return BuildResult(match, "nationalId");
        }

        // Priority 3: Phone (exact match)
        if (!string.IsNullOrWhiteSpace(phone))
        {
            Customer? match = await _customerRepo.GetByPhoneAsync(companyId, phone.Trim(), ct);
            if (match is not null)
                return BuildResult(match, "phone");
        }

        // Priority 4: Email (exact match)
        if (!string.IsNullOrWhiteSpace(email))
        {
            Customer? match = await _customerRepo.GetByEmailAsync(companyId, email.Trim(), ct);
            if (match is not null)
                return BuildResult(match, "email");
        }

        // Priority 5: Name (fuzzy — regex case-insensitive)
        if (!string.IsNullOrWhiteSpace(name))
        {
            List<Customer> nameMatches = await _customerRepo.SearchByNameFuzzyAsync(companyId, name.Trim(), limit: 5, ct);
            if (nameMatches.Count > 0)
            {
                List<DuplicateMatchDto> matches = nameMatches
                    .Select(c => ToMatchDto(c, "name"))
                    .ToList();
                return new DuplicateCheckResult { HasDuplicate = true, Matches = matches };
            }
        }

        return new DuplicateCheckResult { HasDuplicate = false };
    }

    private static DuplicateCheckResult BuildResult(Customer customer, string matchedField)
        => new()
        {
            HasDuplicate = true,
            Matches = [ToMatchDto(customer, matchedField)]
        };

    private static DuplicateMatchDto ToMatchDto(Customer customer, string matchedField)
        => new()
        {
            Id = customer.Id,
            Name = customer.Name,
            Phone = customer.Phone,
            Email = customer.Email,
            MatchedField = matchedField
        };
}
