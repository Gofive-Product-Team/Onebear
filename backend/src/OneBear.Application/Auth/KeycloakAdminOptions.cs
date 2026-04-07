namespace OneBear.Application.Auth;

public class KeycloakAdminOptions
{
    public const string SectionName = "Keycloak";
    public string AdminBaseUrl { get; set; } = "";
    public string TokenUrl { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
}
