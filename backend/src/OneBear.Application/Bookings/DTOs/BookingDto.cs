namespace OneBear.Application.Bookings.DTOs;

public record BookingDto
{
    public string Id { get; init; } = default!;
    public string BookingId { get; init; } = default!;
    public string? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public string Status { get; init; } = default!;
    public string ServiceName { get; init; } = default!;
    public decimal ServicePrice { get; init; }
    public int ServiceDurationMinutes { get; init; }
    public string? AgentUserId { get; init; }
    public string? AgentName { get; init; }
    public long DateTimestamp { get; init; }
    public long EndTimestamp { get; init; }
    public bool IsRecurring { get; init; }
    public string? RecurringInterval { get; init; }
    public string? CustomerNote { get; init; }
    public long CreatedTimestamp { get; init; }
}

public record CreateBookingRequest
{
    public string? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public string? RoomId { get; init; }
    public string ServiceName { get; init; } = default!;
    public decimal ServicePrice { get; init; }
    public int ServiceDurationMinutes { get; init; } = 60;
    public string? AgentUserId { get; init; }
    public string? AgentName { get; init; }
    public long DateTimestamp { get; init; }
    public string? CustomerNote { get; init; }
    public bool IsRecurring { get; init; }
    public string? RecurringInterval { get; init; }
}

public record UpdateBookingStatusRequest
{
    public string Status { get; init; } = default!;
    public string? CancellationReason { get; init; }
    public string? InternalNote { get; init; }
}

public record BookingServiceDto
{
    public string Id { get; init; } = default!;
    public string Name { get; init; } = default!;
    public decimal Price { get; init; }
    public int DurationMinutes { get; init; }
    public bool IsActive { get; init; }
    public List<string> AgentUserIds { get; init; } = new();
    public string? Description { get; init; }
}

public record CreateBookingServiceRequest
{
    public string Name { get; init; } = default!;
    public decimal Price { get; init; }
    public int DurationMinutes { get; init; } = 60;
    public string? Description { get; init; }
    public List<string>? AgentUserIds { get; init; }
}
