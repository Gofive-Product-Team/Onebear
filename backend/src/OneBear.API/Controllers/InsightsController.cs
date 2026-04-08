namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.Application.Insights.DTOs;
using OneBear.Application.Insights.Services;

[ApiController]
[Route("api/v1/companies/{companyId}/insights")]
[Authorize]
public class InsightsController : ControllerBase
{
    private readonly InsightsService _insightsService;

    public InsightsController(InsightsService insightsService) => _insightsService = insightsService;

    /// <summary>Get daily insights for a specific date (default: today).</summary>
    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyInsights(
        string companyId,
        [FromQuery] string? date = null,
        CancellationToken ct = default)
    {
        DateTimeOffset targetDate = date is not null ? DateTimeOffset.Parse(date) : DateTimeOffset.UtcNow;
        DailyInsightsResponse insights = await _insightsService.GenerateDailyInsightsAsync(companyId, targetDate, ct);
        return Ok(insights);
    }
}
