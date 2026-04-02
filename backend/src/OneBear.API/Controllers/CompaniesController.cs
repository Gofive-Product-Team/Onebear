using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}")]
[Authorize]
[EnableRateLimiting("api")]
public class CompaniesController : ControllerBase
{
    /// <summary>Get feature settings for a company.</summary>
    [HttpGet("feature-settings")]
    public IActionResult GetFeatureSettings(string companyId)
    {
        return Ok(new
        {
            companyId,
            chatbot = new { enabled = false },
            autoAssignment = new { enabled = false },
            commentAutoReply = new { enabled = false },
            satisfaction = new { enabled = false },
            multipleAgents = new { enabled = true },
            maxIntegrations = 5
        });
    }

    /// <summary>Update feature settings for a company.</summary>
    [HttpPut("feature-settings")]
    public IActionResult UpdateFeatureSettings(string companyId)
    {
        return Ok(new
        {
            companyId,
            chatbot = new { enabled = false },
            autoAssignment = new { enabled = false },
            commentAutoReply = new { enabled = false },
            satisfaction = new { enabled = false },
            multipleAgents = new { enabled = true },
            maxIntegrations = 5,
            updatedAt = DateTimeOffset.UtcNow
        });
    }
}
