using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace OneBear.API.Auth;

/// <summary>
/// Validates that the companyId in the URL path matches the company_id claim in the JWT.
/// Users with Chat.Admin (3005) permission bypass this check.
/// </summary>
public class CompanyIdValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.RouteData.Values.TryGetValue("companyId", out object? companyIdObj))
            return; // No companyId in route -- skip

        string? routeCompanyId = companyIdObj?.ToString();
        if (string.IsNullOrEmpty(routeCompanyId))
            return;

        ClaimsPrincipal user = context.HttpContext.User;
        if (!user.Identity?.IsAuthenticated ?? true)
            return; // Let auth middleware handle unauthenticated

        // API key auth doesn't have company_id -- skip
        if (user.FindFirst(ClaimTypes.AuthenticationMethod)?.Value == "ApiKey")
            return;

        string? claimCompanyId = user.FindFirst("company_id")?.Value;
        if (string.IsNullOrEmpty(claimCompanyId))
        {
            context.Result = new ForbidResult();
            return;
        }

        if (!string.Equals(routeCompanyId, claimCompanyId, StringComparison.OrdinalIgnoreCase))
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = 403,
                Title = "Forbidden",
                Detail = "CompanyId in URL does not match your token."
            })
            {
                StatusCode = 403
            };
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
