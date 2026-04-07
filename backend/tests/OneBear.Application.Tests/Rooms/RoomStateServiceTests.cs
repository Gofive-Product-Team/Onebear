namespace OneBear.Application.Tests.Rooms;

using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Rooms.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;

public class RoomStateServiceTests
{
    private readonly Mock<IChatRoomRepository> _repoMock;
    private readonly Mock<ILogger<RoomStateService>> _loggerMock;
    private readonly RoomStateService _sut;

    public RoomStateServiceTests()
    {
        _repoMock = new Mock<IChatRoomRepository>();
        _loggerMock = new Mock<ILogger<RoomStateService>>();

        _repoMock.Setup(r => r.CreateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom room, CancellationToken _) => room);

        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom room, CancellationToken _) => room);

        _sut = new RoomStateService(_repoMock.Object, _loggerMock.Object);
    }

    #region HandleInboundRoomStateAsync

    [Fact]
    public async Task HandleInboundRoomStateAsync_ShouldCreateNewRoom_WhenNoExistingRoom()
    {
        // Arrange
        ChatUser chatUser = CreateChatUser();
        _repoMock.Setup(r => r.GetByUserAndIntegrationAsync("company-001", "user-001", "int-001", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom?)null);

        // Act
        Result<(ChatRoom Room, bool IsNewRoom)> result = await _sut.HandleInboundRoomStateAsync(
            chatUser, "int-001", "Line", "company-001", CancellationToken.None);

        // Assert
        Assert.IsType<Result<(ChatRoom Room, bool IsNewRoom)>.Success>(result);
        Result<(ChatRoom Room, bool IsNewRoom)>.Success success = (Result<(ChatRoom Room, bool IsNewRoom)>.Success)result;
        Assert.True(success.Value.IsNewRoom);
        Assert.Equal(ChatState.New, success.Value.Room.State);
        Assert.Equal("company-001", success.Value.Room.CompanyId);
        Assert.Equal("user-001", success.Value.Room.UserId);
        Assert.Equal("Line", success.Value.Room.Platform);
        Assert.Equal("int-001", success.Value.Room.IntegrationId);
        Assert.Equal(1, success.Value.Room.Unread);
        _repoMock.Verify(r => r.CreateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleInboundRoomStateAsync_ShouldCreateNewRoom_WhenExistingRoomClosed()
    {
        // Arrange
        ChatUser chatUser = CreateChatUser();
        ChatRoom closedRoom = CreateRoom(state: ChatState.Closed);
        _repoMock.Setup(r => r.GetByUserAndIntegrationAsync("company-001", "user-001", "int-001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(closedRoom);

        // Act
        Result<(ChatRoom Room, bool IsNewRoom)> result = await _sut.HandleInboundRoomStateAsync(
            chatUser, "int-001", "Line", "company-001", CancellationToken.None);

        // Assert
        Assert.IsType<Result<(ChatRoom Room, bool IsNewRoom)>.Success>(result);
        Result<(ChatRoom Room, bool IsNewRoom)>.Success success = (Result<(ChatRoom Room, bool IsNewRoom)>.Success)result;
        Assert.True(success.Value.IsNewRoom);
        Assert.Equal(ChatState.New, success.Value.Room.State);
        Assert.NotEqual(closedRoom.Id, success.Value.Room.Id);
        _repoMock.Verify(r => r.CreateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleInboundRoomStateAsync_ShouldUpdateExistingRoom_WhenRoomInProgress()
    {
        // Arrange
        ChatUser chatUser = CreateChatUser();
        ChatRoom existingRoom = CreateRoom(state: ChatState.InProgress);
        existingRoom.Unread = 5;
        long originalTimestamp = existingRoom.LastMessageTimestamp ?? 0;

        _repoMock.Setup(r => r.GetByUserAndIntegrationAsync("company-001", "user-001", "int-001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingRoom);

        // Act
        Result<(ChatRoom Room, bool IsNewRoom)> result = await _sut.HandleInboundRoomStateAsync(
            chatUser, "int-001", "Line", "company-001", CancellationToken.None);

        // Assert
        Assert.IsType<Result<(ChatRoom Room, bool IsNewRoom)>.Success>(result);
        Result<(ChatRoom Room, bool IsNewRoom)>.Success success = (Result<(ChatRoom Room, bool IsNewRoom)>.Success)result;
        Assert.False(success.Value.IsNewRoom);
        Assert.Equal(6, success.Value.Room.Unread);
        Assert.True(success.Value.Room.LastMessageTimestamp >= originalTimestamp);
        _repoMock.Verify(r => r.UpdateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()), Times.Once);
        _repoMock.Verify(r => r.CreateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region TransitionToInProgressAsync

    [Fact]
    public async Task TransitionToInProgress_ShouldSucceed_WhenStateIsNew()
    {
        // Arrange
        ChatRoom room = CreateRoom(state: ChatState.New);

        // Act
        Result<ChatRoom> result = await _sut.TransitionToInProgressAsync(room, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatRoom>.Success>(result);
        Result<ChatRoom>.Success success = (Result<ChatRoom>.Success)result;
        Assert.Equal(ChatState.InProgress, success.Value.State);
        _repoMock.Verify(r => r.UpdateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TransitionToInProgress_ShouldFail_WhenStateIsNotNew()
    {
        // Arrange
        ChatRoom room = CreateRoom(state: ChatState.InProgress);

        // Act
        Result<ChatRoom> result = await _sut.TransitionToInProgressAsync(room, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatRoom>.Failure>(result);
        Result<ChatRoom>.Failure failure = (Result<ChatRoom>.Failure)result;
        Assert.Equal("INVALID_TRANSITION", failure.Error.Code);
        Assert.Equal(ErrorType.Validation, failure.Error.Type);
        _repoMock.Verify(r => r.UpdateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region ReopenRoomAsync

    [Fact]
    public async Task ReopenRoom_ShouldResetIsAiMuted_WhenRoomClosed()
    {
        // Arrange
        ChatRoom room = CreateRoom(state: ChatState.Closed);
        room.IsAiMuted = true;

        // Act
        Result<ChatRoom> result = await _sut.ReopenRoomAsync(room, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatRoom>.Success>(result);
        Result<ChatRoom>.Success success = (Result<ChatRoom>.Success)result;
        Assert.Equal(ChatState.New, success.Value.State);
        Assert.False(success.Value.IsAiMuted);
        _repoMock.Verify(r => r.UpdateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region UpdateRoomWithRetryAsync

    [Fact]
    public async Task UpdateRoomWithRetryAsync_ShouldRetry_OnETagConflict()
    {
        // Arrange
        ChatRoom room = CreateRoom(state: ChatState.New);
        int callCount = 0;

        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<ChatRoom>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ChatRoom r, CancellationToken _) =>
            {
                callCount++;
                if (callCount == 1)
                    throw new Exception("412 PreconditionFailed");
                return r;
            });

        _repoMock.Setup(r => r.GetByIdAsync("room-001", "company-001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRoom());

        // Act
        Result<ChatRoom> result = await _sut.UpdateRoomWithRetryAsync(
            room, r => r.State = ChatState.InProgress, CancellationToken.None);

        // Assert
        Assert.IsType<Result<ChatRoom>.Success>(result);
        Assert.Equal(2, callCount);
        _repoMock.Verify(r => r.GetByIdAsync("room-001", "company-001", It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Helpers

    private static ChatRoom CreateRoom(string state = ChatState.New, string companyId = "company-001") => new()
    {
        Id = "room-001",
        CompanyId = companyId,
        UserId = "user-001",
        Platform = "Line",
        IntegrationId = "int-001",
        State = state,
        Unread = 0,
        CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        LastMessageTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
    };

    private static ChatUser CreateChatUser() => new()
    {
        Id = "user-001",
        CompanyId = "company-001",
        ExternalId = "ext-001",
        DisplayName = "Test User",
        IntegrationId = "int-001",
        Platform = "Line",
        Type = "Customer"
    };

    #endregion
}
