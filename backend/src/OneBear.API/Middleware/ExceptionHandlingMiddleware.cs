using System.Diagnostics;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace OneBear.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Correlation ID
        string correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                            ?? Guid.NewGuid().ToString("N");
        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers["X-Correlation-Id"] = correlationId;

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await _next(context);
            sw.Stop();

            // Log slow requests
            if (sw.ElapsedMilliseconds > 5000)
            {
                _logger.LogWarning("Slow request: {Method} {Path} took {Elapsed}ms [CID:{CorrelationId}]",
                    context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds, correlationId);
            }
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected, not an error
            _logger.LogInformation("Request cancelled by client: {Method} {Path} [CID:{CorrelationId}]",
                context.Request.Method, context.Request.Path, correlationId);
            context.Response.StatusCode = 499; // Client Closed Request
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Unhandled exception: {Method} {Path} after {Elapsed}ms [CID:{CorrelationId}]",
                context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds, correlationId);

            await HandleExceptionAsync(context, ex, correlationId);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, string correlationId)
    {
        (HttpStatusCode statusCode, string title, string detail) = exception switch
        {
            FluentValidation.ValidationException ve => (HttpStatusCode.BadRequest, "Validation Failed", ve.Message),
            ArgumentException ae => (HttpStatusCode.BadRequest, "Bad Request", ae.Message),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Not Found", "The requested resource was not found."),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized", "Authentication required."),
            InvalidOperationException ioe => (HttpStatusCode.Conflict, "Conflict", ioe.Message),
            TimeoutException => (HttpStatusCode.GatewayTimeout, "Gateway Timeout", "An upstream service did not respond in time."),
            _ => (HttpStatusCode.InternalServerError, "Internal Server Error", "An unexpected error occurred.")
        };

        // Don't expose internal details in production
        if (statusCode == HttpStatusCode.InternalServerError)
        {
            detail = "An unexpected error occurred. Reference: " + correlationId;
        }

        ProblemDetails problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
            Extensions =
            {
                ["correlationId"] = correlationId,
                ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier
            }
        };

        if (exception is FluentValidation.ValidationException validationException)
        {
            Dictionary<string, string[]> errors = validationException.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                    g => g.Select(e => e.ErrorMessage).ToArray());
            problemDetails.Extensions["errors"] = errors;
        }

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/problem+json";

        await JsonSerializer.SerializeAsync(context.Response.Body, problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
