using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace OneBear.API.Auth;

/// <summary>
/// Validates that the companyId URL parameter matches the JWT company_id claim.
/// API key auth bypasses this check (service-to-service calls may target any company).
/// </summary>
public class CompanyIdValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // API key auth bypasses company validation (service-to-service calls may target any company)
        if (context.HttpContext.User.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey))
        {
            await next();
            return;
        }

        // Extract companyId from action arguments
        if (!context.ActionArguments.TryGetValue("companyId", out object? companyIdObj) ||
            companyIdObj is not string companyId)
        {
            await next(); // No companyId parameter — skip validation
            return;
        }

        // Extract company_id from JWT claims
        string? claimCompanyId = context.HttpContext.User.FindFirstValue(AuthConstants.ClaimCompanyId);

        if (string.IsNullOrEmpty(claimCompanyId) ||
            !string.Equals(companyId, claimCompanyId, StringComparison.Ordinal))
        {
            context.Result = new ForbidResult();
            return;
        }

        await next();
    }
}
