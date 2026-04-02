namespace OneBear.Application.Common.Interfaces;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface IAutoAssignmentService
{
    Task<Result<ChatRoom>> TryAssignAsync(ChatRoom room, string companyId, CancellationToken ct);
    Task<Result<ChatRoom>> TryAssignSenderAsync(ChatRoom room, string senderUserId, CancellationToken ct);
}
