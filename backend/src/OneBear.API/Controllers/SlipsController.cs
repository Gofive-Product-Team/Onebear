namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Slips.DTOs;
using OneBear.Application.Slips.Services;
using OneBear.Domain.Common;

[ApiController]
[Route("api/v1/companies/{companyId}/slips")]
[Authorize]
public class SlipsController : ControllerBase
{
    private readonly SlipVerificationManagementService _slipService;

    public SlipsController(SlipVerificationManagementService slipService)
    {
        _slipService = slipService;
    }

    /// <summary>Submit a slip for verification.</summary>
    [HttpPost]
    public async Task<IActionResult> SubmitSlip(
        string companyId,
        [FromBody] SubmitSlipRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<SlipVerificationDto> result = await _slipService.SubmitSlipAsync(companyId, userId, request, ct);
        return result.ToActionResult();
    }

    /// <summary>Get pending slips for admin review.</summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingReview(string companyId, CancellationToken ct)
    {
        List<SlipVerificationDto> slips = await _slipService.GetPendingReviewAsync(companyId, ct);
        return Ok(slips);
    }

    /// <summary>Get slip verification for an order.</summary>
    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetByOrderId(string companyId, string orderId, CancellationToken ct)
    {
        Result<SlipVerificationDto> result = await _slipService.GetByOrderIdAsync(orderId, companyId, ct);
        return result.ToActionResult();
    }

    /// <summary>Admin review: approve, reject, or request info.</summary>
    [HttpPut("{slipId}/review")]
    public async Task<IActionResult> ReviewSlip(
        string companyId,
        string slipId,
        [FromBody] ReviewSlipRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<SlipVerificationDto> result = await _slipService.ReviewSlipAsync(slipId, companyId, userId, request, ct);
        return result.ToActionResult();
    }
}
