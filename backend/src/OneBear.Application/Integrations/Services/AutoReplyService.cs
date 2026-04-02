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

public class AutoReplyService
{
    private readonly IIntegrationService _integrationService;
    private readonly IChatMessageRepository _messageRepo;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<AutoReplyService> _logger;

    public AutoReplyService(
        IIntegrationService integrationService,
        IChatMessageRepository messageRepo,
        ISignalRNotifier signalRNotifier,
        ILogger<AutoReplyService> logger)
    {
        _integrationService = integrationService;
        _messageRepo = messageRepo;
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    public async Task<Result<bool>> ProcessAutoReplyAsync(
        string roomId, string companyId, string integrationId,
        string platform, string recipientExternalId, string inboundContent,
        IPlatformAdapter adapter, CancellationToken ct)
    {
        IntegrationChannel? integration =
            await _integrationService.GetByIdAsync(integrationId, companyId, ct);

        if (integration is null)
        {
            _logger.LogWarning("Integration {IntegrationId} not found for auto-reply", integrationId);
            return new Result<bool>.Success(false);
        }

        // Find matching auto-reply rules
        List<AutoReply> matchedReplies = integration.AutoReplies
            .Where(r => r.IsEnabled && MatchesKeywords(inboundContent, r))
            .ToList();

        if (matchedReplies.Count == 0)
        {
            _logger.LogDebug("No auto-reply matches for message in room {RoomId}", roomId);
            return new Result<bool>.Success(false);
        }

        // Send the first matching auto-reply
        AutoReply reply = matchedReplies[0];

        Result<PlatformSendResult> sendResult =
            await adapter.SendTextAsync(recipientExternalId, reply.Message, integration, ct);

        if (sendResult is Result<PlatformSendResult>.Failure f)
        {
            _logger.LogWarning("Failed to send auto-reply to {Recipient}: {Error}",
                recipientExternalId, f.Error.Message);
            return new Result<bool>.Success(false);
        }

        PlatformSendResult platformResult = ((Result<PlatformSendResult>.Success)sendResult).Value;

        // Persist auto-reply message
        long now = DateTimeHelper.NowUnixMilliseconds();
        ChatMessage replyMsg = new()
        {
            Id = Guid.NewGuid().ToString(),
            RoomId = roomId,
            UserId = "system",
            Content = reply.Message,
            Type = MessageType.Text,
            Platform = platform,
            Timestamp = now,
            Mid = platformResult.PlatformMessageId,
            CompanyId = companyId,
            DeliveryStatus = MessageDeliveryState.Sent,
            CreatedTimestamp = now
        };
        await _messageRepo.CreateAsync(replyMsg, ct);

        // Notify via SignalR
        ChatMessageDto dto = MessageMappingHelpers.ToDto(replyMsg);
        await _signalRNotifier.SendToRoomAsync(roomId, "ReceiveMessage", dto, ct);

        _logger.LogInformation("Sent auto-reply to room {RoomId} (keyword match)", roomId);
        return new Result<bool>.Success(true);
    }

    private static bool MatchesKeywords(string content, AutoReply rule)
    {
        if (rule.Keywords is null || rule.Keywords.Count == 0)
        {
            // No keywords = always match (catch-all auto-reply)
            return rule.TriggerType == "always";
        }

        string lowerContent = content.ToLowerInvariant();
        return rule.Keywords.Any(kw => lowerContent.Contains(kw.ToLowerInvariant()));
    }
}
