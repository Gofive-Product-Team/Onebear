namespace OneBear.Application.Messaging;

using OneBear.Application.Common.DTOs;
using OneBear.Domain.Common;

public class MessageOrchestrator
{
    // TODO: inject repositories, adapters, services

    public Task<Result<ChatMessageDto>> ProcessInboundAsync(object webhookPayload, string platform, CancellationToken ct = default)
    {
        // Stub
        return Task.FromResult<Result<ChatMessageDto>>(new Result<ChatMessageDto>.Failure(new Error("NOT_IMPLEMENTED", "TODO: implement inbound pipeline", ErrorType.Internal)));
    }

    public Task<Result<ChatMessageDto>> ProcessOutboundAsync(string roomId, string content, string senderId, CancellationToken ct = default)
    {
        return Task.FromResult<Result<ChatMessageDto>>(new Result<ChatMessageDto>.Failure(new Error("NOT_IMPLEMENTED", "TODO: implement outbound pipeline", ErrorType.Internal)));
    }
}
