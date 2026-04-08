namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(List<Booking> Items, string? ContinuationToken)> QueryAsync(string companyId, BookingQueryParams query, CancellationToken ct = default);
    Task<Booking> CreateAsync(Booking booking, CancellationToken ct = default);
    Task<Booking> UpdateAsync(Booking booking, CancellationToken ct = default);
    Task<int> GetNextSequenceAsync(string companyId, CancellationToken ct = default);
    Task<List<Booking>> GetUpcomingRemindersAsync(long fromTimestamp, long toTimestamp, CancellationToken ct = default);
    Task<List<Booking>> GetByAgentAndDateRangeAsync(string companyId, string agentUserId, long from, long to, CancellationToken ct = default);
    Task<bool> HasConflictAsync(string companyId, string agentUserId, long startTimestamp, long endTimestamp, CancellationToken ct = default);
}

public interface IBookingServiceRepository
{
    Task<List<BookingService>> GetActiveAsync(string companyId, CancellationToken ct = default);
    Task<BookingService?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<BookingService> CreateAsync(BookingService service, CancellationToken ct = default);
    Task<BookingService> UpdateAsync(BookingService service, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}

public class BookingQueryParams
{
    public string? Status { get; set; }
    public string? AgentUserId { get; set; }
    public long? FromTimestamp { get; set; }
    public long? ToTimestamp { get; set; }
    public string? Search { get; set; }
    public int PageSize { get; set; } = 20;
    public string? ContinuationToken { get; set; }
}
