using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using OneBear.API.Auth;
using OneBear.API.Hubs;

namespace OneBear.API.Tests.Hubs;

public class ChatHubTests
{
    private readonly Mock<IGroupManager> _mockGroups;
    private readonly Mock<IHubCallerClients> _mockClients;
    private readonly Mock<HubCallerContext> _mockContext;
    private readonly Mock<ILogger<ChatHub>> _mockLogger;
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

        _hub = new ChatHub(_mockLogger.Object)
        {
            Groups = _mockGroups.Object,
            Clients = _mockClients.Object,
            Context = _mockContext.Object
        };
    }

    [Fact]
    public async Task OnConnectedAsync_ShouldAddToUserAndCompanyGroups()
    {
        // Arrange -- already set up in constructor

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
    public async Task OnConnectedAsync_ShouldThrow_WhenNoClaimsPresent()
    {
        // Arrange
        _mockContext.Setup(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity()));

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _hub.OnConnectedAsync());
    }

    [Fact]
    public async Task OnDisconnectedAsync_ShouldComplete_WithoutException()
    {
        // Arrange -- no additional setup needed

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert -- should complete without throwing
    }

    [Fact]
    public async Task OnDisconnectedAsync_ShouldComplete_WithException()
    {
        // Arrange
        Exception testException = new InvalidOperationException("test error");

        // Act
        await _hub.OnDisconnectedAsync(testException);

        // Assert -- should complete without throwing
    }

    [Fact]
    public async Task JoinRooms_ShouldAddToRoomGroups()
    {
        // Arrange
        string[] roomIds = new[] { "room-1", "room-2", "room-3" };

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

    [Fact]
    public async Task AttendRoom_ShouldAddToPresenceGroupAndBroadcast()
    {
        // Arrange
        string roomId = "room-1";
        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.AttendRoom(roomId);

        // Assert
        _mockGroups.Verify(
            g => g.AddToGroupAsync(TestConnectionId, $"presence:{roomId}", default),
            Times.Once);
        mockClientProxy.Verify(
            c => c.SendCoreAsync("AttendanceChanged", It.Is<object?[]>(args =>
                args.Length == 1), default),
            Times.Once);
    }

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
        mockClientProxy.Verify(
            c => c.SendCoreAsync("AttendanceChanged", It.Is<object?[]>(args =>
                args.Length == 1), default),
            Times.Once);
    }

    [Fact]
    public async Task SendMessage_ShouldBroadcastToRoom()
    {
        // Arrange
        SendMessagePayload payload = new SendMessagePayload
        {
            RoomId = "room-1",
            Content = "Hello, World!",
            MessageType = "Text"
        };
        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group($"room:{payload.RoomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendMessage(payload);

        // Assert
        mockClientProxy.Verify(
            c => c.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args =>
                args.Length == 1), default),
            Times.Once);
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
        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.Group($"room:{payload.RoomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendMessage(payload);

        // Assert
        mockClientProxy.Verify(
            c => c.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args =>
                args.Length == 1), default),
            Times.Once);
    }

    [Fact]
    public async Task SendTyping_ShouldBroadcastToOthersInRoom()
    {
        // Arrange
        string roomId = "room-1";
        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.OthersInGroup($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendTyping(roomId, true);

        // Assert
        mockClientProxy.Verify(
            c => c.SendCoreAsync("TypingIndicator", It.Is<object?[]>(args =>
                args.Length == 1), default),
            Times.Once);
    }

    [Fact]
    public async Task SendTyping_ShouldBroadcastStopTyping()
    {
        // Arrange
        string roomId = "room-1";
        Mock<IClientProxy> mockClientProxy = new Mock<IClientProxy>();
        _mockClients.Setup(c => c.OthersInGroup($"room:{roomId}")).Returns(mockClientProxy.Object);

        // Act
        await _hub.SendTyping(roomId, false);

        // Assert
        mockClientProxy.Verify(
            c => c.SendCoreAsync("TypingIndicator", It.Is<object?[]>(args =>
                args.Length == 1), default),
            Times.Once);
    }
}
