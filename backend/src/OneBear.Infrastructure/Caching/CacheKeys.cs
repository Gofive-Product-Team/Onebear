namespace OneBear.Infrastructure.Caching;

public static class CacheKeys
{
    public static string IntegrationChannel(string companyId, string channelId) => $"ic:{companyId}:{channelId}";
    public static string IntegrationChannelList(string companyId) => $"ic:list:{companyId}";
    public static readonly TimeSpan IntegrationChannelTtl = TimeSpan.FromHours(1);

    public static string ChatUser(string companyId, string userId) => $"user:{companyId}:{userId}";
    public static readonly TimeSpan ChatUserTtl = TimeSpan.FromMinutes(5);

    public static string ChatbotConfig(string companyId) => $"chatbot:{companyId}";
    public static readonly TimeSpan ChatbotConfigTtl = TimeSpan.FromMinutes(30);

    public static string FeatureSettings(string companyId) => $"features:{companyId}";
    public static readonly TimeSpan FeatureSettingsTtl = TimeSpan.FromMinutes(15);

    public static string BadgeCount(string companyId, string userId) => $"badge:{companyId}:{userId}";
    public static readonly TimeSpan BadgeCountTtl = TimeSpan.FromSeconds(30);
}
