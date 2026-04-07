using OneBear.API.Services;

namespace OneBear.API.Tests.Services;

public class AttendanceServiceTests
{
    private readonly AttendanceService _service;

    public AttendanceServiceTests()
    {
        _service = new AttendanceService();
    }

    [Fact]
    public async Task RecordAttend_ThenGetAttendedRooms_ShouldReturnRoom()
    {
        // Arrange
        string connectionId = "conn-1";
        string roomId = "room-1";
        string userId = "user-1";

        // Act
        await _service.RecordAttendAsync(connectionId, roomId, userId);
        IReadOnlyList<string> rooms = await _service.GetAttendedRoomsAsync(connectionId);

        // Assert
        Assert.Contains(roomId, rooms);
    }

    [Fact]
    public async Task RecordAttend_MultipleTimes_ShouldNotDuplicateRoom()
    {
        // Arrange
        string connectionId = "conn-1";
        string roomId = "room-1";
        string userId = "user-1";

        // Act
        await _service.RecordAttendAsync(connectionId, roomId, userId);
        await _service.RecordAttendAsync(connectionId, roomId, userId);
        IReadOnlyList<string> rooms = await _service.GetAttendedRoomsAsync(connectionId);

        // Assert: only one entry
        Assert.Single(rooms, r => r == roomId);
    }

    [Fact]
    public async Task RecordAttend_MultipleRooms_ShouldReturnAll()
    {
        // Arrange
        string connectionId = "conn-1";
        string userId = "user-1";

        // Act
        await _service.RecordAttendAsync(connectionId, "room-1", userId);
        await _service.RecordAttendAsync(connectionId, "room-2", userId);
        await _service.RecordAttendAsync(connectionId, "room-3", userId);
        IReadOnlyList<string> rooms = await _service.GetAttendedRoomsAsync(connectionId);

        // Assert
        Assert.Contains("room-1", rooms);
        Assert.Contains("room-2", rooms);
        Assert.Contains("room-3", rooms);
    }

    [Fact]
    public async Task RecordExit_ShouldRemoveRoom()
    {
        // Arrange
        string connectionId = "conn-1";
        string userId = "user-1";
        await _service.RecordAttendAsync(connectionId, "room-1", userId);
        await _service.RecordAttendAsync(connectionId, "room-2", userId);

        // Act
        await _service.RecordExitAsync(connectionId, "room-1");
        IReadOnlyList<string> rooms = await _service.GetAttendedRoomsAsync(connectionId);

        // Assert
        Assert.DoesNotContain("room-1", rooms);
        Assert.Contains("room-2", rooms);
    }

    [Fact]
    public async Task RecordExit_WhenRoomNotAttended_ShouldNotThrow()
    {
        // Arrange
        string connectionId = "conn-1";
        await _service.RecordAttendAsync(connectionId, "room-1", "user-1");

        // Act -- exit a room that was not attended
        await _service.RecordExitAsync(connectionId, "room-not-attended");

        // Assert: original rooms unchanged
        IReadOnlyList<string> rooms = await _service.GetAttendedRoomsAsync(connectionId);
        Assert.Contains("room-1", rooms);
    }

    [Fact]
    public async Task ExitAllRooms_ShouldClearAllRooms()
    {
        // Arrange
        string connectionId = "conn-1";
        string userId = "user-1";
        await _service.RecordAttendAsync(connectionId, "room-1", userId);
        await _service.RecordAttendAsync(connectionId, "room-2", userId);

        // Act
        await _service.ExitAllRoomsForConnectionAsync(connectionId);
        IReadOnlyList<string> rooms = await _service.GetAttendedRoomsAsync(connectionId);

        // Assert
        Assert.Empty(rooms);
    }

    [Fact]
    public async Task GetAttendedRooms_ForUnknownConnection_ShouldReturnEmpty()
    {
        // Arrange
        string connectionId = "conn-unknown";

        // Act
        IReadOnlyList<string> rooms = await _service.GetAttendedRoomsAsync(connectionId);

        // Assert
        Assert.Empty(rooms);
    }

    [Fact]
    public async Task ExitAllRooms_ForUnknownConnection_ShouldNotThrow()
    {
        // Act & Assert -- should complete without throwing
        await _service.ExitAllRoomsForConnectionAsync("conn-unknown");
    }

    [Fact]
    public async Task RecordAttend_DifferentConnections_ShouldBeIsolated()
    {
        // Arrange
        await _service.RecordAttendAsync("conn-1", "room-1", "user-1");
        await _service.RecordAttendAsync("conn-2", "room-2", "user-2");

        // Act
        IReadOnlyList<string> rooms1 = await _service.GetAttendedRoomsAsync("conn-1");
        IReadOnlyList<string> rooms2 = await _service.GetAttendedRoomsAsync("conn-2");

        // Assert: each connection sees only its own rooms
        Assert.Contains("room-1", rooms1);
        Assert.DoesNotContain("room-2", rooms1);
        Assert.Contains("room-2", rooms2);
        Assert.DoesNotContain("room-1", rooms2);
    }
}
