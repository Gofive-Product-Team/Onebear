namespace OneBear.Application.Integrations.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Common;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Messaging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class GreetingService
{
    private readonly IIntegrationService _integrationService;
    private readonly IChatMessageRepository _messageRepo;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<GreetingService> _logger;

    public GreetingService(
        IIntegrationService integrationService,
        IChatMessageRepository messageRepo,
        ISignalRNotifier signalRNotifier,
        ILogger<GreetingService> logger)
    {
        _integrationService = integrationService;
        _messageRepo = messageRepo;
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    public async Task<Result<bool>> SendGreetingAsync(
        string roomId, string companyId, string integrationId,
        string platform, string recipientExternalId,
        IPlatformAdapter adapter, CancellationToken ct)
    {
        // Get integration to check greeting config
        IntegrationChannel? integration =
            await _integrationService.GetByIdAsync(integrationId, companyId, ct);

        if (integration is null)
        {
            _logger.LogWarning("Integration {IntegrationId} not found for greeting", integrationId);
            return new Result<bool>.Success(false);
        }

        // Find enabled greeting messages
        List<GreetingMessage> greetings = integration.GreetingMessages
            .Where(g => g.IsEnabled)
            .ToList();

        if (greetings.Count == 0)
        {
            _logger.LogDebug("No enabled greeting messages for integration {IntegrationId}", integrationId);
            return new Result<bool>.Success(false);
        }

        // Send each enabled greeting message
        foreach (GreetingMessage greeting in greetings)
        {
            Result<PlatformSendResult> sendResult =
                await adapter.SendTextAsync(recipientExternalId, greeting.Content, integration, ct);

            if (sendResult is Result<PlatformSendResult>.Failure f)
            {
                _logger.LogWarning("Failed to send greeting to {Recipient}: {Error}",
                    recipientExternalId, f.Error.Message);
                continue;
            }

            PlatformSendResult platformResult = ((Result<PlatformSendResult>.Success)sendResult).Value;

            // Persist greeting message
            long now = DateTimeHelper.NowUnixMilliseconds();
            ChatMessage greetingMsg = new()
            {
                Id = Guid.NewGuid().ToString(),
                RoomId = roomId,
                UserId = "system",
                Content = greeting.Content,
                Type = MessageType.Text,
                Platform = platform,
                Timestamp = now,
                Mid = platformResult.PlatformMessageId,
                CompanyId = companyId,
                DeliveryStatus = MessageDeliveryState.Sent,
                CreatedTimestamp = now
            };
            await _messageRepo.CreateAsync(greetingMsg, ct);

            // Notify via SignalR
            ChatMessageDto dto = MessageMappingHelpers.ToDto(greetingMsg);
            await _signalRNotifier.SendToRoomAsync(roomId, "ReceiveMessage", dto, ct);

            _logger.LogInformation("Sent greeting message to room {RoomId}", roomId);
        }

        return new Result<bool>.Success(true);
    }
}
