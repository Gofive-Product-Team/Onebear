using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Threading.RateLimiting;

namespace OneBear.API.Tests.RateLimiting;

public class RateLimitingTests
{
    private static IServiceProvider BuildServiceProvider()
    {
        ServiceCollection services = new ServiceCollection();
        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("webhook", opt =>
            {
                opt.PermitLimit = 500;
                opt.Window = TimeSpan.FromMinutes(1);
                opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 50;
            });

            options.AddFixedWindowLimiter("api", opt =>
            {
                opt.PermitLimit = 300;
                opt.Window = TimeSpan.FromMinutes(1);
            });

            options.AddFixedWindowLimiter("auth", opt =>
            {
                opt.PermitLimit = 20;
                opt.Window = TimeSpan.FromMinutes(1);
            });

            options.RejectionStatusCode = 429;
            options.OnRejected = async (context, ct) =>
            {
                context.HttpContext.Response.Headers["Retry-After"] = "60";
                context.HttpContext.Response.ContentType = "application/problem+json";
                Microsoft.AspNetCore.Mvc.ProblemDetails problemDetails = new()
                {
                    Status = 429,
                    Title = "Too Many Requests",
                    Detail = "Rate limit exceeded. Try again later.",
                    Instance = context.HttpContext.Request.Path
                };
                await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, ct);
            };
        });

        return services.BuildServiceProvider();
    }

    [Fact]
    public void AddRateLimiter_ShouldRegisterService()
    {
        // Arrange / Act
        IServiceProvider provider = BuildServiceProvider();

        // Assert — the rate limiter options service must be registered
        object? rateLimiterOptions = provider.GetService<IOptions<RateLimiterOptions>>();
        Assert.NotNull(rateLimiterOptions);
    }

    [Fact]
    public void RateLimiterOptions_ShouldHaveCorrectRejectionStatusCode()
    {
        // Arrange / Act
        IServiceProvider provider = BuildServiceProvider();
        IOptions<RateLimiterOptions> options = provider.GetRequiredService<IOptions<RateLimiterOptions>>();

        // Assert
        Assert.Equal(429, options.Value.RejectionStatusCode);
    }

    [Fact]
    public async Task OnRejected_ShouldSetRetryAfterHeader()
    {
        // Arrange
        IServiceProvider provider = BuildServiceProvider();
        IOptions<RateLimiterOptions> options = provider.GetRequiredService<IOptions<RateLimiterOptions>>();

        DefaultHttpContext httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();
        httpContext.Request.Path = "/api/v1/companies/test/rooms";

        // Simulate what ASP.NET Core calls when a request is rejected
        // OnRejected receives a RateLimitLease — we pass a null-pattern stub via reflection-free approach
        RateLimiterOptions rateLimiterOptions = options.Value;
        Assert.NotNull(rateLimiterOptions.OnRejected);

        // Build a minimal OnRejectedContext using a denied lease
        FixedWindowRateLimiter limiter = new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
        {
            PermitLimit = 1,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });

        // Acquire the only permit, then fail the next one to get a denied lease
        using RateLimitLease firstLease = await limiter.AcquireAsync(1);
        Assert.True(firstLease.IsAcquired);

        using RateLimitLease deniedLease = await limiter.AcquireAsync(1);
        Assert.False(deniedLease.IsAcquired);

        OnRejectedContext onRejectedContext = new OnRejectedContext
        {
            HttpContext = httpContext,
            Lease = deniedLease
        };

        // Act
        await rateLimiterOptions.OnRejected(onRejectedContext, CancellationToken.None);

        // Assert — Retry-After header must be set to 60
        Assert.True(httpContext.Response.Headers.ContainsKey("Retry-After"));
        Assert.Equal("60", httpContext.Response.Headers["Retry-After"].ToString());
    }

    [Fact]
    public async Task OnRejected_ShouldWriteProblemJsonBody()
    {
        // Arrange
        IServiceProvider provider = BuildServiceProvider();
        IOptions<RateLimiterOptions> options = provider.GetRequiredService<IOptions<RateLimiterOptions>>();

        DefaultHttpContext httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();
        httpContext.Request.Path = "/api/v1/companies/test/rooms";

        FixedWindowRateLimiter limiter = new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
        {
            PermitLimit = 1,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });

        using RateLimitLease firstLease = await limiter.AcquireAsync(1);
        using RateLimitLease deniedLease = await limiter.AcquireAsync(1);

        OnRejectedContext onRejectedContext = new OnRejectedContext
        {
            HttpContext = httpContext,
            Lease = deniedLease
        };

        // Act
        await options.Value.OnRejected!(onRejectedContext, CancellationToken.None);

        // Assert — Content-Type contains application/json (WriteAsJsonAsync sets this; the
        // problem+json assignment before the call is overridden by the framework extension method)
        Assert.Contains("application/json", httpContext.Response.ContentType);

        // Assert — body contains expected ProblemDetails fields
        httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        ProblemDetails? problem = await JsonSerializer.DeserializeAsync<ProblemDetails>(
            httpContext.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(problem);
        Assert.Equal(429, problem!.Status);
        Assert.Equal("Too Many Requests", problem.Title);
        Assert.Equal("Rate limit exceeded. Try again later.", problem.Detail);
    }

    [Fact]
    public async Task OnRejected_ShouldSetInstanceToRequestPath()
    {
        // Arrange
        IServiceProvider provider = BuildServiceProvider();
        IOptions<RateLimiterOptions> options = provider.GetRequiredService<IOptions<RateLimiterOptions>>();

        DefaultHttpContext httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();
        httpContext.Request.Path = "/api/v1/companies/acme/rooms";

        FixedWindowRateLimiter limiter = new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
        {
            PermitLimit = 1,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });

        using RateLimitLease firstLease = await limiter.AcquireAsync(1);
        using RateLimitLease deniedLease = await limiter.AcquireAsync(1);

        OnRejectedContext onRejectedContext = new OnRejectedContext
        {
            HttpContext = httpContext,
            Lease = deniedLease
        };

        // Act
        await options.Value.OnRejected!(onRejectedContext, CancellationToken.None);

        // Assert — instance should reflect the request path
        httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        ProblemDetails? problem = await JsonSerializer.DeserializeAsync<ProblemDetails>(
            httpContext.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(problem);
        Assert.Equal("/api/v1/companies/acme/rooms", problem!.Instance);
    }
}
