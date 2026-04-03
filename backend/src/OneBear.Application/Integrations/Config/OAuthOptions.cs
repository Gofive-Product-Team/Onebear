namespace OneBear.Application.Integrations.Config;

public class OAuthOptions
{
    public const string SectionName = "OAuth";

    public string CallbackBaseUrl { get; set; } = default!;
    public LineOAuthOptions Line { get; set; } = new();
    public FacebookOAuthOptions Facebook { get; set; } = new();
    public ShopeeOAuthOptions Shopee { get; set; } = new();
    public TikTokOAuthOptions TikTok { get; set; } = new();
    public LazadaOAuthOptions Lazada { get; set; } = new();
    public GoogleOAuthOptions Google { get; set; } = new();
    public MicrosoftOAuthOptions Microsoft { get; set; } = new();
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

public class ShopeeOAuthOptions
{
    public string PartnerId { get; set; } = default!;
    public string PartnerKey { get; set; } = default!;
    public string AuthUrl { get; set; } = "https://partner.shopeemobile.com/api/v2/shop/auth_partner";
    public string TokenUrl { get; set; } = "https://partner.shopeemobile.com/api/v2/auth/token/get";
}

public class TikTokOAuthOptions
{
    public string AppKey { get; set; } = default!;
    public string AppSecret { get; set; } = default!;
    public string AuthUrl { get; set; } = "https://services.tiktokshop.com/open/authorize";
    public string TokenUrl { get; set; } = "https://auth.tiktok-shops.com/api/v2/token/get";
}

public class LazadaOAuthOptions
{
    public string AppKey { get; set; } = default!;
    public string AppSecret { get; set; } = default!;
    public string AuthUrl { get; set; } = "https://auth.lazada.com/rest";
    public string TokenUrl { get; set; } = "https://auth.lazada.com/rest/auth/token/create";
}

public class GoogleOAuthOptions
{
    public string ClientId { get; set; } = default!;
    public string ClientSecret { get; set; } = default!;
    public string AuthUrl { get; set; } = "https://accounts.google.com/o/oauth2/v2/auth";
    public string TokenUrl { get; set; } = "https://oauth2.googleapis.com/token";
    public string Scopes { get; set; } = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly";
}

public class MicrosoftOAuthOptions
{
    public string ClientId { get; set; } = default!;
    public string ClientSecret { get; set; } = default!;
    public string AuthUrl { get; set; } = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
    public string TokenUrl { get; set; } = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    public string Scopes { get; set; } = "Mail.ReadWrite Mail.Send offline_access";
}
