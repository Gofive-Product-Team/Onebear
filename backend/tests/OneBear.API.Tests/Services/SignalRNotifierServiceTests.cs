using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using OneBear.API.Hubs;
using OneBear.API.Services;

namespace OneBear.API.Tests.Services;

public class SignalRNotifierServiceTests
{
    private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
    private readonly Mock<IHubClients> _mockClients;
    private readonly Mock<IClientProxy> _mockGroupProxy;
    private readonly Mock<ILogger<SignalRNotifierService>> _mockLogger;
    private readonly SignalRNotifierService _service;

    public SignalRNotifierServiceTests()
    {
        _mockHubContext = new Mock<IHubContext<ChatHub>>();
        _mockClients = new Mock<IHubClients>();
        _mockGroupProxy = new Mock<IClientProxy>();
        _mockLogger = new Mock<ILogger<SignalRNotifierService>>();

        _mockHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockGroupProxy.Object);
        _mockClients.Setup(c => c.GroupExcept(It.IsAny<string>(), It.IsAny<IReadOnlyList<string>>())).Returns(_mockGroupProxy.Object);

        _service = new SignalRNotifierService(_mockHubContext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task SendToRoomAsync_ShouldTargetCorrectGroup()
    {
        // Arrange
        string roomId = "room-abc";
        string eventName = "TestEvent";
        object payload = new { message = "hello" };

        // Act
        await _service.SendToRoomAsync(roomId, eventName, payload);

        // Assert
        _mockClients.Verify(c => c.Group($"room:{roomId}"), Times.Once);
        _mockGroupProxy.Verify(
            p => p.SendCoreAsync(eventName, It.Is<object?[]>(args => args.Length == 1 && args[0] == payload), default),
            Times.Once);
    }

    [Fact]
    public async Task SendToUserAsync_ShouldTargetCorrectGroup()
    {
        // Arrange
        string userId = "user-xyz";
        string eventName = "TestEvent";
        object payload = new { badge = 5 };

        // Act
        await _service.SendToUserAsync(userId, eventName, payload);

        // Assert
        _mockClients.Verify(c => c.Group($"user:{userId}"), Times.Once);
        _mockGroupProxy.Verify(
            p => p.SendCoreAsync(eventName, It.Is<object?[]>(args => args.Length == 1 && args[0] == payload), default),
            Times.Once);
    }

    [Fact]
    public async Task SendToCompanyAsync_ShouldTargetCorrectGroup()
    {
        // Arrange
        string companyId = "company-123";
        string eventName = "CompanyEvent";
        object payload = new { announcement = "hello all" };

        // Act
        await _service.SendToCompanyAsync(companyId, eventName, payload);

        // Assert
        _mockClients.Verify(c => c.Group($"company:{companyId}"), Times.Once);
        _mockGroupProxy.Verify(
            p => p.SendCoreAsync(eventName, It.Is<object?[]>(args => args.Length == 1 && args[0] == payload), default),
            Times.Once);
    }

    [Fact]
    public async Task SendToRoomExceptAsync_ShouldExcludeConnection()
    {
        // Arrange
        string roomId = "room-abc";
        string excludeConnectionId = "conn-exclude";
        string eventName = "TestEvent";
        object payload = new { message = "except me" };

        // Act
        await _service.SendToRoomExceptAsync(roomId, excludeConnectionId, eventName, payload);

        // Assert
        _mockClients.Verify(
            c => c.GroupExcept($"room:{roomId}", It.Is<IReadOnlyList<string>>(list => list.Contains(excludeConnectionId))),
            Times.Once);
        _mockGroupProxy.Verify(
            p => p.SendCoreAsync(eventName, It.Is<object?[]>(args => args.Length == 1 && args[0] == payload), default),
            Times.Once);
    }

    [Fact]
    public async Task SendToRoomAsync_ShouldPassCancellationToken()
    {
        // Arrange
        string roomId = "room-abc";
        using CancellationTokenSource cts = new CancellationTokenSource();
        CancellationToken ct = cts.Token;

        // Act
        await _service.SendToRoomAsync(roomId, "Event", new { }, ct);

        // Assert
        _mockGroupProxy.Verify(
            p => p.SendCoreAsync("Event", It.IsAny<object?[]>(), ct),
            Times.Once);
    }
}
