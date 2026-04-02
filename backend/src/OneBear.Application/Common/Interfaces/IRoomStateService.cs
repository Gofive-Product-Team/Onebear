namespace OneBear.Application.Common.Interfaces;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface IRoomStateService
{
    Task<Result<(ChatRoom Room, bool IsNewRoom)>> HandleInboundRoomStateAsync(
        ChatUser chatUser, string integrationId, string platform, string companyId, CancellationToken ct);
    Task<Result<ChatRoom>> TransitionToInProgressAsync(ChatRoom room, CancellationToken ct);
    Task<Result<ChatRoom>> TransitionToClosedAsync(ChatRoom room, string agentUserId, CancellationToken ct);
    Task<Result<ChatRoom>> TransitionToResolvedAsync(ChatRoom room, string agentUserId, CancellationToken ct);
    Task<Result<ChatRoom>> ReopenRoomAsync(ChatRoom room, CancellationToken ct);
    Task<Result<ChatRoom>> UpdateRoomWithRetryAsync(ChatRoom room, Action<ChatRoom> update, CancellationToken ct, int maxRetries = 3);
}
