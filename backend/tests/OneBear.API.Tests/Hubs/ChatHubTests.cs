using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using OneBear.API.Auth;
using OneBear.API.Hubs;
using OneBear.Application.Common.Interfaces;

namespace OneBear.API.Tests.Hubs;

public class ChatHubTests
{
    private readonly Mock<IGroupManager> _mockGroups;
    private readonly Mock<IHubCallerClients> _mockClients;
    private readonly Mock<HubCallerContext> _mockContext;
    private readonly Mock<ILogger<ChatHub>> _mockLogger;
    private readonly Mock<IRoomAuthorizationService> _mockRoomAuth;
    private readonly Mock<IAttendanceService> _mockAttendance;
    private readonly Mock<ITypingTracker> _mockTypingTracker;
    private readonly ChatHub _hub;

    private const string TestUserId = "user-123";
    private const string TestCompanyId = "company-456";
    private const string TestConnectionId = "conn-789";
    private const string TestDisplayName = "Test Agent";

    public ChatHubTests()
    {
        _mockGroups = new Mock<IGroupManager>();
        _mockClients = new Mock<IHubCallerClients>();
        _mockContext = new Mock<HubCallerContext>();
        _mockLogger = new Mock<ILogger<ChatHub>>();
        _mockRoomAuth = new Mock<IRoomAuthorizationService>();
        _mockAttendance = new Mock<IAttendanceService>();
        _mockTypingTracker = new Mock<ITypingTracker>();

        // Set up user claims
        Claim[] claims = new[]
        {
            new Claim(AuthConstants.ClaimUserId, TestUserId),
            new Claim(AuthConstants.ClaimCompanyId, TestCompanyId),
            new Claim(AuthConstants.ClaimDisplayName, TestDisplayName)
        };
        ClaimsPrincipal user = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        _mockContext.Setup(c => c.User).Returns(user);
        _mockContext.Setup(c => c.ConnectionId).Returns(TestConnectionId);

        // Default: all rooms authorized
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(true);

        // Default: no attended rooms
        _mockAttendance.Setup(a => a.GetAttendedRoomsAsync(It.IsAny<string>()))
            .ReturnsAsync(Array.Empty<string>());

        _hub = new ChatHub(
            _mockLogger.Object,
            _mockRoomAuth.Object,
            _mockAttendance.Object,
            _mockTypingTracker.Object)
        {
            Groups = _mockGroups.Object,
            Clients = _mockClients.Object,
            Context = _mockContext.Object
        };
    }

