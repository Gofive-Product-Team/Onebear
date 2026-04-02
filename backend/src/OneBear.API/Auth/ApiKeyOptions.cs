namespace OneBear.API.Auth;

public class ApiKeyOptions
{
    public const string SectionName = "ApiKeys";

    public string Primary { get; set; } = string.Empty;
    public string Secondary { get; set; } = string.Empty;
    public string AiService { get; set; } = string.Empty;
}
