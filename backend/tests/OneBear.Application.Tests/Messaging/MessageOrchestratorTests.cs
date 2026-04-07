namespace OneBear.Application.Tests.Messaging;

using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Events;
using OneBear.Application.Messaging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class MessageOrchestratorTests
{
    #region Test Constants

    private const string CompanyId = "company-001";
    private const string IntegrationId = "int-001";
    private const string Platform = SocialPlatform.Line;
    private const string RoomId = "room-001";
    private const string UserId = "user-001";
    private const string ExternalUserId = "ext-user-001";
    private const string SenderUserId = "agent-001";

    #endregion

    #region Setup

    private record MockContainer(
        Mock<IServiceProvider> ServiceProvider,
        Mock<IPlatformAdapter> PlatformAdapter,
        Mock<IIntegrationService> IntegrationService,
        Mock<IChatUserService> ChatUserService,
        Mock<IRoomStateService> RoomStateService,
        Mock<IChatMessageRepository> MessageRepo,
        Mock<IChatRoomRepository> RoomRepo,
        Mock<IAutoAssignmentService> AutoAssignmentService,
        Mock<ISignalRNotifier> SignalRNotifier,
        Mock<IEventPublisher> EventPublisher,
        Mock<ILogger<MessageOrchestrator>> Logger);

    private static (MessageOrchestrator Sut, MockContainer Mocks) CreateSut()
    {
        Mock<IPlatformAdapter> adapterMock = new();
        Mock<IServiceProvider> spMock = new();
        Mock<IIntegrationService> integrationServiceMock = new();
        Mock<IChatUserService> chatUserServiceMock = new();
        Mock<IRoomStateService> roomStateServiceMock = new();
        Mock<IChatMessageRepository> messageRepoMock = new();
        Mock<IChatRoomRepository> roomRepoMock = new();
        Mock<IAutoAssignmentService> autoAssignmentServiceMock = new();
        Mock<ISignalRNotifier> signalRNotifierMock = new();
        Mock<IEventPublisher> eventPublisherMock = new();
        Mock<ILogger<MessageOrchestrator>> loggerMock = new();

        // Wire up keyed service provider for platform adapter resolution.
        // GetRequiredKeyedService checks `provider is IKeyedServiceProvider`,
        // so the mock must implement both IServiceProvider and IKeyedServiceProvider.
        Mock<IKeyedServiceProvider> keyedSpMock = spMock.As<IKeyedServiceProvider>();
        keyedSpMock.Setup(k => k.GetRequiredKeyedService(typeof(IPlatformAdapter), It.IsAny<object>()))
            .Returns(adapterMock.Object);

        // Default happy-path: integration is valid
        IntegrationChannel integration = CreateIntegration();
        integrationServiceMock
            .Setup(s => s.ValidateAndGetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<IntegrationChannel>.Success(integration));

        // Default happy-path: parse inbound returns normalized message
        adapterMock
            .Setup(a => a.ParseInboundMessageAsync(It.IsAny<JsonDocument>(), It.IsAny<IntegrationChannel>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<NormalizedMessage>.Success(CreateNormalizedMessage()));

        // Default happy-path: upsert user succeeds
        ChatUser chatUser = CreateChatUser();
        chatUserServiceMock
            .Setup(s => s.UpsertExternalUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<ChatUser>.Success(chatUser));

        // Default happy-path: room state returns new room
        ChatRoom room = CreateRoom(assignToUserId: SenderUserId);
        roomStateServiceMock
            .Setup(s => s.HandleInboundRoomStateAsync(
                It.IsAny<ChatUser>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<(ChatRoom Room, bool IsNewRoom)>.Success((room, true)));

        roomStateServiceMock
            .Setup(s => s.TransitionToInProgressAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom r, CancellationToken _) =>
            {
                r.State = ChatState.InProgress;
                return new Result<ChatRoom>.Success(r);
            });

        // Default happy-path: message repo returns passed-in message
        messageRepoMock
            .Setup(r => r.CreateAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatMessage msg, CancellationToken _) => msg);
        messageRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatMessage msg, CancellationToken _) => msg);

        // Default happy-path: auto-assign succeeds (returns room with AssignToUserId set)
        autoAssignmentServiceMock
            .Setup(s => s.TryAssignAsync(It.IsAny<ChatRoom>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom r, string _, CancellationToken __) =>
            {
                r.AssignToUserId ??= SenderUserId;
                return new Result<ChatRoom>.Success(r);
            });
        autoAssignmentServiceMock
            .Setup(s => s.TryAssignSenderAsync(It.IsAny<ChatRoom>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom r, string senderId, CancellationToken _) =>
            {
                r.AssignToUserId = senderId;
                return new Result<ChatRoom>.Success(r);
            });

        // Default happy-path: room repo returns room for outbound
        roomRepoMock
            .Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoom(state: ChatState.New, assignToUserId: null, withCustomer: true));

        // Default happy-path: adapter send text succeeds
        adapterMock
            .Setup(a => a.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IntegrationChannel>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<PlatformSendResult>.Success(new PlatformSendResult
            {
                Success = true,
                PlatformMessageId = "platform-msg-001"
            }));

        // Default happy-path: SignalR and EventPublisher do nothing (no return value needed)
        signalRNotifierMock
            .Setup(s => s.SendToRoomAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        signalRNotifierMock
            .Setup(s => s.SendToUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        eventPublisherMock
            .Setup(e => e.PublishAsync(It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        MockContainer mocks = new(
            spMock, adapterMock, integrationServiceMock, chatUserServiceMock,
            roomStateServiceMock, messageRepoMock, roomRepoMock, autoAssignmentServiceMock,
            signalRNotifierMock, eventPublisherMock, loggerMock);

        MessageOrchestrator sut = new(
            spMock.Object,
            integrationServiceMock.Object,
            chatUserServiceMock.Object,
            roomStateServiceMock.Object,
            messageRepoMock.Object,
            roomRepoMock.Object,
            autoAssignmentServiceMock.Object,
            signalRNotifierMock.Object,
            eventPublisherMock.Object,
            loggerMock.Object);

        return (sut, mocks);
    }

    #endregion

    #region ProcessInboundAsync

    [Fact]
    public async Task ProcessInboundAsync_ShouldCreateNewRoom_WhenNoExistingRoom()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        mocks.RoomStateService
            .Setup(s => s.HandleInboundRoomStateAsync(
                It.IsAny<ChatUser>(), IntegrationId, Platform, CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<(ChatRoom Room, bool IsNewRoom)>.Success(
                (CreateRoom(assignToUserId: SenderUserId), true)));

        using JsonDocument payload = JsonDocument.Parse("{}");

        // Act
        Result<InboundMessageResult> result = await sut.ProcessInboundAsync(
            Platform, IntegrationId, CompanyId, payload, CancellationToken.None);

        // Assert
        Assert.IsType<Result<InboundMessageResult>.Success>(result);
        Result<InboundMessageResult>.Success success = (Result<InboundMessageResult>.Success)result;
        Assert.True(success.Value.IsNewRoom);
        Assert.NotNull(success.Value.Room);
        Assert.NotNull(success.Value.Message);

        // Greeting event published for new room
        mocks.EventPublisher.Verify(
            e => e.PublishAsync(It.IsAny<SendGreetingMessage>(), It.IsAny<CancellationToken>()),
            Times.Once);

        // ReceiveRoom sent to assigned user
        mocks.SignalRNotifier.Verify(
            s => s.SendToUserAsync(SenderUserId, "ReceiveRoom", It.IsAny<object>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessInboundAsync_ShouldUpdateExistingRoom_WhenRoomExists()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        mocks.RoomStateService
            .Setup(s => s.HandleInboundRoomStateAsync(
                It.IsAny<ChatUser>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<(ChatRoom Room, bool IsNewRoom)>.Success(
                (CreateRoom(state: ChatState.InProgress, assignToUserId: SenderUserId), false)));

        using JsonDocument payload = JsonDocument.Parse("{}");

        // Act
        Result<InboundMessageResult> result = await sut.ProcessInboundAsync(
            Platform, IntegrationId, CompanyId, payload, CancellationToken.None);

        // Assert
        Assert.IsType<Result<InboundMessageResult>.Success>(result);
        Result<InboundMessageResult>.Success success = (Result<InboundMessageResult>.Success)result;
        Assert.False(success.Value.IsNewRoom);

        // Greeting event NOT published for existing room
        mocks.EventPublisher.Verify(
            e => e.PublishAsync(It.IsAny<SendGreetingMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessInboundAsync_ShouldAutoAssign_WhenRoomUnassigned()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        ChatRoom unassignedRoom = CreateRoom(assignToUserId: null);
        mocks.RoomStateService
            .Setup(s => s.HandleInboundRoomStateAsync(
                It.IsAny<ChatUser>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<(ChatRoom Room, bool IsNewRoom)>.Success((unassignedRoom, true)));

        // Auto-assign sets AssignToUserId
        mocks.AutoAssignmentService
            .Setup(s => s.TryAssignAsync(It.IsAny<ChatRoom>(), CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom r, string _, CancellationToken __) =>
            {
                r.AssignToUserId = SenderUserId;
                return new Result<ChatRoom>.Success(r);
            });

        using JsonDocument payload = JsonDocument.Parse("{}");

        // Act
        Result<InboundMessageResult> result = await sut.ProcessInboundAsync(
            Platform, IntegrationId, CompanyId, payload, CancellationToken.None);

        // Assert
        Assert.IsType<Result<InboundMessageResult>.Success>(result);

        // TryAssignAsync was called
        mocks.AutoAssignmentService.Verify(
            s => s.TryAssignAsync(It.IsAny<ChatRoom>(), CompanyId, It.IsAny<CancellationToken>()),
            Times.Once);

        // ReceiveRoom sent to the newly assigned user
        mocks.SignalRNotifier.Verify(
            s => s.SendToUserAsync(SenderUserId, "ReceiveRoom", It.IsAny<object>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessInboundAsync_ShouldNotProcess_WhenIntegrationInactive()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        mocks.IntegrationService
            .Setup(s => s.ValidateAndGetAsync(IntegrationId, CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<IntegrationChannel>.Failure(
                new Error("INTEGRATION_INACTIVE", "Integration is inactive.", ErrorType.Validation)));

        using JsonDocument payload = JsonDocument.Parse("{}");

        // Act
        Result<InboundMessageResult> result = await sut.ProcessInboundAsync(
            Platform, IntegrationId, CompanyId, payload, CancellationToken.None);

        // Assert
        Assert.IsType<Result<InboundMessageResult>.Failure>(result);
        Result<InboundMessageResult>.Failure failure = (Result<InboundMessageResult>.Failure)result;
        Assert.Equal("INTEGRATION_INACTIVE", failure.Error.Code);

        // No further services called
        mocks.PlatformAdapter.Verify(
            a => a.ParseInboundMessageAsync(It.IsAny<JsonDocument>(), It.IsAny<IntegrationChannel>(), It.IsAny<CancellationToken>()),
            Times.Never);
        mocks.ChatUserService.Verify(
            s => s.UpsertExternalUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        mocks.RoomStateService.Verify(
            s => s.HandleInboundRoomStateAsync(
                It.IsAny<ChatUser>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        mocks.MessageRepo.Verify(
            r => r.CreateAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessInboundAsync_ShouldSkipEchoMessages()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        NormalizedMessage echoMessage = CreateNormalizedMessage() with { IsEcho = true };
        mocks.PlatformAdapter
            .Setup(a => a.ParseInboundMessageAsync(It.IsAny<JsonDocument>(), It.IsAny<IntegrationChannel>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<NormalizedMessage>.Success(echoMessage));

        using JsonDocument payload = JsonDocument.Parse("{}");

        // Act
        Result<InboundMessageResult> result = await sut.ProcessInboundAsync(
            Platform, IntegrationId, CompanyId, payload, CancellationToken.None);

        // Assert
        Assert.IsType<Result<InboundMessageResult>.Failure>(result);
        Result<InboundMessageResult>.Failure failure = (Result<InboundMessageResult>.Failure)result;
        Assert.Equal("ECHO_SKIPPED", failure.Error.Code);

        // No room/message created
        mocks.ChatUserService.Verify(
            s => s.UpsertExternalUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        mocks.RoomStateService.Verify(
            s => s.HandleInboundRoomStateAsync(
                It.IsAny<ChatUser>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        mocks.MessageRepo.Verify(
            r => r.CreateAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessInboundAsync_ShouldPublishAllEvents()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        ChatRoom room = CreateRoom(assignToUserId: SenderUserId);
        mocks.RoomStateService
            .Setup(s => s.HandleInboundRoomStateAsync(
                It.IsAny<ChatUser>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<(ChatRoom Room, bool IsNewRoom)>.Success((room, true)));

        using JsonDocument payload = JsonDocument.Parse("{}");

        // Act
        Result<InboundMessageResult> result = await sut.ProcessInboundAsync(
            Platform, IntegrationId, CompanyId, payload, CancellationToken.None);

        // Assert
        Assert.IsType<Result<InboundMessageResult>.Success>(result);

        // SocialChatNotification published
        mocks.EventPublisher.Verify(
            e => e.PublishAsync(It.IsAny<SocialChatNotification>(), It.IsAny<CancellationToken>()),
            Times.Once);

        // LinkTagsToRoom published
        mocks.EventPublisher.Verify(
            e => e.PublishAsync(It.IsAny<LinkTagsToRoom>(), It.IsAny<CancellationToken>()),
            Times.Once);

        // WebhookIntegration published
        mocks.EventPublisher.Verify(
            e => e.PublishAsync(It.IsAny<WebhookIntegration>(), It.IsAny<CancellationToken>()),
            Times.Once);

        // SendGreetingMessage published (new room)
        mocks.EventPublisher.Verify(
            e => e.PublishAsync(It.IsAny<SendGreetingMessage>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    #endregion

    #region ProcessOutboundAsync

    [Fact]
    public async Task ProcessOutboundAsync_ShouldStartWithFailedDeliveryStatus()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        // Adapter send fails
        mocks.PlatformAdapter
            .Setup(a => a.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IntegrationChannel>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Result<PlatformSendResult>.Failure(
                new Error("SEND_ERROR", "Platform send failed.", ErrorType.PlatformError)));

        ChatMessage? createdMessage = null;
        mocks.MessageRepo
            .Setup(r => r.CreateAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatMessage msg, CancellationToken _) =>
            {
                createdMessage = msg;
                return msg;
            });

        // Act
        Result<ChatMessageDto> result = await sut.ProcessOutboundAsync(
            SenderUserId, CompanyId, RoomId, "Hello", MessageType.Text, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatMessageDto>.Failure>(result);

        // Message was created with Failed status initially
        Assert.NotNull(createdMessage);
        Assert.Equal(MessageDeliveryState.Failed, createdMessage!.DeliveryStatus);
    }

    [Fact]
    public async Task ProcessOutboundAsync_ShouldTransitionRoomToInProgress()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        ChatRoom newRoom = CreateRoom(state: ChatState.New, assignToUserId: null, withCustomer: true);
        mocks.RoomRepo
            .Setup(r => r.GetByIdAsync(RoomId, CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(newRoom);

        // Act
        Result<ChatMessageDto> result = await sut.ProcessOutboundAsync(
            SenderUserId, CompanyId, RoomId, "Hello", MessageType.Text, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatMessageDto>.Success>(result);

        mocks.RoomStateService.Verify(
            s => s.TransitionToInProgressAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessOutboundAsync_ShouldUpdateDeliveryStatusOnSuccess()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        ChatMessage? updatedMessage = null;
        mocks.MessageRepo
            .Setup(r => r.UpdateAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatMessage msg, CancellationToken _) =>
            {
                updatedMessage = msg;
                return msg;
            });

        // Act
        Result<ChatMessageDto> result = await sut.ProcessOutboundAsync(
            SenderUserId, CompanyId, RoomId, "Hello", MessageType.Text, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatMessageDto>.Success>(result);

        // Message UpdateAsync called with Delivered status
        Assert.NotNull(updatedMessage);
        Assert.Equal(MessageDeliveryState.Delivered, updatedMessage!.DeliveryStatus);
        Assert.Equal("platform-msg-001", updatedMessage.Mid);

        mocks.MessageRepo.Verify(
            r => r.UpdateAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessOutboundAsync_ShouldBroadcastViaSignalR()
    {
        // Arrange
        (MessageOrchestrator sut, MockContainer mocks) = CreateSut();

        // Act
        Result<ChatMessageDto> result = await sut.ProcessOutboundAsync(
            SenderUserId, CompanyId, RoomId, "Hello", MessageType.Text, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatMessageDto>.Success>(result);

        mocks.SignalRNotifier.Verify(
            s => s.SendToRoomAsync(RoomId, "ReceiveMessage", It.IsAny<object>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    #endregion

    #region Helpers

    private static IntegrationChannel CreateIntegration() => new()
    {
        Id = IntegrationId,
        CompanyId = CompanyId,
        Platform = Platform,
        IsActive = true,
        HasChatFeature = true,
        CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
    };

    private static NormalizedMessage CreateNormalizedMessage() => new()
    {
        ExternalUserId = ExternalUserId,
        Content = "Hello from customer",
        MessageType = MessageType.Text,
        PlatformMessageId = "platform-mid-001",
        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        IsEcho = false,
        DisplayName = "Test Customer",
        PictureUrl = "https://example.com/avatar.png"
    };

    private static ChatUser CreateChatUser() => new()
    {
        Id = UserId,
        CompanyId = CompanyId,
        ExternalId = ExternalUserId,
        DisplayName = "Test Customer",
        PictureUrl = "https://example.com/avatar.png",
        IntegrationId = IntegrationId,
        Platform = Platform,
        Type = "Customer",
        CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
    };

    private static ChatRoom CreateRoom(
        string state = ChatState.New,
        string? assignToUserId = SenderUserId,
        bool withCustomer = false) => new()
    {
        Id = RoomId,
        CompanyId = CompanyId,
        UserId = UserId,
        Platform = Platform,
        IntegrationId = IntegrationId,
        State = state,
        AssignToUserId = assignToUserId,
        Unread = 0,
        CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        LastMessageTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        Customer = withCustomer
            ? new RoomCustomer { Name = "Test Customer", ExternalId = ExternalUserId, PictureUrl = "https://example.com/avatar.png" }
            : null
    };

    #endregion
}
