// src/OneBear.Domain/Common/ConcurrencyConflictException.cs
namespace OneBear.Domain.Common;

public class ConcurrencyConflictException : Exception
{
    public ConcurrencyConflictException(string message) : base(message) { }
    public ConcurrencyConflictException(string message, Exception inner) : base(message, inner) { }
}
