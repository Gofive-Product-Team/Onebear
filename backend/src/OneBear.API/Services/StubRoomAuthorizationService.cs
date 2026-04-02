using OneBear.Application.Common.Interfaces;

namespace OneBear.API.Services;

public class StubRoomAuthorizationService : IRoomAuthorizationService
{
    public Task<bool> CanAccessRoomAsync(string userId, string roomId)
    {
        return Task.FromResult(true); // TODO: implement real room access check
    }
}
