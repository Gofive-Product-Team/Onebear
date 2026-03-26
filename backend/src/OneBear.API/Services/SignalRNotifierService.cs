using Microsoft.AspNetCore.SignalR;
using OneBear.API.Hubs;
using OneBear.Domain.Interfaces;

namespace OneBear.API.Services;

public class SignalRNotifierService : ISignalRNotifier
{
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<SignalRNotifierService> _logger;

    public SignalRNotifierService(IHubContext<ChatHub> hubContext, ILogger<SignalRNotifierService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendToRoomAsync(string roomId, string eventName, object payload, CancellationToken ct = default)
    {
        _logger.LogDebug("SignalR push: {Event} to room:{RoomId}", eventName, roomId);
        await _hubContext.Clients.Group($"room:{roomId}").SendAsync(eventName, payload, ct);
    }

    public async Task SendToUserAsync(string userId, string eventName, object payload, CancellationToken ct = default)
    {
        _logger.LogDebug("SignalR push: {Event} to user:{UserId}", eventName, userId);
        await _hubContext.Clients.Group($"user:{userId}").SendAsync(eventName, payload, ct);
    }

    public async Task SendToCompanyAsync(string companyId, string eventName, object payload, CancellationToken ct = default)
    {
        _logger.LogDebug("SignalR push: {Event} to company:{CompanyId}", eventName, companyId);
        await _hubContext.Clients.Group($"company:{companyId}").SendAsync(eventName, payload, ct);
    }
}
