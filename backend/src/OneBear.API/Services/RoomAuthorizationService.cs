using OneBear.Application.Common.Interfaces;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

namespace OneBear.API.Services;

/// <summary>
/// Real room authorization: user can access room if they are
/// the assigned agent, a participant, or have Chat.Admin permission.
/// Falls back to company membership check.
/// </summary>
public class RoomAuthorizationService : IRoomAuthorizationService
{
    private readonly IChatRoomRepository _roomRepo;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<RoomAuthorizationService> _logger;

    public RoomAuthorizationService(
        IChatRoomRepository roomRepo,
        IHttpContextAccessor httpContextAccessor,
        ILogger<RoomAuthorizationService> logger)
    {
        _roomRepo = roomRepo;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<bool> CanAccessRoomAsync(string userId, string roomId)
    {
        // Chat.Admin users can access any room in their company
        System.Security.Claims.ClaimsPrincipal? user = _httpContextAccessor.HttpContext?.User;
        if (user is not null)
        {
            int[] permissions = Auth.ClaimsPrincipalExtensions.GetPermissions(user);
            if (permissions.Contains(Domain.Enums.Permission.ChatAccessAll))
                return true;
        }

        // Get the user's companyId from claims
        string? companyId = null;
        if (user is not null)
        {
            try { companyId = Auth.ClaimsPrincipalExtensions.GetCompanyId(user); }
            catch { /* no claim = deny */ }
        }

        if (string.IsNullOrEmpty(companyId))
        {
            _logger.LogDebug("Room access denied for user {UserId}: no company claim", userId);
            return false;
        }

        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId);
        if (room is null)
        {
            _logger.LogDebug("Room access denied for user {UserId}: room {RoomId} not found", userId, roomId);
            return false;
        }

        // Check if user is assigned to the room
        if (room.AssignToUserId == userId)
            return true;

        // Check if user is a participant
        if (room.ParticipantUserIds.Contains(userId))
            return true;

        // Check if user is the room creator (UserId field)
        if (room.UserId == userId)
            return true;

        _logger.LogDebug("Room access denied for user {UserId}: not assigned, participant, or creator of room {RoomId}",
            userId, roomId);
        return false;
    }
}
