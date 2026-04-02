namespace OneBear.Application.Common.Interfaces;

public interface IRoomAuthorizationService
{
    Task<bool> CanAccessRoomAsync(string userId, string roomId);
}
