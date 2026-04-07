namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.Logging;
using Quartz;

[DisallowConcurrentExecution]
public class FollowUpJob : IJob
{
    private readonly ILogger<FollowUpJob> _logger;

    public FollowUpJob(ILogger<FollowUpJob> logger)
    {
        _logger = logger;
    }

    public Task Execute(IJobExecutionContext context)
    {
        _logger.LogInformation("FollowUpJob executing — skeleton, not yet querying rooms");
        return Task.CompletedTask;
    }
}
