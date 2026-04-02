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

    public CompaniesController(ICompanyFeatureSettingsRepository featureSettingsRepo)
    {
        _featureSettingsRepo = featureSettingsRepo;
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
}

public record UpdateFeatureSettingsRequest
{
    public Dictionary<string, bool>? Features { get; init; }
    public Dictionary<string, string>? Settings { get; init; }
}
