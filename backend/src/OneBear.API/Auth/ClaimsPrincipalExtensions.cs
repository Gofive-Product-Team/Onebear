using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace OneBear.API.Auth;

public static class ClaimsPrincipalExtensions
{
    public static string? GetUserId(this ClaimsPrincipal principal) =>
        principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
        ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    public static string? GetCompanyId(this ClaimsPrincipal principal) =>
        principal.FindFirst("company_id")?.Value;

    public static IEnumerable<int> GetPermissions(this ClaimsPrincipal principal) =>
        principal.FindAll("permissions")
            .Select(c => int.TryParse(c.Value, out int v) ? v : 0)
            .Where(v => v > 0);

    public static bool HasPermission(this ClaimsPrincipal principal, int permissionId) =>
        principal.GetPermissions().Contains(permissionId);

    public static string? GetDisplayName(this ClaimsPrincipal principal) =>
        principal.FindFirst("name")?.Value ?? principal.FindFirst(ClaimTypes.Name)?.Value;
}
