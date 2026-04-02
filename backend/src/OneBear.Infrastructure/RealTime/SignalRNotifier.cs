namespace OneBear.Infrastructure.RealTime;

using OneBear.Domain.Interfaces;

/// <summary>
/// Stub implementation of ISignalRNotifier for the Infrastructure layer.
/// The real implementation is SignalRNotifierService in the API project,
/// which has access to IHubContext&lt;ChatHub&gt;.
/// This stub exists only so Infrastructure can compile independently if needed.
/// In production DI, SignalRNotifierService from the API project should be registered instead.
/// </summary>
public class SignalRNotifier : ISignalRNotifier
{
    public Task SendToRoomAsync(string roomId, string eventName, object payload, CancellationToken ct = default)
    {
        // Stub -- real implementation is in OneBear.API.Services.SignalRNotifierService
        throw new NotImplementedException("Use SignalRNotifierService from the API project.");
    }

    public Task SendToUserAsync(string userId, string eventName, object payload, CancellationToken ct = default)
    {
        throw new NotImplementedException("Use SignalRNotifierService from the API project.");
    }

    public Task SendToCompanyAsync(string companyId, string eventName, object payload, CancellationToken ct = default)
    {
        throw new NotImplementedException("Use SignalRNotifierService from the API project.");
    }

    public Task SendToRoomExceptAsync(string roomId, string excludeConnectionId, string eventName, object payload, CancellationToken ct = default)
    {
        throw new NotImplementedException("Use SignalRNotifierService from the API project.");
    }
}
