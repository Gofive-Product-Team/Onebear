namespace OneBear.API.Auth;

public class AuthOptions
{
    public const string SectionName = "Authentication";

    public string Authority { get; set; } = string.Empty;
    public string Audience { get; set; } = "onebear-api";
    public bool RequireHttpsMetadata { get; set; } = true;
    public string DevSigningKey { get; set; } = string.Empty;
}
