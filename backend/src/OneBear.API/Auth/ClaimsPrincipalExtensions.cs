using System.Security.Claims;
using System.Text.Json;

namespace OneBear.API.Auth;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimUserId)
           ?? throw new UnauthorizedAccessException("Missing user ID claim");

    public static string GetCompanyId(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimCompanyId)
           ?? throw new UnauthorizedAccessException("Missing company ID claim");

    public static string? GetDisplayName(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimDisplayName);

    public static string? GetEmail(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimEmail);

    public static int[] GetPermissions(this ClaimsPrincipal principal)
    {
        string? claim = principal.FindFirstValue(AuthConstants.ClaimPermissions);
        if (string.IsNullOrEmpty(claim)) return [];
        return JsonSerializer.Deserialize<int[]>(claim) ?? [];
    }

    public static bool HasPermission(this ClaimsPrincipal principal, int permissionId)
        => principal.GetPermissions().Contains(permissionId);

    public static bool IsApiKeyAuth(this ClaimsPrincipal principal)
        => principal.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey);

    public static string? GetApiKeyScope(this ClaimsPrincipal principal)
        => principal.FindFirstValue(AuthConstants.ClaimApiKeyScope);
}
