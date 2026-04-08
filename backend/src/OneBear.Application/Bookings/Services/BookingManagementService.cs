namespace OneBear.Application.Bookings.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Bookings.DTOs;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class BookingManagementService
{
    private readonly IBookingRepository _bookingRepo;
    private readonly IBookingServiceRepository _serviceRepo;
    private readonly ILogger<BookingManagementService> _logger;

    public BookingManagementService(
        IBookingRepository bookingRepo,
        IBookingServiceRepository serviceRepo,
        ILogger<BookingManagementService> logger)
    {
        _bookingRepo = bookingRepo;
        _serviceRepo = serviceRepo;
        _logger = logger;
    }

    // ─── Bookings ─────────────────────────────────────────────────────────────

    public async Task<Result<BookingDto>> CreateBookingAsync(
        string companyId, string userId, CreateBookingRequest request, CancellationToken ct)
    {
        long endTimestamp = request.DateTimestamp + (request.ServiceDurationMinutes * 60 * 1000L);

        // Conflict check
        if (!string.IsNullOrEmpty(request.AgentUserId))
        {
            bool conflict = await _bookingRepo.HasConflictAsync(companyId, request.AgentUserId, request.DateTimestamp, endTimestamp, ct);
            if (conflict)
                return new Result<BookingDto>.Failure(new Error("TIME_CONFLICT", "Agent already has a booking at this time", ErrorType.Conflict));
        }

        int seq = await _bookingRepo.GetNextSequenceAsync(companyId, ct);

        Booking booking = new()
        {
            CompanyId = companyId,
            BookingId = $"BK-{DateTime.UtcNow:yyyy}-{seq:D6}",
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName,
            RoomId = request.RoomId,
            ServiceName = request.ServiceName,
            ServicePrice = request.ServicePrice,
            ServiceDurationMinutes = request.ServiceDurationMinutes,
            AgentUserId = request.AgentUserId,
            AgentName = request.AgentName,
            DateTimestamp = request.DateTimestamp,
            EndTimestamp = endTimestamp,
            CustomerNote = request.CustomerNote,
            IsRecurring = request.IsRecurring,
            RecurringInterval = request.RecurringInterval,
            CreatedBy = userId,
        };

        Booking created = await _bookingRepo.CreateAsync(booking, ct);
        _logger.LogInformation("Booking {BookingId} created for {ServiceName} at {Date}", created.BookingId, request.ServiceName, request.DateTimestamp);
        return new Result<BookingDto>.Success(MapToDto(created));
    }

    public async Task<Result<BookingDto>> GetByIdAsync(string id, string companyId, CancellationToken ct)
    {
        Booking? booking = await _bookingRepo.GetByIdAsync(id, companyId, ct);
        if (booking is null)
            return new Result<BookingDto>.Failure(new Error("BOOKING_NOT_FOUND", "Booking not found", ErrorType.NotFound));
        return new Result<BookingDto>.Success(MapToDto(booking));
    }

    public async Task<(List<BookingDto> Items, string? ContinuationToken)> QueryAsync(
        string companyId, BookingQueryParams query, CancellationToken ct)
    {
        (List<Booking> items, string? token) = await _bookingRepo.QueryAsync(companyId, query, ct);
        return (items.Select(MapToDto).ToList(), token);
    }

    public async Task<Result<BookingDto>> UpdateStatusAsync(
        string id, string companyId, string userId, UpdateBookingStatusRequest request, CancellationToken ct)
    {
        Booking? booking = await _bookingRepo.GetByIdAsync(id, companyId, ct);
        if (booking is null)
            return new Result<BookingDto>.Failure(new Error("BOOKING_NOT_FOUND", "Booking not found", ErrorType.NotFound));

        booking.Status = request.Status;
        booking.UpdatedBy = userId;

        if (request.CancellationReason is not null) booking.CancellationReason = request.CancellationReason;
        if (request.InternalNote is not null) booking.InternalNote = request.InternalNote;
        if (request.Status == BookingStatus.NoShow) booking.NoShowTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _bookingRepo.UpdateAsync(booking, ct);
        _logger.LogInformation("Booking {BookingId} status → {Status}", booking.BookingId, request.Status);
        return new Result<BookingDto>.Success(MapToDto(booking));
    }

    // ─── Services CRUD ────────────────────────────────────────────────────────

    public async Task<List<BookingServiceDto>> GetServicesAsync(string companyId, CancellationToken ct)
    {
        List<BookingService> services = await _serviceRepo.GetActiveAsync(companyId, ct);
        return services.Select(s => new BookingServiceDto
        {
            Id = s.Id, Name = s.Name, Price = s.Price, DurationMinutes = s.DurationMinutes,
            IsActive = s.IsActive, AgentUserIds = s.AgentUserIds, Description = s.Description,
        }).ToList();
    }

    public async Task<Result<BookingServiceDto>> CreateServiceAsync(
        string companyId, CreateBookingServiceRequest request, CancellationToken ct)
    {
        BookingService service = new()
        {
            CompanyId = companyId,
            Name = request.Name,
            Price = request.Price,
            DurationMinutes = request.DurationMinutes,
            Description = request.Description,
            AgentUserIds = request.AgentUserIds ?? new(),
        };
        await _serviceRepo.CreateAsync(service, ct);
        return new Result<BookingServiceDto>.Success(new BookingServiceDto
        {
            Id = service.Id, Name = service.Name, Price = service.Price, DurationMinutes = service.DurationMinutes,
            IsActive = service.IsActive, AgentUserIds = service.AgentUserIds, Description = service.Description,
        });
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private static BookingDto MapToDto(Booking b) => new()
    {
        Id = b.Id, BookingId = b.BookingId, CustomerId = b.CustomerId, CustomerName = b.CustomerName,
        Status = b.Status, ServiceName = b.ServiceName, ServicePrice = b.ServicePrice,
        ServiceDurationMinutes = b.ServiceDurationMinutes, AgentUserId = b.AgentUserId,
        AgentName = b.AgentName, DateTimestamp = b.DateTimestamp, EndTimestamp = b.EndTimestamp,
        IsRecurring = b.IsRecurring, RecurringInterval = b.RecurringInterval,
        CustomerNote = b.CustomerNote, CreatedTimestamp = b.CreatedTimestamp,
    };
}
