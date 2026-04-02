namespace OneBear.Application.Rooms.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Common;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Messaging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class RoomParticipantService
{
    private readonly IChatRoomRepository _roomRepo;
    private readonly IRoomStateService _roomStateService;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<RoomParticipantService> _logger;

    public RoomParticipantService(
        IChatRoomRepository roomRepo,
        IRoomStateService roomStateService,
        ISignalRNotifier signalRNotifier,
        ILogger<RoomParticipantService> logger)
    {
        _roomRepo = roomRepo;
        _roomStateService = roomStateService;
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    public async Task<Result<ChatRoomDto>> UpdateAssignmentAsync(
        string companyId, string roomId, string? assignToUserId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return new Result<ChatRoomDto>.Failure(
                new Error("ROOM_NOT_FOUND", "Room not found.", ErrorType.NotFound));

        Result<ChatRoom> updateResult = await _roomStateService.UpdateRoomWithRetryAsync(room, r =>
        {
            r.AssignToUserId = assignToUserId;
        }, ct);

        if (updateResult is Result<ChatRoom>.Failure f)
            return new Result<ChatRoomDto>.Failure(f.Error);

        ChatRoom updated = ((Result<ChatRoom>.Success)updateResult).Value;
        ChatRoomDto dto = MessageMappingHelpers.ToDto(updated);

        // Notify via SignalR
        await _signalRNotifier.SendToRoomAsync(roomId, "UpdateRoom", new { id = roomId, assignToUserId }, ct);
        if (!string.IsNullOrEmpty(assignToUserId))
            await _signalRNotifier.SendToUserAsync(assignToUserId, "ReceiveRoom", dto, ct);

        _logger.LogInformation("Room {RoomId} assigned to {UserId}", roomId, assignToUserId ?? "unassigned");
        return new Result<ChatRoomDto>.Success(dto);
    }

    public async Task<Result<ChatRoomDto>> UpdateParticipantsAsync(
        string companyId, string roomId, List<string> participantUserIds, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return new Result<ChatRoomDto>.Failure(
                new Error("ROOM_NOT_FOUND", "Room not found.", ErrorType.NotFound));

        Result<ChatRoom> updateResult = await _roomStateService.UpdateRoomWithRetryAsync(room, r =>
        {
            r.ParticipantUserIds = participantUserIds;
        }, ct);

        if (updateResult is Result<ChatRoom>.Failure f)
            return new Result<ChatRoomDto>.Failure(f.Error);

        ChatRoom updated = ((Result<ChatRoom>.Success)updateResult).Value;
        ChatRoomDto dto = MessageMappingHelpers.ToDto(updated);

        await _signalRNotifier.SendToRoomAsync(roomId, "UpdateRoom",
            new { id = roomId, participantUserIds }, ct);

        _logger.LogInformation("Room {RoomId} participants updated: {Count}", roomId, participantUserIds.Count);
        return new Result<ChatRoomDto>.Success(dto);
    }

    public async Task<Result<ChatRoomDto>> UpdateTagsAsync(
        string companyId, string roomId, List<string> tagIds, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return new Result<ChatRoomDto>.Failure(
                new Error("ROOM_NOT_FOUND", "Room not found.", ErrorType.NotFound));

        Result<ChatRoom> updateResult = await _roomStateService.UpdateRoomWithRetryAsync(room, r =>
        {
            r.Tags = tagIds.Select(id => new Domain.ValueObjects.RoomTag { Id = id }).ToList();
        }, ct);

        if (updateResult is Result<ChatRoom>.Failure f)
            return new Result<ChatRoomDto>.Failure(f.Error);

        ChatRoom updated = ((Result<ChatRoom>.Success)updateResult).Value;
        ChatRoomDto dto = MessageMappingHelpers.ToDto(updated);

        await _signalRNotifier.SendToRoomAsync(roomId, "UpdateRoom",
            new { id = roomId, tags = tagIds }, ct);

        return new Result<ChatRoomDto>.Success(dto);
    }

    public async Task<Result<ChatRoomDto>> UpdateFollowUpAsync(
        string companyId, string roomId, long? followupTimestamp, string? followupContent,
        CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return new Result<ChatRoomDto>.Failure(
                new Error("ROOM_NOT_FOUND", "Room not found.", ErrorType.NotFound));

        Result<ChatRoom> updateResult = await _roomStateService.UpdateRoomWithRetryAsync(room, r =>
        {
            r.FollowupTimestamp = followupTimestamp;
            r.FollowupContent = followupContent;
        }, ct);

        if (updateResult is Result<ChatRoom>.Failure f)
            return new Result<ChatRoomDto>.Failure(f.Error);

        ChatRoom updated = ((Result<ChatRoom>.Success)updateResult).Value;
        return new Result<ChatRoomDto>.Success(MessageMappingHelpers.ToDto(updated));
    }
}
