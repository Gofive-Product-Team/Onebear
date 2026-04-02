using OneBear.Domain.Enums;

namespace OneBear.Domain.Tests.Enums;

public class StringEnumTests
{
    [Fact]
    public void ChatState_All_ContainsAllConstants()
    {
        Assert.Equal(4, ChatState.All.Length);
        Assert.Contains("New", ChatState.All);
        Assert.Contains("InProgress", ChatState.All);
        Assert.Contains("Closed", ChatState.All);
        Assert.Contains("Resolved", ChatState.All);
    }

    [Fact]
    public void ChatState_All_HasNoDuplicates()
    {
        Assert.Equal(ChatState.All.Length, ChatState.All.Distinct().Count());
    }

    [Fact]
    public void SocialPlatform_All_ContainsAllPlatforms()
    {
        Assert.Equal(8, SocialPlatform.All.Length);
        Assert.Contains("Line", SocialPlatform.All);
        Assert.Contains("Facebook", SocialPlatform.All);
        Assert.Contains("Instagram", SocialPlatform.All);
        Assert.Contains("WhatsApp", SocialPlatform.All);
        Assert.Contains("Email", SocialPlatform.All);
        Assert.Contains("TikTok", SocialPlatform.All);
        Assert.Contains("Lazada", SocialPlatform.All);
        Assert.Contains("Shopee", SocialPlatform.All);
    }

    [Fact]
    public void MessageType_All_ContainsAllTypes()
    {
        Assert.Equal(19, MessageType.All.Length);
        Assert.Contains("Text", MessageType.All);
        Assert.Contains("Image", MessageType.All);
        Assert.Contains("System", MessageType.All);
        Assert.Equal(MessageType.All.Length, MessageType.All.Distinct().Count());
    }

    [Fact]
    public void MessageDeliveryState_All_ContainsAllStates()
    {
        Assert.Equal(5, MessageDeliveryState.All.Length);
        Assert.Contains("Pending", MessageDeliveryState.All);
        Assert.Contains("Failed", MessageDeliveryState.All);
        Assert.Equal(MessageDeliveryState.All.Length, MessageDeliveryState.All.Distinct().Count());
    }

    [Fact]
    public void UserType_All_ContainsAllTypes()
    {
        Assert.Equal(3, UserType.All.Length);
        Assert.Contains("Customer", UserType.All);
        Assert.Contains("Agent", UserType.All);
        Assert.Contains("Bot", UserType.All);
    }

    [Fact]
    public void Permission_All_ContainsAllPermissions()
    {
        Assert.Equal(5, Permission.All.Length);
        Assert.Contains(3001, Permission.All);
        Assert.Contains(3005, Permission.All);
    }
}
