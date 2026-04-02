namespace OneBear.Application.Rooms.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Messaging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class RoomQueryService
{
    private readonly IChatRoomRepository _roomRepo;
    private readonly IChatMessageRepository _messageRepo;
    private readonly IChatUserRepository _userRepo;
    private readonly ILogger<RoomQueryService> _logger;

    public RoomQueryService(
        IChatRoomRepository roomRepo,
        IChatMessageRepository messageRepo,
        IChatUserRepository userRepo,
        ILogger<RoomQueryService> logger)
    {
        _roomRepo = roomRepo;
        _messageRepo = messageRepo;
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task<Result<PagedResult<ChatRoomDto>>> ListRoomsAsync(
        string companyId, RoomFilter filter, int pageSize = 20,
        string? continuationToken = null, CancellationToken ct = default)
    {
        (List<ChatRoom> rooms, string? nextToken) =
            await _roomRepo.QueryByFilterAsync(companyId, filter, pageSize, continuationToken, ct);

        IReadOnlyList<ChatRoomDto> dtos = rooms
            .Select(MessageMappingHelpers.ToDto)
            .ToList();

        return new Result<PagedResult<ChatRoomDto>>.Success(
            PagedResult<ChatRoomDto>.From(dtos, nextToken));
    }

    public async Task<Result<ChatRoomDto>> GetRoomByIdAsync(
        string companyId, string roomId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return new Result<ChatRoomDto>.Failure(
                new Error("ROOM_NOT_FOUND", $"Room '{roomId}' not found.", ErrorType.NotFound));

        return new Result<ChatRoomDto>.Success(MessageMappingHelpers.ToDto(room));
    }

    public async Task<Result<PagedResult<ChatMessageDto>>> GetMessagesAsync(
        string companyId, string roomId, int pageSize = 50,
        string? continuationToken = null, CancellationToken ct = default)
    {
        (List<ChatMessage> messages, string? nextToken) =
            await _messageRepo.GetByRoomIdAsync(roomId, pageSize, continuationToken, ct: ct);

        // Batch-load unique senders to populate SenderName/SenderType
        HashSet<string> userIds = messages.Select(m => m.UserId).Where(id => id != "system").ToHashSet();
        Dictionary<string, ChatUser> senderMap = new();
        foreach (string userId in userIds)
        {
            ChatUser? user = await _userRepo.GetByIdAsync(userId, companyId, ct);
            if (user is not null)
                senderMap[userId] = user;
        }

        IReadOnlyList<ChatMessageDto> dtos = messages
            .Select(m => MessageMappingHelpers.ToDto(m, senderMap.GetValueOrDefault(m.UserId)))
            .ToList();

        return new Result<PagedResult<ChatMessageDto>>.Success(
            PagedResult<ChatMessageDto>.From(dtos, nextToken));
    }
}
