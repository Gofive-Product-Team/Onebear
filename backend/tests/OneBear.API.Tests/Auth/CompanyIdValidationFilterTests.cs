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
        string? routeCompanyId,
        ClaimsPrincipal? user = null)
    {
        var httpContext = new DefaultHttpContext();
        if (user != null)
        {
            httpContext.User = user;
        }

        var routeData = new RouteData();
        if (routeCompanyId != null)
        {
            routeData.Values["companyId"] = routeCompanyId;
        }

        var actionContext = new ActionContext(httpContext, routeData, new ActionDescriptor());
        var context = new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new object());

        return context;
    }

    private static ClaimsPrincipal CreateUser(string? companyId, string authMethod = "Bearer")
    {
        var claims = new List<Claim>();
        if (companyId != null)
        {
            claims.Add(new Claim("company_id", companyId));
        }
        if (authMethod == "ApiKey")
        {
            claims.Add(new Claim(ClaimTypes.AuthenticationMethod, "ApiKey"));
        }
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    [Fact]
    public void OnActionExecuting_ShouldPass_WhenCompanyIdMatches()
    {
        // Arrange
        ClaimsPrincipal user = CreateUser("company-001");
        ActionExecutingContext context = CreateContext("company-001", user);

        // Act
        _filter.OnActionExecuting(context);

        // Assert
        Assert.Null(context.Result); // No result = pass
    }

    [Fact]
    public void OnActionExecuting_ShouldReturn403_WhenCompanyIdMismatch()
    {
        // Arrange
        ClaimsPrincipal user = CreateUser("company-001");
        ActionExecutingContext context = CreateContext("company-999", user);

        // Act
        _filter.OnActionExecuting(context);

        // Assert
        Assert.NotNull(context.Result);
        ObjectResult objectResult = Assert.IsType<ObjectResult>(context.Result);
        Assert.Equal(403, objectResult.StatusCode);
    }

    [Fact]
    public void OnActionExecuting_ShouldSkip_WhenNoCompanyIdInRoute()
    {
        // Arrange
        ClaimsPrincipal user = CreateUser("company-001");
        ActionExecutingContext context = CreateContext(null, user);

        // Act
        _filter.OnActionExecuting(context);

        // Assert
        Assert.Null(context.Result);
    }

    [Fact]
    public void OnActionExecuting_ShouldSkip_WhenApiKeyAuth()
    {
        // Arrange
        ClaimsPrincipal user = CreateUser(null, "ApiKey");
        ActionExecutingContext context = CreateContext("any-company", user);

        // Act
        _filter.OnActionExecuting(context);

        // Assert
        Assert.Null(context.Result);
    }

    [Fact]
    public void OnActionExecuting_ShouldReturnForbid_WhenNoCompanyIdClaim()
    {
        // Arrange
        ClaimsPrincipal user = CreateUser(null);
        ActionExecutingContext context = CreateContext("company-001", user);

        // Act
        _filter.OnActionExecuting(context);

        // Assert
        Assert.NotNull(context.Result);
        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnActionExecuting_ShouldPass_WhenCompanyIdMatchesCaseInsensitive()
    {
        // Arrange
        ClaimsPrincipal user = CreateUser("Company-001");
        ActionExecutingContext context = CreateContext("company-001", user);

        // Act
        _filter.OnActionExecuting(context);

        // Assert
        Assert.Null(context.Result);
    }

    [Fact]
    public void OnActionExecuting_ShouldSkip_WhenUserNotAuthenticated()
    {
        // Arrange - user with no identity (unauthenticated)
        ClaimsPrincipal user = new ClaimsPrincipal();
        ActionExecutingContext context = CreateContext("company-001", user);

        // Act
        _filter.OnActionExecuting(context);

        // Assert
        Assert.Null(context.Result);
    }
}
