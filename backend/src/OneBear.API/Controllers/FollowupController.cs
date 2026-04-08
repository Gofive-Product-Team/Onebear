namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Followup.DTOs;
using OneBear.Application.Followup.Services;
using OneBear.Domain.Common;

[ApiController]
[Route("api/v1/companies/{companyId}/followup")]
[Authorize]
public class FollowupController : ControllerBase
{
    private readonly FollowupConfigurationService _configService;

    public FollowupController(FollowupConfigurationService configService)
    {
        _configService = configService;
    }

    /// <summary>Get follow-up configuration (creates default if none exists).</summary>
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig(string companyId, CancellationToken ct)
    {
        FollowupConfigDto config = await _configService.GetOrCreateDefaultAsync(companyId, ct);
        return Ok(config);
    }

    /// <summary>Update follow-up configuration (per-channel rules).</summary>
    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig(
        string companyId,
        [FromBody] UpdateFollowupConfigRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<FollowupConfigDto> result = await _configService.UpdateAsync(companyId, userId, request, ct);
        return result.ToActionResult();
    }
}
