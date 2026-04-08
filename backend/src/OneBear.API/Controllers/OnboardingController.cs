namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Onboarding.DTOs;
using OneBear.Application.Onboarding.Services;
using OneBear.Domain.Common;

[ApiController]
[Route("api/v1/companies/{companyId}/onboarding")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly OnboardingService _onboardingService;

    public OnboardingController(OnboardingService onboardingService) => _onboardingService = onboardingService;

    /// <summary>Get current onboarding state (creates new if none or expired).</summary>
    [HttpGet]
    public async Task<IActionResult> GetState(string companyId, CancellationToken ct)
    {
        string userId = User.GetUserId();
        OnboardingStateDto state = await _onboardingService.GetOrCreateAsync(companyId, userId, ct);
        return Ok(state);
    }

    /// <summary>Step 1: Connect a channel.</summary>
    [HttpPost("channels")]
    public async Task<IActionResult> ConnectChannel(string companyId, [FromBody] ConnectChannelRequest request, CancellationToken ct)
        => (await _onboardingService.ConnectChannelAsync(companyId, User.GetUserId(), request, ct)).ToActionResult();

    /// <summary>Step 1→2: Advance to AI Ready step.</summary>
    [HttpPost("advance-step2")]
    public async Task<IActionResult> AdvanceToStep2(string companyId, CancellationToken ct)
        => (await _onboardingService.AdvanceToStep2Async(companyId, User.GetUserId(), ct)).ToActionResult();

    /// <summary>Step 2→3: Save products and complete onboarding.</summary>
    [HttpPost("complete-step2")]
    public async Task<IActionResult> CompleteStep2(string companyId, [FromBody] CompleteStep2Request request, CancellationToken ct)
        => (await _onboardingService.CompleteStep2Async(companyId, User.GetUserId(), request, ct)).ToActionResult();

    /// <summary>Dismiss a tutorial popup.</summary>
    [HttpPost("dismiss-tutorial")]
    public async Task<IActionResult> DismissTutorial(string companyId, [FromBody] DismissTutorialRequest request, CancellationToken ct)
        => (await _onboardingService.DismissTutorialAsync(companyId, User.GetUserId(), request, ct)).ToActionResult();
}
