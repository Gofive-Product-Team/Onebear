namespace OneBear.Application.Tests.Bookings;

using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Bookings.DTOs;
using OneBear.Application.Bookings.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class BookingManagementServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepoMock;
    private readonly Mock<IBookingServiceRepository> _serviceRepoMock;
    private readonly Mock<ILogger<BookingManagementService>> _loggerMock;
    private readonly BookingManagementService _sut;

    private const string CompanyId = "company-001";
    private const string UserId = "user-001";

    public BookingManagementServiceTests()
    {
        _bookingRepoMock = new Mock<IBookingRepository>();
        _serviceRepoMock = new Mock<IBookingServiceRepository>();
        _loggerMock = new Mock<ILogger<BookingManagementService>>();

        _bookingRepoMock.Setup(r => r.CreateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Booking b, CancellationToken _) => b);
        _bookingRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Booking b, CancellationToken _) => b);
        _bookingRepoMock.Setup(r => r.GetNextSequenceAsync(CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _bookingRepoMock.Setup(r => r.HasConflictAsync(CompanyId, It.IsAny<string>(), It.IsAny<long>(), It.IsAny<long>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        _sut = new BookingManagementService(_bookingRepoMock.Object, _serviceRepoMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task CreateBooking_ShouldSucceed_WhenNoConflict()
    {
        CreateBookingRequest request = new()
        {
            ServiceName = "Haircut", ServicePrice = 300, ServiceDurationMinutes = 45,
            AgentUserId = "agent-1", AgentName = "Niran", CustomerName = "Jane",
            DateTimestamp = DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeMilliseconds(),
        };

        Result<BookingDto> result = await _sut.CreateBookingAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<BookingDto>.Success>(result);
        BookingDto dto = ((Result<BookingDto>.Success)result).Value;
        Assert.Equal("Haircut", dto.ServiceName);
        Assert.Equal(300, dto.ServicePrice);
        Assert.StartsWith("BK-", dto.BookingId);
        Assert.Equal(BookingStatus.Confirmed, dto.Status);
    }

    [Fact]
    public async Task CreateBooking_ShouldFail_WhenAgentHasConflict()
    {
        _bookingRepoMock.Setup(r => r.HasConflictAsync(CompanyId, "agent-1", It.IsAny<long>(), It.IsAny<long>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        CreateBookingRequest request = new()
        {
            ServiceName = "Haircut", ServicePrice = 300, ServiceDurationMinutes = 45,
            AgentUserId = "agent-1", DateTimestamp = DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeMilliseconds(),
        };

        Result<BookingDto> result = await _sut.CreateBookingAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<BookingDto>.Failure>(result);
        Assert.Equal("TIME_CONFLICT", ((Result<BookingDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task CreateBooking_ShouldCalculateEndTimestamp()
    {
        long start = DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeMilliseconds();

        CreateBookingRequest request = new()
        {
            ServiceName = "Color", ServicePrice = 600, ServiceDurationMinutes = 90,
            DateTimestamp = start,
        };

        Result<BookingDto> result = await _sut.CreateBookingAsync(CompanyId, UserId, request, CancellationToken.None);

        BookingDto dto = ((Result<BookingDto>.Success)result).Value;
        Assert.Equal(start + (90 * 60 * 1000L), dto.EndTimestamp);
    }

    [Fact]
    public async Task UpdateStatus_ShouldSetNoShowTimestamp()
    {
        Booking booking = new() { Id = "b1", CompanyId = CompanyId, BookingId = "BK-001", Status = BookingStatus.Confirmed };
        _bookingRepoMock.Setup(r => r.GetByIdAsync("b1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(booking);

        Result<BookingDto> result = await _sut.UpdateStatusAsync("b1", CompanyId, UserId,
            new UpdateBookingStatusRequest { Status = BookingStatus.NoShow }, CancellationToken.None);

        Assert.IsType<Result<BookingDto>.Success>(result);
        _bookingRepoMock.Verify(r => r.UpdateAsync(It.Is<Booking>(b => b.NoShowTimestamp != null), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task UpdateStatus_ShouldReturnNotFound_WhenMissing()
    {
        _bookingRepoMock.Setup(r => r.GetByIdAsync("missing", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync((Booking?)null);

        Result<BookingDto> result = await _sut.UpdateStatusAsync("missing", CompanyId, UserId,
            new UpdateBookingStatusRequest { Status = BookingStatus.Cancelled }, CancellationToken.None);

        Assert.IsType<Result<BookingDto>.Failure>(result);
        Assert.Equal("BOOKING_NOT_FOUND", ((Result<BookingDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task GetServices_ShouldReturnActiveServices()
    {
        _serviceRepoMock.Setup(r => r.GetActiveAsync(CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<BookingService>
            {
                new() { Id = "s1", CompanyId = CompanyId, Name = "Haircut", Price = 300, DurationMinutes = 45, IsActive = true },
                new() { Id = "s2", CompanyId = CompanyId, Name = "Color", Price = 600, DurationMinutes = 90, IsActive = true },
            });

        List<BookingServiceDto> result = await _sut.GetServicesAsync(CompanyId, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Equal("Haircut", result[0].Name);
    }
}
