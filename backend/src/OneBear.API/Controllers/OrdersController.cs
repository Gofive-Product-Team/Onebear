namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Orders.DTOs;
using OneBear.Application.Orders.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Interfaces.Repositories;

[ApiController]
[Route("api/v1/companies/{companyId}/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderManagementService _orderService;

    public OrdersController(OrderManagementService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>List orders (paginated, filtered, sorted).</summary>
    [HttpGet]
    public async Task<IActionResult> ListOrders(
        string companyId,
        [FromQuery] string? status = null,
        [FromQuery] string? customerId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sort = null,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? continuationToken = null,
        CancellationToken ct = default)
    {
        OrderQueryParams query = new()
        {
            Status = status,
            CustomerId = customerId,
            Search = search,
            Sort = sort,
            PageSize = pageSize,
            ContinuationToken = continuationToken,
        };

        (List<OrderDto> items, string? nextToken) = await _orderService.QueryAsync(companyId, query, ct);
        return Ok(new { data = items, continuationToken = nextToken, hasMore = nextToken != null });
    }

    /// <summary>Get order summary (counts by status + today's revenue).</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(string companyId, CancellationToken ct)
    {
        OrderSummaryDto summary = await _orderService.GetSummaryAsync(companyId, ct);
        return Ok(summary);
    }

    /// <summary>Get order by ID.</summary>
    [HttpGet("{orderId}", Name = "GetOrder")]
    public async Task<IActionResult> GetOrder(string companyId, string orderId, CancellationToken ct)
    {
        Result<OrderDto> result = await _orderService.GetByIdAsync(orderId, companyId, ct);
        return result.ToActionResult();
    }

    /// <summary>Create a new order.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrder(
        string companyId,
        [FromBody] CreateOrderRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<OrderDto> result = await _orderService.CreateAsync(companyId, userId, request, ct);
        return result.ToCreatedResult("GetOrder",
            new { companyId, orderId = (result as Result<OrderDto>.Success)?.Value?.Id });
    }

    /// <summary>Update order status (transition).</summary>
    [HttpPut("{orderId}/status")]
    public async Task<IActionResult> UpdateStatus(
        string companyId,
        string orderId,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        Result<OrderDto> result = await _orderService.UpdateStatusAsync(orderId, companyId, userId, request, ct);
        return result.ToActionResult();
    }
}
