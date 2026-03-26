namespace OneBear.Domain.Common;

public record Error(string Code, string Message, ErrorType Type);

public enum ErrorType
{
    Validation,
    NotFound,
    Conflict,
    Forbidden,
    PlatformError,
    RateLimited,
    Internal
}
