using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OneBear.API.Auth;
using OneBear.API.Middleware;
using OneBear.Domain.Interfaces;
using Moq;

namespace OneBear.API.Tests.Middleware;

public class SubscriptionCheckMiddlewareTests
{
    private readonly Mock<ICacheService> _cacheService = new();

    private SubscriptionCheckMiddleware CreateMiddleware(RequestDelegate next, bool isDevelopment = true)
    {
        return new SubscriptionCheckMiddleware(next, isDevelopment);
    }

    private static DefaultHttpContext CreateHttpContext(ClaimsPrincipal? user = null)
    {
        DefaultHttpContext context = new();
        if (user != null)
        {
            context.User = user;
        }
        return context;
    }

    [Fact]
    public async Task ShouldSkip_WhenDevelopmentEnvironment()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: true);

        DefaultHttpContext context = CreateHttpContext();
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldSkip_WhenApiKeyAuth()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldSkip_WhenUserNotAuthenticated()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        DefaultHttpContext context = CreateHttpContext(new ClaimsPrincipal());
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldReturn403_WhenSubscriptionExpired()
    {
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ => Task.CompletedTask, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-expired")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-expired", default))
            .ReturnsAsync("Expired");
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.Equal(403, context.Response.StatusCode);
    }

    [Fact]
    public async Task ShouldReturn403_WhenSubscriptionTrialExpired()
    {
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ => Task.CompletedTask, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-trial-expired")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-trial-expired", default))
            .ReturnsAsync("TrialExpired");
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.Equal(403, context.Response.StatusCode);
    }

    [Fact]
    public async Task ShouldPass_WhenSubscriptionActive()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-active")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-active", default))
            .ReturnsAsync("Active");
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task ShouldPass_WhenNoSubscriptionCached()
    {
        bool nextCalled = false;
        SubscriptionCheckMiddleware middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        }, isDevelopment: false);

        Claim[] claims =
        [
            new(AuthConstants.ClaimUserId, "user-1"),
            new(AuthConstants.ClaimCompanyId, "company-unknown")
        ];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));
        DefaultHttpContext context = CreateHttpContext(user);

        _cacheService.Setup(c => c.GetAsync<string>("subscription:company-unknown", default))
            .ReturnsAsync((string?)null);
        context.RequestServices = CreateServiceProvider();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    private IServiceProvider CreateServiceProvider()
    {
        Mock<IServiceProvider> provider = new();
        provider.Setup(p => p.GetService(typeof(ICacheService))).Returns(_cacheService.Object);
        return provider.Object;
    }
}
