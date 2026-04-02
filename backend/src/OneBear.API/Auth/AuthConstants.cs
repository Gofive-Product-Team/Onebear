namespace OneBear.API.Auth;

public static class AuthConstants
{
    // Authentication schemes
    public const string JwtBearerScheme = "Bearer";
    public const string ApiKeyScheme = "ApiKey";

    // Claim types
    public const string ClaimUserId = "sub";
    public const string ClaimCompanyId = "company_id";
    public const string ClaimPermissions = "permissions";
    public const string ClaimDisplayName = "display_name";
    public const string ClaimEmail = "email";

    // API key claims
    public const string ClaimAuthMethod = "auth_method";
    public const string ClaimAuthMethodApiKey = "api_key";
    public const string ClaimApiKeyScope = "api_key_scope";

    // API key scopes
    public const string ApiKeyScopeWebhook = "webhook";
    public const string ApiKeyScopeAiService = "ai-service";
    public const string ApiKeyScopeStorage = "storage";
    public const string ApiKeyScopeSystemBot = "system-bot";

    // Policy names
    public const string PolicyChatView = "Chat.View";
    public const string PolicyChatResolve = "Chat.Resolve";
    public const string PolicyChatMention = "Chat.Mention";
    public const string PolicyChatAssignAll = "Chat.AssignAll";
    public const string PolicyChatAdmin = "Chat.Admin";
}
