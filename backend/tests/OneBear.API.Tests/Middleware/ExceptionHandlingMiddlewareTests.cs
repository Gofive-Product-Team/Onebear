using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OneBear.API.Middleware;

namespace OneBear.API.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddlewareTests()
    {
        _logger = new LoggerFactory().CreateLogger<ExceptionHandlingMiddleware>();
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        DefaultHttpContext context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private async Task<ProblemDetails?> InvokeAndReadProblemDetails(
        ExceptionHandlingMiddleware middleware, HttpContext context)
    {
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        if (context.Response.Body.Length == 0)
        {
            return null;
        }
        return await JsonSerializer.DeserializeAsync<ProblemDetails>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    [Fact]
    public async Task InvokeAsync_ShouldSetCorrelationId_WhenNotProvided()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => Task.CompletedTask, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(context.Response.Headers.ContainsKey("X-Correlation-Id"));
        string correlationId = context.Response.Headers["X-Correlation-Id"].ToString();
        Assert.False(string.IsNullOrEmpty(correlationId));
    }

    [Fact]
    public async Task InvokeAsync_ShouldUseProvidedCorrelationId()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        context.Request.Headers["X-Correlation-Id"] = "test-correlation-123";
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => Task.CompletedTask, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal("test-correlation-123", context.Response.Headers["X-Correlation-Id"].ToString());
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn400_WhenArgumentException()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new ArgumentException("Invalid input"), _logger);

        // Act
        ProblemDetails? problem = await InvokeAndReadProblemDetails(middleware, context);

        // Assert
        Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("Bad Request", problem!.Title);
        Assert.Equal("Invalid input", problem.Detail);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn404_WhenKeyNotFoundException()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new KeyNotFoundException(), _logger);

        // Act
        ProblemDetails? problem = await InvokeAndReadProblemDetails(middleware, context);

        // Assert
        Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("Not Found", problem!.Title);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn401_WhenUnauthorizedAccessException()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new UnauthorizedAccessException(), _logger);

        // Act
        ProblemDetails? problem = await InvokeAndReadProblemDetails(middleware, context);

        // Assert
        Assert.Equal((int)HttpStatusCode.Unauthorized, context.Response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("Unauthorized", problem!.Title);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn409_WhenInvalidOperationException()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("Already exists"), _logger);

        // Act
        ProblemDetails? problem = await InvokeAndReadProblemDetails(middleware, context);

        // Assert
        Assert.Equal((int)HttpStatusCode.Conflict, context.Response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("Conflict", problem!.Title);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn504_WhenTimeoutException()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new TimeoutException(), _logger);

        // Act
        ProblemDetails? problem = await InvokeAndReadProblemDetails(middleware, context);

        // Assert
        Assert.Equal((int)HttpStatusCode.GatewayTimeout, context.Response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("Gateway Timeout", problem!.Title);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenUnknownException()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("something bad"), _logger);

        // Act
        ProblemDetails? problem = await InvokeAndReadProblemDetails(middleware, context);

        // Assert
        Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("Internal Server Error", problem!.Title);
        // Should NOT expose internal message
        Assert.DoesNotContain("something bad", problem.Detail);
        Assert.Contains("Reference:", problem.Detail);
    }

    [Fact]
    public async Task InvokeAsync_ShouldIncludeCorrelationIdInProblemDetails()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        context.Request.Headers["X-Correlation-Id"] = "my-cid-456";
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new ArgumentException("bad"), _logger);

        // Act
        ProblemDetails? problem = await InvokeAndReadProblemDetails(middleware, context);

        // Assert
        Assert.NotNull(problem);
        Assert.True(problem!.Extensions.ContainsKey("correlationId"));
        Assert.Equal("my-cid-456", problem.Extensions["correlationId"]?.ToString());
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturnProblemJsonContentType()
    {
        // Arrange
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("error"), _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_ShouldPassThrough_WhenNoException()
    {
        // Arrange
        bool nextCalled = false;
        DefaultHttpContext context = CreateHttpContext();
        ExceptionHandlingMiddleware middleware = new ExceptionHandlingMiddleware(
            _ => { nextCalled = true; return Task.CompletedTask; }, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
        Assert.Equal(200, context.Response.StatusCode);
    }
}
