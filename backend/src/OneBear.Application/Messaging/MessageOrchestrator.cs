namespace OneBear.Application.Messaging;

using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OneBear.Application.Common;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Events;
using OneBear.Application.Customers.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class MessageOrchestrator
{
    private readonly IServiceProvider _sp;
    private readonly IIntegrationService _integrationService;
    private readonly IChatUserService _chatUserService;
    private readonly IRoomStateService _roomStateService;
    private readonly IChatMessageRepository _messageRepo;
    private readonly IChatRoomRepository _roomRepo;
    private readonly IAutoAssignmentService _autoAssignmentService;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<MessageOrchestrator> _logger;

    public MessageOrchestrator(
        IServiceProvider sp,
        IIntegrationService integrationService,
        IChatUserService chatUserService,
        IRoomStateService roomStateService,
        IChatMessageRepository messageRepo,
        IChatRoomRepository roomRepo,
        IAutoAssignmentService autoAssignmentService,
        ISignalRNotifier signalRNotifier,
        IEventPublisher eventPublisher,
        ILogger<MessageOrchestrator> logger)
    {
        _sp = sp;
        _integrationService = integrationService;
        _chatUserService = chatUserService;
        _roomStateService = roomStateService;
        _messageRepo = messageRepo;
        _roomRepo = roomRepo;
        _autoAssignmentService = autoAssignmentService;
        _signalRNotifier = signalRNotifier;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    // ── Inbound (webhook → persist → notify) ──────────────────────────

    public async Task<Result<InboundMessageResult>> ProcessInboundAsync(
        string platform, string integrationId, string companyId,
        JsonDocument webhookPayload, CancellationToken ct)
    {
        // Step 1: Validate integration
        Result<IntegrationChannel> integrationResult =
            await _integrationService.ValidateAndGetAsync(integrationId, companyId, ct);
        if (integrationResult is Result<IntegrationChannel>.Failure f1)
            return new Result<InboundMessageResult>.Failure(f1.Error);
        IntegrationChannel integration = ((Result<IntegrationChannel>.Success)integrationResult).Value;

        // Step 2: Parse inbound message via platform adapter
        IPlatformAdapter adapter = GetAdapter(platform);
        Result<NormalizedMessage> parseResult =
            await adapter.ParseInboundMessageAsync(webhookPayload, integration, ct);
        if (parseResult is Result<NormalizedMessage>.Failure f2)
            return new Result<InboundMessageResult>.Failure(f2.Error);
        NormalizedMessage normalized = ((Result<NormalizedMessage>.Success)parseResult).Value;

        // Echo detection (MSG-05)
        if (normalized.IsEcho)
        {
            _logger.LogDebug("Skipping echo message from platform {Platform}", platform);
            return new Result<InboundMessageResult>.Failure(
                new Error("ECHO_SKIPPED", "Echo message skipped.", ErrorType.Validation));
        }

        // Step 2.5: Fetch user profile from platform if not available in webhook
        if (string.IsNullOrEmpty(normalized.DisplayName))
        {
            try
            {
                Result<PlatformProfile> profileResult = await adapter.GetUserProfileAsync(
                    normalized.ExternalUserId, integration, ct);
                if (profileResult is Result<PlatformProfile>.Success profileSuccess)
                {
                    normalized = normalized with
                    {
                        DisplayName = profileSuccess.Value.DisplayName,
                        PictureUrl = profileSuccess.Value.PictureUrl
                    };
                    _logger.LogDebug("Fetched profile for {UserId}: {Name}", normalized.ExternalUserId, normalized.DisplayName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch profile for {UserId}, continuing with null", normalized.ExternalUserId);
            }
        }

        // Step 3: Upsert external user
        Result<ChatUser> userResult = await _chatUserService.UpsertExternalUserAsync(
            normalized.ExternalUserId, platform, integrationId, companyId,
            normalized.DisplayName, normalized.PictureUrl, ct);
        if (userResult is Result<ChatUser>.Failure f3)
            return new Result<InboundMessageResult>.Failure(f3.Error);
        ChatUser chatUser = ((Result<ChatUser>.Success)userResult).Value;

        // Step 4: Handle room state (find-or-create, reopen if closed/resolved)
        Result<(ChatRoom Room, bool IsNewRoom)> roomResult =
            await _roomStateService.HandleInboundRoomStateAsync(
                chatUser, integrationId, platform, companyId, ct);
        if (roomResult is Result<(ChatRoom Room, bool IsNewRoom)>.Failure f4)
            return new Result<InboundMessageResult>.Failure(f4.Error);
        (ChatRoom room, bool isNewRoom) = ((Result<(ChatRoom, bool)>.Success)roomResult).Value;

        // Step 5: Persist message
        long now = DateTimeHelper.NowUnixMilliseconds();
        ChatMessage chatMessage = new()
        {
            Id = Guid.NewGuid().ToString(),
            RoomId = room.Id,
            UserId = chatUser.Id,
            Content = normalized.Content,
            Type = normalized.MessageType,
            Platform = platform,
            Timestamp = now,
            Mid = normalized.PlatformMessageId,
            CompanyId = room.CompanyId,
            DeliveryStatus = MessageDeliveryState.Delivered,
            Attachment = normalized.Attachment,
            ReplyTo = normalized.ReplyTo,
            Product = normalized.Product,
            Order = normalized.Order,
            Referral = normalized.Referral,
            CreatedBy = chatUser.Id,
            CreatedTimestamp = now
        };
        await _messageRepo.CreateAsync(chatMessage, ct);

        // Step 5.5: Auto-create/link Customer CRM record (best-effort)
        try
        {
            CustomerService? customerService = _sp.GetService<CustomerService>();
            if (customerService is not null)
            {
                await customerService.EnsureCustomerFromChatUserAsync(
                    companyId, chatUser, platform, normalized.DisplayName, normalized.PictureUrl, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to auto-create/link customer for ChatUser {UserId}", chatUser.Id);
        }

        // Step 6: Auto-assign (best-effort; log on failure)
        Result<ChatRoom> assignResult = await _autoAssignmentService.TryAssignAsync(room, companyId, ct);
        if (assignResult is Result<ChatRoom>.Success assignSuccess)
            room = assignSuccess.Value;

        // Step 7: Map to DTOs
        ChatMessageDto messageDto = MessageMappingHelpers.ToDto(chatMessage, chatUser);
        ChatRoomDto roomDto = MessageMappingHelpers.ToDto(room);

        // Step 8: SignalR notifications
        // Send message to room group (for active viewers)
        await _signalRNotifier.SendToRoomAsync(room.Id, "ReceiveMessage", messageDto, ct);

        // Send room update to company group (for room list refresh)
        await _signalRNotifier.SendToCompanyAsync(room.CompanyId, "RoomUpdated", new
        {
            roomId = room.Id,
            changes = new { lastMessageTimestamp = chatMessage.Timestamp, unreadCount = room.Unread }
        }, ct);

        if (isNewRoom && !string.IsNullOrEmpty(room.AssignToUserId))
        {
            await _signalRNotifier.SendToUserAsync(
                room.AssignToUserId, "ReceiveRoom", roomDto, ct);
        }

        // Step 9: Publish notification event
        await _eventPublisher.PublishAsync(new SocialChatNotification
        {
            RoomId = room.Id,
            MessageId = chatMessage.Id,
            CompanyId = room.CompanyId,
            AssignedUserId = room.AssignToUserId,
            ParticipantUserIds = room.ParticipantUserIds,
            MessageContent = normalized.Content ?? "",
            SenderDisplayName = chatUser.DisplayName ?? "Customer",
            Platform = platform
        }, ct);

        // Step 10: Publish tag linking
        await _eventPublisher.PublishAsync(new LinkTagsToRoom
        {
            RoomId = room.Id,
            CompanyId = room.CompanyId,
            TagIds = new List<string>(),
            Source = "auto-tag"
        }, ct);

        // Step 11: Publish webhook integration
        await _eventPublisher.PublishAsync(new WebhookIntegration
        {
            RoomId = room.Id,
            CompanyId = room.CompanyId,
            MessageId = chatMessage.Id,
            Platform = platform,
            EventType = "message.received",
            Payload = new
            {
                messageId = chatMessage.Id,
                content = normalized.Content,
                type = normalized.MessageType
            }
        }, ct);

        // New room: publish greeting
        if (isNewRoom)
        {
            await _eventPublisher.PublishAsync(new SendGreetingMessage
            {
                RoomId = room.Id,
                CompanyId = room.CompanyId,
                IntegrationId = integrationId,
                Platform = platform,
                RecipientExternalId = chatUser.ExternalId
            }, ct);
        }

        // Step 12: Return result
        return new Result<InboundMessageResult>.Success(new InboundMessageResult
        {
            Room = roomDto,
            Message = messageDto,
            IsNewRoom = isNewRoom
        });
    }

    // ── Outbound (agent sends → platform → persist → notify) ──────────

    public async Task<Result<ChatMessageDto>> ProcessOutboundAsync(
        string senderUserId, string companyId, string roomId,
        string? content, string? messageType, CancellationToken ct)
    {
        // Step 1: Get room
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return new Result<ChatMessageDto>.Failure(
                new Error("ROOM_NOT_FOUND", "Room not found.", ErrorType.NotFound));

        // Step 2: Create message with Pending status (MSG-04); updated after send attempt
        long now = DateTimeHelper.NowUnixMilliseconds();
        ChatMessage chatMessage = new()
        {
            Id = Guid.NewGuid().ToString(),
            RoomId = room.Id,
            UserId = senderUserId,
            Content = content,
            Type = messageType ?? MessageType.Text,
            Platform = room.Platform,
            Timestamp = now,
            CompanyId = room.CompanyId,
            DeliveryStatus = MessageDeliveryState.Pending,
            CreatedBy = senderUserId,
            CreatedTimestamp = now
        };
        await _messageRepo.CreateAsync(chatMessage, ct);

        // Step 3: Auto-assign sender
        Result<ChatRoom> assignResult =
            await _autoAssignmentService.TryAssignSenderAsync(room, senderUserId, ct);
        if (assignResult is Result<ChatRoom>.Success senderAssign)
            room = senderAssign.Value;

        // Step 4: Transition room to InProgress (if New)
        if (room.State == ChatState.New)
        {
            Result<ChatRoom> transitionResult =
                await _roomStateService.TransitionToInProgressAsync(room, ct);
            if (transitionResult is Result<ChatRoom>.Success transitioned)
                room = transitioned.Value;
        }

        // Step 5: Send via platform adapter
        Result<IntegrationChannel> integrationResult =
            await _integrationService.ValidateAndGetAsync(room.IntegrationId, room.CompanyId, ct);
        if (integrationResult is Result<IntegrationChannel>.Failure f1)
        {
            chatMessage.DeliveryError = f1.Error.Message;
            await _messageRepo.UpdateAsync(chatMessage, ct);
            return new Result<ChatMessageDto>.Failure(f1.Error);
        }
        IntegrationChannel integration = ((Result<IntegrationChannel>.Success)integrationResult).Value;

        string? recipientExternalId = room.Customer?.ExternalId;
        if (string.IsNullOrEmpty(recipientExternalId))
        {
            chatMessage.DeliveryError = "Recipient external ID not found on room.";
            await _messageRepo.UpdateAsync(chatMessage, ct);
            return new Result<ChatMessageDto>.Failure(
                new Error("NO_RECIPIENT", "Recipient external ID not found.", ErrorType.Validation));
        }

        IPlatformAdapter adapter = GetAdapter(room.Platform);
        Result<PlatformSendResult> sendResult =
            await adapter.SendTextAsync(recipientExternalId, content ?? "", integration, ct);

        // Step 6: Update delivery status
        if (sendResult is Result<PlatformSendResult>.Success sendSuccess)
        {
            chatMessage.DeliveryStatus = MessageDeliveryState.Delivered;
            chatMessage.Mid = sendSuccess.Value.PlatformMessageId;
        }
        else if (sendResult is Result<PlatformSendResult>.Failure sendFailure)
        {
            chatMessage.DeliveryStatus = MessageDeliveryState.Failed;
            chatMessage.DeliveryError = sendFailure.Error.Message;
            _logger.LogWarning("Outbound send failed for room {RoomId}: {Error}",
                roomId, sendFailure.Error.Message);
        }
        chatMessage.UpdatedTimestamp = DateTimeHelper.NowUnixMilliseconds();
        await _messageRepo.UpdateAsync(chatMessage, ct);

        // Step 7: Broadcast via SignalR
        ChatMessageDto messageDto = MessageMappingHelpers.ToDto(chatMessage);
        await _signalRNotifier.SendToRoomAsync(room.Id, "ReceiveMessage", messageDto, ct);

        // Step 8: Return result
        if (chatMessage.DeliveryStatus == MessageDeliveryState.Failed)
        {
            return new Result<ChatMessageDto>.Failure(
                new Error("SEND_FAILED", chatMessage.DeliveryError ?? "Platform send failed.", ErrorType.PlatformError));
        }
        return new Result<ChatMessageDto>.Success(messageDto);
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private IPlatformAdapter GetAdapter(string platform) =>
        _sp.GetRequiredKeyedService<IPlatformAdapter>(platform);
}
