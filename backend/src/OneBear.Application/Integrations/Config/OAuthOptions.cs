namespace OneBear.Application.Integrations.Config;

public class OAuthOptions
{
    public const string SectionName = "OAuth";

    public string CallbackBaseUrl { get; set; } = default!;
    public LineOAuthOptions Line { get; set; } = new();
    public FacebookOAuthOptions Facebook { get; set; } = new();
}

public class LineOAuthOptions
{
    public string ModuleAuthUrl { get; set; } = "https://manager.line.biz/module/auth/v1/authorize";
    public string TokenUrl { get; set; } = "https://api.line.me/oauth2/v2.1/token";
    public string ClientId { get; set; } = default!;
}

public class FacebookOAuthOptions
{
    public string AppId { get; set; } = default!;
    public string AppSecret { get; set; } = default!;
    public string GraphApiVersion { get; set; } = "v21.0";
}
