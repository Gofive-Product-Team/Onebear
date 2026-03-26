using OneBear.Domain.Common;

namespace OneBear.Application.Common;

public static class ValidationHelper
{
    public static Result<T> EnsureNotNull<T>(T? value, string entityName, string id) where T : class
    {
        return value is not null
            ? new Result<T>.Success(value)
            : new Result<T>.Failure(new Error(
                $"{entityName.ToUpperInvariant()}_NOT_FOUND",
                $"{entityName} with id '{id}' was not found.",
                ErrorType.NotFound));
    }

    public static Result<string> EnsureNotEmpty(string? value, string fieldName)
    {
        return !string.IsNullOrWhiteSpace(value)
            ? new Result<string>.Success(value)
            : new Result<string>.Failure(new Error(
                "VALIDATION_ERROR",
                $"{fieldName} must not be empty.",
                ErrorType.Validation));
    }
}