    // ────────────────────────────────────────────────────────
    // OnConnectedAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task OnConnectedAsync_ShouldAddToUserAndCompanyGroups()
    {
        // Arrange
        Mock<ISingleClientProxy> mockCaller = new Mock<ISingleClientProxy>();
        _mockClients.Setup(c => c.Caller).Returns(mockCaller.Object);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, $"user:{TestUserId}", default),
            Times.Once);
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, $"company:{TestCompanyId}", default),
            Times.Once);
    }

    [Fact]
    public async Task OnConnectedAsync_ShouldSendConnectedEventToCaller()
    {
        // Arrange
        Mock<ISingleClientProxy> mockCaller = new Mock<ISingleClientProxy>();
        _mockClients.Setup(c => c.Caller).Returns(mockCaller.Object);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        mockCaller.Verify(
            c => c.SendCoreAsync("Connected", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Once);
    }

    [Fact]
    public async Task OnConnectedAsync_ShouldThrow_WhenNoClaimsPresent()
    {
        // Arrange
        _mockContext.Setup(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity()));

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _hub.OnConnectedAsync());
    }

    // ────────────────────────────────────────────────────────
    // OnDisconnectedAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task OnDisconnectedAsync_ShouldCleanUpAttendance()
    {
        // Arrange
        string[] attendedRooms = new[] { "room-1", "room-2" };
        _mockAttendance.Setup(a => a.GetAttendedRoomsAsync(TestConnectionId))
            .ReturnsAsync(attendedRooms);

        Mock<IClientProxy> mockGroupProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroupProxy.Object);

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _mockAttendance.Verify(a => a.ExitAllRoomsForConnectionAsync(TestConnectionId), Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_ShouldBroadcastAttendanceChangedForEachAttendedRoom()
    {
        // Arrange
        string[] attendedRooms = new[] { "room-1", "room-2" };
        _mockAttendance.Setup(a => a.GetAttendedRoomsAsync(TestConnectionId))
            .ReturnsAsync(attendedRooms);

        Mock<IClientProxy> mockGroupProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroupProxy.Object);

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert: AttendanceChanged sent for each room
        mockGroupProxy.Verify(
            c => c.SendCoreAsync("AttendanceChanged", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Exactly(attendedRooms.Length));
    }

    [Fact]
    public async Task OnDisconnectedAsync_ShouldComplete_WithException()
    {
        // Arrange
        _mockAttendance.Setup(a => a.GetAttendedRoomsAsync(TestConnectionId))
            .ReturnsAsync(Array.Empty<string>());
        Exception testException = new InvalidOperationException("test error");

        // Act
        await _hub.OnDisconnectedAsync(testException);

        // Assert -- should complete without rethrowing
        _mockAttendance.Verify(a => a.ExitAllRoomsForConnectionAsync(TestConnectionId), Times.Once);
    }

    // ────────────────────────────────────────────────────────
    // JoinRooms
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task JoinRooms_ShouldAddToRoomGroups_WhenAuthorized()
    {
        // Arrange
        string[] roomIds = new[] { "room-1", "room-2", "room-3" };
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        await _hub.JoinRooms(roomIds);

        // Assert
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, "room:room-1", default),
            Times.Once);
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, "room:room-2", default),
            Times.Once);
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, "room:room-3", default),
            Times.Once);
    }

    [Fact]
    public async Task JoinRooms_ShouldSkipUnauthorizedRoomsSilently()
    {
        // Arrange
        string[] roomIds = new[] { "room-allowed", "room-denied" };
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, "room-allowed"))
            .ReturnsAsync(true);
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, "room-denied"))
            .ReturnsAsync(false);

        // Act -- must not throw
        await _hub.JoinRooms(roomIds);

        // Assert: only allowed room joined
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, "room:room-allowed", default),
            Times.Once);
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, "room:room-denied", default),
            Times.Never);
    }

    [Fact]
    public async Task JoinRooms_ShouldHandleEmptyArray()
    {
        // Arrange
        string[] roomIds = Array.Empty<string>();

        // Act
        await _hub.JoinRooms(roomIds);

        // Assert
        _mockGroups.Verify(
            g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default),
            Times.Never);
    }

    // ────────────────────────────────────────────────────────
    // AttendRoom
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task AttendRoom_ShouldThrowHubException_WhenUnauthorized()
    {
        // Arrange
        string roomId = "room-denied";
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, roomId))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<HubException>(() => _hub.AttendRoom(roomId));
    }

    [Fact]
    public async Task AttendRoom_ShouldAddToPresenceGroupAndBroadcast_WhenAuthorized()
    {
        // Arrange
        string roomId = "room-1";
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, roomId)).ReturnsAsync(true);

        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.AttendRoom(roomId);

        // Assert
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, $"presence:{roomId}", default),
            Times.Once);
        _mockAttendance.Verify(
            a => a.RecordAttendAsync(TestConnectionId, roomId, TestUserId),
            Times.Once);
        mockClientProxy.Verify(
            c => c.SendCoreAsync("AttendanceChanged", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Once);
    }

    // ────────────────────────────────────────────────────────
    // ExitRoom
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task ExitRoom_ShouldRemoveFromPresenceGroupAndBroadcast()
    {
        // Arrange
        string roomId = "room-1";
        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.ExitRoom(roomId);

        // Assert
        _mockGroups.Verify(
            g => g.RemoveFromGroupAsync(TestConnectionId, $"presence:{roomId}", default),
            Times.Once);
        _mockAttendance.Verify(
            a => a.RecordExitAsync(TestConnectionId, roomId),
            Times.Once);
        mockClientProxy.Verify(
            c => c.SendCoreAsync("AttendanceChanged", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Once);
    }

    // ────────────────────────────────────────────────────────
    // LeaveRoom
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task LeaveRoom_ShouldRemoveFromRoomGroup()
    {
        // Arrange
        string roomId = "room-1";

        // Act
        await _hub.LeaveRoom(roomId);

        // Assert
        _mockGroups.Verify(
            g => g.RemoveFromGroupAsync(TestConnectionId, $"room:{roomId}", default),
            Times.Once);
    }

    // ────────────────────────────────────────────────────────
    // SendMessage
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task SendMessage_ShouldBroadcastToRoom_WhenAuthorized()
    {
        // Arrange
        SendMessagePayload payload = new SendMessagePayload
        {
            RoomId = "room-1",
            Content = "Hello, World!",
            MessageType = "Text"
        };
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, payload.RoomId)).ReturnsAsync(true);

        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group($"room:{payload.RoomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendMessage(payload);

        // Assert
        mockClientProxy.Verify(
            c => c.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Once);
    }

    [Fact]
    public async Task SendMessage_ShouldThrowHubException_WhenUnauthorized()
    {
        // Arrange
        SendMessagePayload payload = new SendMessagePayload
        {
            RoomId = "room-denied",
            Content = "Hello!"
        };
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, payload.RoomId)).ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<HubException>(() => _hub.SendMessage(payload));
    }

    [Fact]
    public async Task SendMessage_ShouldDefaultMessageTypeToText_WhenNull()
    {
        // Arrange
        SendMessagePayload payload = new SendMessagePayload
        {
            RoomId = "room-1",
            Content = "Hello!"
            // MessageType is null
        };
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, payload.RoomId)).ReturnsAsync(true);

        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group($"room:{payload.RoomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendMessage(payload);

        // Assert
        mockClientProxy.Verify(
            c => c.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Once);
    }

    // ────────────────────────────────────────────────────────
    // SendTyping
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task SendTyping_ShouldBroadcastToOthersInRoom_WhenAuthorized()
    {
        // Arrange
        string roomId = "room-1";
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, roomId)).ReturnsAsync(true);

        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.OthersInGroup($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendTyping(roomId, true);

        // Assert
        _mockTypingTracker.Verify(t => t.Track(TestUserId, roomId, true), Times.Once);
        mockClientProxy.Verify(
            c => c.SendCoreAsync("TypingIndicator", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Once);
    }

    [Fact]
    public async Task SendTyping_ShouldNotBroadcast_WhenUnauthorized()
    {
        // Arrange
        string roomId = "room-denied";
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, roomId)).ReturnsAsync(false);

        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.OthersInGroup($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act -- must not throw
        await _hub.SendTyping(roomId, true);

        // Assert: nothing sent and tracker not called
        _mockTypingTracker.Verify(t => t.Track(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
        mockClientProxy.Verify(
            c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), default),
            Times.Never);
    }

    [Fact]
    public async Task SendTyping_ShouldBroadcastStopTyping()
    {
        // Arrange
        string roomId = "room-1";
        _mockRoomAuth.Setup(r => r.CanAccessRoomAsync(TestUserId, roomId)).ReturnsAsync(true);

        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.OthersInGroup($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendTyping(roomId, false);

        // Assert
        _mockTypingTracker.Verify(t => t.Track(TestUserId, roomId, false), Times.Once);
        mockClientProxy.Verify(
            c => c.SendCoreAsync("TypingIndicator", It.Is<object?[]>(args => args.Length == 1), default),
            Times.Once);
    }
}
