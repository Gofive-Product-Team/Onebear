using OneBear.Domain.Entities;
using OneBear.Domain.Enums;

namespace OneBear.Domain.Tests.Entities;

public class ChatRoomTests
{
    [Fact]
    public void NewRoom_ShouldHaveDefaultValues()
    {
        ChatRoom room = new()
        {
            CompanyId = "company-1",
            UserId = "user-1",
            Platform = SocialPlatform.Line,
            IntegrationId = "int-1"
        };

        Assert.NotNull(room.Id);
        Assert.Equal("New", room.State);
        Assert.Equal(1, room.SchemaVersion);
        Assert.Equal(0, room.Unread);
        Assert.False(room.IsAiMuted);
        Assert.Empty(room.ParticipantUserIds);
        Assert.Empty(room.Tags);
    }
}
