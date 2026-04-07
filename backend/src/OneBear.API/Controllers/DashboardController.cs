namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.Application.Dashboard;

/// <summary>Dashboard analytics for a company.</summary>
[ApiController]
[Authorize]
[Route("api/v1/companies/{companyId}/dashboard")]
[EnableRateLimiting("api")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Get aggregated dashboard data including stats, platform distribution,
    /// message volume, response time trends, and agent performance.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDashboard(
        string companyId,
        [FromQuery] string? from = null,
        [FromQuery] string? to = null,
        CancellationToken ct = default)
    {
        DateTimeOffset fromDate = from != null
            ? DateTimeOffset.Parse(from)
            : DateTimeOffset.UtcNow.AddDays(-6);
        DateTimeOffset toDate = to != null
            ? DateTimeOffset.Parse(to)
            : DateTimeOffset.UtcNow;

        DashboardResponse result = await _dashboardService.GetDashboardAsync(companyId, fromDate, toDate, ct);
        return Ok(result);
    }
}
