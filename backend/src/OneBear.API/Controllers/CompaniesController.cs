using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}")]
[Authorize]
[EnableRateLimiting("api")]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyFeatureSettingsRepository _featureSettingsRepo;
    private readonly ICompanyRepository _companyRepo;

    public CompaniesController(
        ICompanyFeatureSettingsRepository featureSettingsRepo,
        ICompanyRepository companyRepo)
    {
        _featureSettingsRepo = featureSettingsRepo;
        _companyRepo = companyRepo;
    }

    /// <summary>Get company profile.</summary>
    [HttpGet("profile")]
    [Authorize(Policy = AuthConstants.PolicySettingsView)]
    public async Task<IActionResult> GetCompany(string companyId, CancellationToken ct)
    {
        Company? company = await _companyRepo.GetByIdAsync(companyId, ct);
        if (company is null)
            return NotFound();
        return Ok(company);
    }

    /// <summary>Update company profile.</summary>
    [HttpPut("profile")]
    [Authorize(Policy = AuthConstants.PolicySettingsManage)]
    public async Task<IActionResult> UpdateCompany(string companyId, [FromBody] UpdateCompanyRequest request, CancellationToken ct)
    {
        Company? company = await _companyRepo.GetByIdAsync(companyId, ct);
        if (company is null)
            return NotFound();

        if (request.Name is not null) company.Name = request.Name;
        if (request.Logo is not null) company.Logo = request.Logo;
        if (request.Address is not null) company.Address = request.Address;
        if (request.TaxId is not null) company.TaxId = request.TaxId;
        if (request.Phone is not null) company.Phone = request.Phone;
        if (request.Website is not null) company.Website = request.Website;
        company.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _companyRepo.UpdateAsync(company, ct);
        return Ok(company);
    }

    /// <summary>Get feature settings for a company.</summary>
    [HttpGet("feature-settings")]
    public async Task<IActionResult> GetFeatureSettings(string companyId, CancellationToken ct)
    {
        CompanyFeatureSettings? settings = await _featureSettingsRepo.GetByCompanyIdAsync(companyId, ct);
        if (settings is null)
        {
            return Ok(new
            {
                companyId,
                features = new Dictionary<string, bool>(),
                settings = new Dictionary<string, string>()
            });
        }

        return Ok(new
        {
            companyId = settings.CompanyId,
            features = settings.Features,
            settings = settings.Settings,
            updatedTimestamp = settings.UpdatedTimestamp
        });
    }

    /// <summary>Update feature settings for a company.</summary>
    [HttpPut("feature-settings")]
    public async Task<IActionResult> UpdateFeatureSettings(
        string companyId,
        [FromBody] UpdateFeatureSettingsRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        CompanyFeatureSettings? existing = await _featureSettingsRepo.GetByCompanyIdAsync(companyId, ct);

        CompanyFeatureSettings settings = existing ?? new CompanyFeatureSettings
        {
            Id = Guid.NewGuid().ToString(),
            CompanyId = companyId
        };

        if (request.Features is not null)
            settings.Features = request.Features;
        if (request.Settings is not null)
            settings.Settings = request.Settings;

        settings.UpdatedBy = userId;
        settings.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _featureSettingsRepo.UpsertAsync(settings, ct);

        return Ok(new
        {
            companyId = settings.CompanyId,
            features = settings.Features,
            settings = settings.Settings,
            updatedTimestamp = settings.UpdatedTimestamp
        });
    }

    /// <summary>Update SLA escalation thresholds for a company.</summary>
    [HttpPut("settings/sla")]
    public async Task<IActionResult> UpdateSlaSettings(
        string companyId,
        [FromBody] UpdateSlaSettingsRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        CompanyFeatureSettings? existing = await _featureSettingsRepo.GetByCompanyIdAsync(companyId, ct);

        CompanyFeatureSettings settings = existing ?? new CompanyFeatureSettings
        {
            Id = Guid.NewGuid().ToString(),
            CompanyId = companyId
        };

        if (request.Level1Minutes.HasValue)
            settings.SlaLevel1Minutes = request.Level1Minutes.Value;
        if (request.Level2Minutes.HasValue)
            settings.SlaLevel2Minutes = request.Level2Minutes.Value;
        if (request.Level3Minutes.HasValue)
            settings.SlaLevel3Minutes = request.Level3Minutes.Value;

        settings.UpdatedBy = userId;
        settings.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _featureSettingsRepo.UpsertAsync(settings, ct);

        return Ok(new
        {
            companyId = settings.CompanyId,
            slaLevel1Minutes = settings.SlaLevel1Minutes,
            slaLevel2Minutes = settings.SlaLevel2Minutes,
            slaLevel3Minutes = settings.SlaLevel3Minutes,
            updatedTimestamp = settings.UpdatedTimestamp
        });
    }
}

public record UpdateFeatureSettingsRequest
{
    public Dictionary<string, bool>? Features { get; init; }
    public Dictionary<string, string>? Settings { get; init; }
}

public record UpdateSlaSettingsRequest
{
    public int? Level1Minutes { get; init; }
    public int? Level2Minutes { get; init; }
    public int? Level3Minutes { get; init; }
}

public record UpdateCompanyRequest(
    string? Name,
    string? Logo,
    string? Address,
    string? TaxId,
    string? Phone,
    string? Website);
