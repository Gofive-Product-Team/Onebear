using OneBear.Infrastructure.Caching;

namespace OneBear.Infrastructure.Tests.Caching;

public class CacheKeysTests
{
    [Fact]
    public void IntegrationChannel_GeneratesCorrectKey()
    {
        Assert.Equal("ic:comp1:ch1", CacheKeys.IntegrationChannel("comp1", "ch1"));
    }

    [Fact]
    public void IntegrationChannelList_GeneratesCorrectKey()
    {
        Assert.Equal("ic:list:comp1", CacheKeys.IntegrationChannelList("comp1"));
    }

    [Fact]
    public void ChatUser_GeneratesCorrectKey()
    {
        Assert.Equal("user:comp1:u1", CacheKeys.ChatUser("comp1", "u1"));
    }

    [Fact]
    public void ChatbotConfig_GeneratesCorrectKey()
    {
        Assert.Equal("chatbot:comp1", CacheKeys.ChatbotConfig("comp1"));
    }

    [Fact]
    public void FeatureSettings_GeneratesCorrectKey()
    {
        Assert.Equal("features:comp1", CacheKeys.FeatureSettings("comp1"));
    }

    [Fact]
    public void BadgeCount_GeneratesCorrectKey()
    {
        Assert.Equal("badge:comp1:u1", CacheKeys.BadgeCount("comp1", "u1"));
    }

    [Fact]
    public void IntegrationChannelTtl_IsOneHour()
    {
        Assert.Equal(TimeSpan.FromHours(1), CacheKeys.IntegrationChannelTtl);
    }

    [Fact]
    public void ChatUserTtl_IsFiveMinutes()
    {
        Assert.Equal(TimeSpan.FromMinutes(5), CacheKeys.ChatUserTtl);
    }

    [Fact]
    public void ChatbotConfigTtl_IsThirtyMinutes()
    {
        Assert.Equal(TimeSpan.FromMinutes(30), CacheKeys.ChatbotConfigTtl);
    }

    [Fact]
    public void FeatureSettingsTtl_IsFifteenMinutes()
    {
        Assert.Equal(TimeSpan.FromMinutes(15), CacheKeys.FeatureSettingsTtl);
    }

    [Fact]
    public void BadgeCountTtl_IsThirtySeconds()
    {
        Assert.Equal(TimeSpan.FromSeconds(30), CacheKeys.BadgeCountTtl);
    }
}
