// src/OneBear.Domain/Common/IAuditableEntity.cs
namespace OneBear.Domain.Common;

public interface IAuditableEntity
{
    string? CreatedBy { get; set; }
    long CreatedTimestamp { get; set; }
    string? UpdatedBy { get; set; }
    long? UpdatedTimestamp { get; set; }
}
