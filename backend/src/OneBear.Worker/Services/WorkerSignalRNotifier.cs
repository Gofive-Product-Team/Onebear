namespace OneBear.Worker.Services;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Interfaces;

/// <summary>
/// Worker-side ISignalRNotifier that logs notifications.
/// In production, this would use Azure SignalR Service REST API
/// to push to clients from the Worker process.
/// </summary>
public class WorkerSignalRNotifier : ISignalRNotifier
{
    private readonly ILogger<WorkerSignalRNotifier> _logger;

    public WorkerSignalRNotifier(ILogger<WorkerSignalRNotifier> logger)
    {
        _logger = logger;
    }

    public Task SendToRoomAsync(string roomId, string eventName, object payload, CancellationToken ct = default)
    {
        _logger.LogDebug("Worker SignalR (no-op): {Event} to room:{RoomId}", eventName, roomId);
        return Task.CompletedTask;
    }

    public Task SendToUserAsync(string userId, string eventName, object payload, CancellationToken ct = default)
    {
        _logger.LogDebug("Worker SignalR (no-op): {Event} to user:{UserId}", eventName, userId);
        return Task.CompletedTask;
    }

    public Task SendToCompanyAsync(string companyId, string eventName, object payload, CancellationToken ct = default)
    {
        _logger.LogDebug("Worker SignalR (no-op): {Event} to company:{CompanyId}", eventName, companyId);
        return Task.CompletedTask;
    }

    public Task SendToRoomExceptAsync(string roomId, string excludeConnectionId, string eventName, object payload, CancellationToken ct = default)
    {
        _logger.LogDebug("Worker SignalR (no-op): {Event} to room:{RoomId} except {ConnectionId}", eventName, roomId, excludeConnectionId);
        return Task.CompletedTask;
    }
}
