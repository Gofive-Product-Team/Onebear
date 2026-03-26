namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Common;

public interface IPlatformAdapter
{
    string Platform { get; }
    Task<Result<object>> SendTextAsync(string recipientId, string content, CancellationToken ct = default);
    Task<Result<object>> SendMediaAsync(string recipientId, string mediaUrl, string mediaType, CancellationToken ct = default);
    Task<Result<object>> ValidateWebhookAsync(string signature, string body, CancellationToken ct = default);
    PlatformCapabilities GetCapabilities();
}
