namespace OneBear.Domain.Common;

public abstract record Result<T>
{
    public sealed record Success(T Value) : Result<T>;
    public sealed record Failure(Error Error) : Result<T>;

    public bool IsSuccess => this is Success;
    public bool IsFailure => this is Failure;
}
