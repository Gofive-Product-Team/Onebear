using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class AuthConstantsTests
{
    [Fact]
    public void Schemes_ShouldHaveExpectedValues()
    {
        Assert.Equal("Bearer", AuthConstants.JwtBearerScheme);
        Assert.Equal("ApiKey", AuthConstants.ApiKeyScheme);
    }

    [Fact]
    public void ClaimTypes_ShouldHaveExpectedValues()
    {
        Assert.Equal("sub", AuthConstants.ClaimUserId);
        Assert.Equal("company_id", AuthConstants.ClaimCompanyId);
        Assert.Equal("permissions", AuthConstants.ClaimPermissions);
        Assert.Equal("display_name", AuthConstants.ClaimDisplayName);
        Assert.Equal("email", AuthConstants.ClaimEmail);
    }

    [Fact]
    public void ApiKeyScopes_ShouldHaveExpectedValues()
    {
        Assert.Equal("webhook", AuthConstants.ApiKeyScopeWebhook);
        Assert.Equal("ai-service", AuthConstants.ApiKeyScopeAiService);
        Assert.Equal("storage", AuthConstants.ApiKeyScopeStorage);
        Assert.Equal("system-bot", AuthConstants.ApiKeyScopeSystemBot);
    }

    [Fact]
    public void PolicyNames_ShouldHaveExpectedValues()
    {
        Assert.Equal("Chat.View", AuthConstants.PolicyChatView);
        Assert.Equal("Chat.Resolve", AuthConstants.PolicyChatResolve);
        Assert.Equal("Chat.Mention", AuthConstants.PolicyChatMention);
        Assert.Equal("Chat.AssignAll", AuthConstants.PolicyChatAssignAll);
        Assert.Equal("Chat.Admin", AuthConstants.PolicyChatAdmin);
    }
}
