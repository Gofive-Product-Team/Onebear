using Microsoft.AspNetCore.Mvc;
using OneBear.Domain.Common;

namespace OneBear.API.Extensions;

public static class ResultExtensions
{
    public static IActionResult ToActionResult<T>(this Result<T> result)
    {
        return result switch
        {
            Result<T>.Success s => new OkObjectResult(s.Value),
            Result<T>.Failure f => f.Error.Type switch
            {
                ErrorType.Validation => new BadRequestObjectResult(ToProblemDetails(f.Error, 400)),
                ErrorType.NotFound => new NotFoundObjectResult(ToProblemDetails(f.Error, 404)),
                ErrorType.Conflict => new ConflictObjectResult(ToProblemDetails(f.Error, 409)),
                ErrorType.Forbidden => new ObjectResult(ToProblemDetails(f.Error, 403)) { StatusCode = 403 },
                ErrorType.PlatformError => new ObjectResult(ToProblemDetails(f.Error, 502)) { StatusCode = 502 },
                ErrorType.RateLimited => new ObjectResult(ToProblemDetails(f.Error, 429)) { StatusCode = 429 },
                _ => new ObjectResult(ToProblemDetails(f.Error, 500)) { StatusCode = 500 }
            },
            _ => new StatusCodeResult(500)
        };
    }

    public static IActionResult ToCreatedResult<T>(this Result<T> result, string routeName, object? routeValues = null)
    {
        return result switch
        {
            Result<T>.Success s => new CreatedAtRouteResult(routeName, routeValues, s.Value),
            _ => result.ToActionResult()
        };
    }

    private static ProblemDetails ToProblemDetails(Error error, int statusCode)
    {
        return new ProblemDetails
        {
            Status = statusCode,
            Title = error.Code,
            Detail = error.Message,
            Extensions = { ["errorCode"] = error.Code }
        };
    }
}
