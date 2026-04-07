using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class CompanyIdValidationFilterTests
{
    private readonly CompanyIdValidationFilter _filter = new();

    private static ActionExecutingContext CreateContext(
        string? companyIdArgValue,
        ClaimsPrincipal? user = null)
    {
        DefaultHttpContext httpContext = new();
        if (user != null)
        {
            httpContext.User = user;
        }

        RouteData routeData = new();
        ActionContext actionContext = new(httpContext, routeData, new ActionDescriptor());

        Dictionary<string, object?> arguments = new();
        if (companyIdArgValue != null)
        {
            arguments["companyId"] = companyIdArgValue;
        }

        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            arguments,
            new object());
    }

    private static ClaimsPrincipal CreateJwtUser(string? companyId)
    {
        List<Claim> claims = [];
        if (companyId != null)
        {
            claims.Add(new Claim(AuthConstants.ClaimCompanyId, companyId));
        }
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    private static ClaimsPrincipal CreateApiKeyUser()
    {
        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    [Fact]
    public async Task ShouldPass_WhenCompanyIdMatchesClaim()
    {
        ClaimsPrincipal user = CreateJwtUser("company-001");
        ActionExecutingContext context = CreateContext("company-001", user);

        await _filter.OnActionExecutionAsync(context, () => Task.FromResult(new ActionExecutedContext(
            new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
            new List<IFilterMetadata>(), new object())));

        Assert.Null(context.Result);
    }

    [Fact]
    public async Task ShouldReturn403_WhenCompanyIdMismatch()
    {
        ClaimsPrincipal user = CreateJwtUser("company-001");
        ActionExecutingContext context = CreateContext("company-999", user);

        await _filter.OnActionExecutionAsync(context, () => Task.FromResult(new ActionExecutedContext(
            new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
            new List<IFilterMetadata>(), new object())));

        Assert.NotNull(context.Result);
        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public async Task ShouldReturn403_WhenMissingCompanyIdClaim()
    {
        ClaimsPrincipal user = CreateJwtUser(null);
        ActionExecutingContext context = CreateContext("company-001", user);

        await _filter.OnActionExecutionAsync(context, () => Task.FromResult(new ActionExecutedContext(
            new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
            new List<IFilterMetadata>(), new object())));

        Assert.NotNull(context.Result);
        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public async Task ShouldBypass_WhenApiKeyAuth()
    {
        bool nextCalled = false;
        ClaimsPrincipal user = CreateApiKeyUser();
        ActionExecutingContext context = CreateContext("any-company", user);

        await _filter.OnActionExecutionAsync(context, () =>
        {
            nextCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
                new List<IFilterMetadata>(), new object()));
        });

        Assert.Null(context.Result);
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldPass_WhenNoCompanyIdInArguments()
    {
        bool nextCalled = false;
        ClaimsPrincipal user = CreateJwtUser("company-001");
        ActionExecutingContext context = CreateContext(null, user);

        await _filter.OnActionExecutionAsync(context, () =>
        {
            nextCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                new ActionContext(context.HttpContext, context.RouteData, context.ActionDescriptor),
                new List<IFilterMetadata>(), new object()));
        });

        Assert.Null(context.Result);
        Assert.True(nextCalled);
    }
}
