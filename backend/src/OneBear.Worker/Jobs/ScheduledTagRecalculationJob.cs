namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OneBear.Application.Customers.Services;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using Quartz;

[DisallowConcurrentExecution]
public class ScheduledTagRecalculationJob : IJob
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<ScheduledTagRecalculationJob> _logger;

    private const int BatchSize = 100;

    public ScheduledTagRecalculationJob(
        IServiceProvider sp,
        ILogger<ScheduledTagRecalculationJob> logger)
    {
        _sp = sp;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        CancellationToken ct = context.CancellationToken;
        _logger.LogInformation("ScheduledTagRecalculationJob started at {Time}", DateTimeOffset.UtcNow);

        int processed = 0;
        int changed = 0;
        int errors = 0;
        int skip = 0;

        while (true)
        {
            // Create a new scope per batch to keep memory bounded
            await using AsyncServiceScope scope = _sp.CreateAsyncScope();
            ICustomerRepository customerRepo = scope.ServiceProvider.GetRequiredService<ICustomerRepository>();
            TagRecalculationService tagRecalcService = scope.ServiceProvider.GetRequiredService<TagRecalculationService>();
            ActivityLogService activityLogService = scope.ServiceProvider.GetRequiredService<ActivityLogService>();

            List<Customer> batch = await customerRepo.GetActivePromotedBatchAsync(skip, BatchSize, ct);

            if (batch.Count == 0)
                break;

            foreach (Customer customer in batch)
            {
                try
                {
                    List<string> tagsBefore = customer.Tags.Select(t => t.Name).OrderBy(n => n).ToList();

                    Customer updated = tagRecalcService.RecalculateTagsAsync(customer);

                    List<string> tagsAfter = updated.Tags.Select(t => t.Name).OrderBy(n => n).ToList();
                    bool tagsChanged = !tagsBefore.SequenceEqual(tagsAfter);

                    if (tagsChanged)
                    {
                        await customerRepo.UpdateAsync(updated, ct);

                        IEnumerable<string> added = tagsAfter.Except(tagsBefore);
                        IEnumerable<string> removed = tagsBefore.Except(tagsAfter);

                        foreach (string tag in added)
                        {
                            string reason = updated.Tags
                                .FirstOrDefault(t => t.Name == tag)?.Reason ?? "AI recalculation";
                            await activityLogService.LogActivityAsync(
                                companyId: updated.CompanyId,
                                customerId: updated.Id,
                                type: "tag_change",
                                description: $"Tag '{tag}' added by AI: {reason}",
                                actorId: "ai",
                                actorName: "AI System",
                                ct: ct);
                        }

                        foreach (string tag in removed)
                        {
                            await activityLogService.LogActivityAsync(
                                companyId: updated.CompanyId,
                                customerId: updated.Id,
                                type: "tag_change",
                                description: $"Tag '{tag}' removed by AI",
                                actorId: "ai",
                                actorName: "AI System",
                                ct: ct);
                        }

                        changed++;
                    }

                    processed++;
                }
                catch (Exception ex)
                {
                    errors++;
                    _logger.LogError(ex, "Error recalculating tags for customer {CustomerId}", customer.Id);
                }
            }

            skip += batch.Count;

            if (batch.Count < BatchSize)
                break;
        }

        _logger.LogInformation(
            "ScheduledTagRecalculationJob completed: {Processed} processed, {Changed} tag changes, {Errors} errors",
            processed, changed, errors);
    }
}
