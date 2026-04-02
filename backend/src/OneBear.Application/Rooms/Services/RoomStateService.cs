namespace OneBear.Application.Rooms.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Common;
using OneBear.Application.Common.Interfaces;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class RoomStateService : IRoomStateService
{
    private readonly IChatRoomRepository _roomRepo;
    private readonly ILogger<RoomStateService> _logger;

    public RoomStateService(IChatRoomRepository roomRepo, ILogger<RoomStateService> logger)
    {
        _roomRepo = roomRepo;
        _logger = logger;
    }

    public async Task<Result<(ChatRoom Room, bool IsNewRoom)>> HandleInboundRoomStateAsync(
        ChatUser chatUser, string integrationId, string platform, string companyId, CancellationToken ct)
    {
        ChatRoom? existing = await _roomRepo.GetByUserAndIntegrationAsync(companyId, chatUser.Id, integrationId, ct);

        if (existing is null || existing.State is ChatState.Closed or ChatState.Resolved)
        {
            ChatRoom newRoom = CreateNewRoom(chatUser, integrationId, platform, companyId);
            ChatRoom created = await _roomRepo.CreateAsync(newRoom, ct);
            _logger.LogInformation("Created new room {RoomId} for user {UserId} on {Platform}", created.Id, chatUser.Id, platform);
            return new Result<(ChatRoom Room, bool IsNewRoom)>.Success((created, true));
        }

        // Room is New or InProgress -- update timestamps and unread count
        Result<ChatRoom> updateResult = await UpdateRoomWithRetryAsync(existing, r =>
        {
            r.LastMessageTimestamp = DateTimeHelper.NowUnixMilliseconds();
            r.Unread += 1;
        }, ct);

        return updateResult switch
        {
            Result<ChatRoom>.Success s => new Result<(ChatRoom Room, bool IsNewRoom)>.Success((s.Value, false)),
            Result<ChatRoom>.Failure f => new Result<(ChatRoom Room, bool IsNewRoom)>.Failure(f.Error),
            _ => new Result<(ChatRoom Room, bool IsNewRoom)>.Failure(
                new Error("UNEXPECTED", "Unexpected result type.", ErrorType.Internal))
        };
    }

    public async Task<Result<ChatRoom>> TransitionToInProgressAsync(ChatRoom room, CancellationToken ct)
    {
        if (room.State != ChatState.New)
            return new Result<ChatRoom>.Failure(new Error("INVALID_TRANSITION",
                $"Cannot transition from {room.State} to InProgress. Must be New.", ErrorType.Validation));

        return await UpdateRoomWithRetryAsync(room, r => r.State = ChatState.InProgress, ct);
    }

    public async Task<Result<ChatRoom>> TransitionToClosedAsync(ChatRoom room, string agentUserId, CancellationToken ct)
    {
        if (room.State != ChatState.InProgress)
            return new Result<ChatRoom>.Failure(new Error("INVALID_TRANSITION",
                $"Cannot transition from {room.State} to Closed. Must be InProgress.", ErrorType.Validation));

        return await UpdateRoomWithRetryAsync(room, r =>
        {
            r.State = ChatState.Closed;
            r.UpdatedBy = agentUserId;
        }, ct);
    }

    public async Task<Result<ChatRoom>> TransitionToResolvedAsync(ChatRoom room, string agentUserId, CancellationToken ct)
    {
        if (room.State != ChatState.InProgress)
            return new Result<ChatRoom>.Failure(new Error("INVALID_TRANSITION",
                $"Cannot transition from {room.State} to Resolved. Must be InProgress.", ErrorType.Validation));

        return await UpdateRoomWithRetryAsync(room, r =>
        {
            r.State = ChatState.Resolved;
            r.UpdatedBy = agentUserId;
        }, ct);
    }

    public async Task<Result<ChatRoom>> ReopenRoomAsync(ChatRoom room, CancellationToken ct)
    {
        if (room.State is not (ChatState.Closed or ChatState.Resolved))
            return new Result<ChatRoom>.Failure(new Error("INVALID_TRANSITION",
                $"Cannot reopen room in state {room.State}. Must be Closed or Resolved.", ErrorType.Validation));

        return await UpdateRoomWithRetryAsync(room, r =>
        {
            r.State = ChatState.New;
            r.IsAiMuted = false;
        }, ct);
    }

    public async Task<Result<ChatRoom>> UpdateRoomWithRetryAsync(
        ChatRoom room, Action<ChatRoom> update, CancellationToken ct, int maxRetries = 3)
    {
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                update(room);
                room.UpdatedTimestamp = DateTimeHelper.NowUnixMilliseconds();
                ChatRoom updated = await _roomRepo.UpdateAsync(room, ct);
                return new Result<ChatRoom>.Success(updated);
            }
            catch (Exception ex) when (
                ex.Message.Contains("412") ||
                ex.Message.Contains("PreconditionFailed") ||
                ex.Message.Contains("Conflict"))
            {
                _logger.LogWarning("ETag conflict on room {RoomId}, attempt {Attempt}/{Max}",
                    room.Id, attempt + 1, maxRetries);

                if (attempt == maxRetries - 1)
                {
                    return new Result<ChatRoom>.Failure(new Error("ROOM_CONFLICT",
                        "Room was modified concurrently. Please refresh and try again.", ErrorType.Conflict));
                }

                ChatRoom? reloaded = await _roomRepo.GetByIdAsync(room.Id, room.CompanyId, ct);
                if (reloaded is null)
                    return new Result<ChatRoom>.Failure(new Error("ROOM_NOT_FOUND",
                        "Room not found during conflict retry.", ErrorType.NotFound));

                room = reloaded;
            }
        }

        return new Result<ChatRoom>.Failure(new Error("ROOM_CONFLICT",
            "Unexpected retry exhaustion.", ErrorType.Conflict));
    }

    private static ChatRoom CreateNewRoom(
        ChatUser chatUser, string integrationId, string platform, string companyId)
    {
        long now = DateTimeHelper.NowUnixMilliseconds();
        return new ChatRoom
        {
            Id = Guid.NewGuid().ToString(),
            CompanyId = companyId,
            UserId = chatUser.Id,
            Platform = platform,
            IntegrationId = integrationId,
            State = ChatState.New,
            Unread = 1,
            CreatedTimestamp = now,
            LastMessageTimestamp = now,
            Customer = new RoomCustomer
            {
                Name = chatUser.DisplayName,
                PictureUrl = chatUser.PictureUrl,
                ExternalId = chatUser.ExternalId
            }
        };
    }
}
