namespace OneBear.Domain.Interfaces;

public interface ISignalRNotifier
{
    Task SendToRoomAsync(string roomId, string eventName, object payload, CancellationToken ct = default);
    Task SendToUserAsync(string userId, string eventName, object payload, CancellationToken ct = default);
    Task SendToCompanyAsync(string companyId, string eventName, object payload, CancellationToken ct = default);
    Task SendToRoomExceptAsync(string roomId, string excludeConnectionId, string eventName, object payload, CancellationToken ct = default);
}
