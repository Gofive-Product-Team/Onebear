namespace OneBear.API.Auth;

public class AuthOptions
{
    public const string SectionName = "Authentication";

    public string Authority { get; set; } = "";
    public string Audience { get; set; } = "account";
    public bool RequireHttpsMetadata { get; set; } = true;
}
