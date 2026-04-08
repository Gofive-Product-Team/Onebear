namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Bookings.DTOs;
using OneBear.Application.Bookings.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Interfaces.Repositories;

[ApiController]
[Route("api/v1/companies/{companyId}/bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly BookingManagementService _bookingService;

    public BookingsController(BookingManagementService bookingService) => _bookingService = bookingService;

    [HttpGet]
    public async Task<IActionResult> List(string companyId, [FromQuery] string? status = null,
        [FromQuery] string? agentUserId = null, [FromQuery] long? from = null, [FromQuery] long? to = null,
        [FromQuery] string? search = null, [FromQuery] int pageSize = 20, [FromQuery] string? continuationToken = null, CancellationToken ct = default)
    {
        BookingQueryParams query = new() { Status = status, AgentUserId = agentUserId, FromTimestamp = from, ToTimestamp = to, Search = search, PageSize = pageSize, ContinuationToken = continuationToken };
        (List<BookingDto> items, string? next) = await _bookingService.QueryAsync(companyId, query, ct);
        return Ok(new { data = items, continuationToken = next, hasMore = next != null });
    }

    [HttpGet("{bookingId}")]
    public async Task<IActionResult> Get(string companyId, string bookingId, CancellationToken ct)
        => (await _bookingService.GetByIdAsync(bookingId, companyId, ct)).ToActionResult();

    [HttpPost]
    public async Task<IActionResult> Create(string companyId, [FromBody] CreateBookingRequest request, CancellationToken ct)
        => (await _bookingService.CreateBookingAsync(companyId, User.GetUserId(), request, ct)).ToActionResult();

    [HttpPut("{bookingId}/status")]
    public async Task<IActionResult> UpdateStatus(string companyId, string bookingId, [FromBody] UpdateBookingStatusRequest request, CancellationToken ct)
        => (await _bookingService.UpdateStatusAsync(bookingId, companyId, User.GetUserId(), request, ct)).ToActionResult();

    [HttpGet("services")]
    public async Task<IActionResult> GetServices(string companyId, CancellationToken ct)
        => Ok(await _bookingService.GetServicesAsync(companyId, ct));

    [HttpPost("services")]
    public async Task<IActionResult> CreateService(string companyId, [FromBody] CreateBookingServiceRequest request, CancellationToken ct)
        => (await _bookingService.CreateServiceAsync(companyId, request, ct)).ToActionResult();
}
