namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

public class Booking : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("bookingId")]
    public string BookingId { get; set; } = default!; // e.g. "BK-2026-000001"

    [JsonPropertyName("customerId")]
    public string? CustomerId { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("roomId")]
    public string? RoomId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = BookingStatus.Confirmed;

    // Service
    [JsonPropertyName("serviceName")]
    public string ServiceName { get; set; } = default!;

    [JsonPropertyName("servicePrice")]
    public decimal ServicePrice { get; set; }

    [JsonPropertyName("serviceDurationMinutes")]
    public int ServiceDurationMinutes { get; set; }

    // Agent
    [JsonPropertyName("agentUserId")]
    public string? AgentUserId { get; set; }

    [JsonPropertyName("agentName")]
    public string? AgentName { get; set; }

    // Schedule
    [JsonPropertyName("dateTimestamp")]
    public long DateTimestamp { get; set; } // start of appointment (Unix ms)

    [JsonPropertyName("endTimestamp")]
    public long EndTimestamp { get; set; }

    // Reminders
    [JsonPropertyName("reminderSent")]
    public bool ReminderSent { get; set; }

    [JsonPropertyName("reminderTimestamp")]
    public long? ReminderTimestamp { get; set; }

    // Recurring
    [JsonPropertyName("isRecurring")]
    public bool IsRecurring { get; set; }

    [JsonPropertyName("recurringInterval")]
    public string? RecurringInterval { get; set; } // "weekly" | "biweekly" | "monthly"

    [JsonPropertyName("parentBookingId")]
    public string? ParentBookingId { get; set; }

    // Notes
    [JsonPropertyName("customerNote")]
    public string? CustomerNote { get; set; }

    [JsonPropertyName("internalNote")]
    public string? InternalNote { get; set; }

    [JsonPropertyName("cancellationReason")]
    public string? CancellationReason { get; set; }

    // No-show
    [JsonPropertyName("noShowTimestamp")]
    public long? NoShowTimestamp { get; set; }

    // Audit
    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}

public static class BookingStatus
{
    public const string Confirmed = "Confirmed";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string NoShow = "NoShow";
    public const string Rescheduled = "Rescheduled";
}

public class BookingService : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("durationMinutes")]
    public int DurationMinutes { get; set; } = 60;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("agentUserIds")]
    public List<string> AgentUserIds { get; set; } = new();

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}
