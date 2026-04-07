namespace OneBear.Domain.Enums;

public static class Permission
{
    // Chat (3001-3005)
    public const int ChatView = 3001;
    public const int ChatResolve = 3002;
    public const int ChatMention = 3003;
    public const int ChatAssign = 3004;
    public const int ChatAccessAll = 3005;

    // Customer (3010-3012)
    public const int CustomerView = 3010;
    public const int CustomerEdit = 3011;
    public const int CustomerExport = 3012;

    // Settings (3020-3021)
    public const int SettingsView = 3020;
    public const int SettingsManage = 3021;

    // Members (3030-3031)
    public const int MembersView = 3030;
    public const int MembersManage = 3031;

    // Dashboard (3040)
    public const int DashboardView = 3040;

    // AI (3050-3051)
    public const int AiConfig = 3050;
    public const int AiCredit = 3051;

    public static readonly int[] All = [
        ChatView, ChatResolve, ChatMention, ChatAssign, ChatAccessAll,
        CustomerView, CustomerEdit, CustomerExport,
        SettingsView, SettingsManage,
        MembersView, MembersManage,
        DashboardView,
        AiConfig, AiCredit
    ];

    public static readonly int[] OwnerPermissions = All;

    public static readonly int[] AdminPermissions = [
        ChatView, ChatResolve, ChatMention, ChatAssign, ChatAccessAll,
        CustomerView, CustomerEdit, CustomerExport,
        SettingsView, SettingsManage,
        MembersView,
        DashboardView,
        AiConfig
    ];

    public static readonly int[] AgentPermissions = [
        ChatView, ChatResolve, ChatMention,
        CustomerView,
        DashboardView
    ];
}
