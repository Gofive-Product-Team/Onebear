using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Integrations.DTOs;
using OneBear.Application.Integrations.Services;
using OneBear.Domain.Common;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}/oauth")]
[Authorize]
[EnableRateLimiting("api")]
public class OAuthController : ControllerBase
{
    private readonly OAuthService _oauthService;

    public OAuthController(OAuthService oauthService)
    {
        _oauthService = oauthService;
    }

    /// <summary>Generate an OAuth authorization URL for the given platform.</summary>
    [HttpGet("{platform}/auth-url")]
    public async Task<IActionResult> GetAuthUrl(
        string companyId, string platform, CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<OAuthAuthUrlResponse> result = await _oauthService.GenerateAuthUrlAsync(companyId, platform, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Handle OAuth callback (code exchange) for the given platform.</summary>
    [HttpPost("{platform}/callback")]
    public async Task<IActionResult> HandleCallback(
        string companyId, string platform,
        [FromBody] OAuthCallbackRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<OAuthConnectResponse> result = await _oauthService.HandleCallbackAsync(
            companyId, platform, request.Code, request.State, userId, request.ShopId, ct);
        return result.ToActionResult();
    }

    /// <summary>Connect a Facebook page using an access token from the Facebook JS SDK.</summary>
    [HttpPost("facebook/token")]
    public async Task<IActionResult> ConnectFacebook(
        string companyId,
        [FromBody] FacebookTokenRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<OAuthConnectResponse> result = await _oauthService.HandleFacebookTokenAsync(
            companyId, request.AccessToken, request.Name, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Connect a WhatsApp Business account using credentials from Facebook embedded signup.</summary>
    [HttpPost("whatsapp/token")]
    public async Task<IActionResult> ConnectWhatsApp(
        string companyId,
        [FromBody] WhatsAppTokenRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<OAuthConnectResponse> result = await _oauthService.HandleWhatsAppTokenAsync(
            companyId, request.AccessToken, request.PhoneNumberId, request.WabaId, userId, ct);
        return result.ToActionResult();
    }
}
