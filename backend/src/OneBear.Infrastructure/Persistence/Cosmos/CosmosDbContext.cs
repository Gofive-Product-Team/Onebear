namespace OneBear.Infrastructure.Persistence.Cosmos;

using Microsoft.Azure.Cosmos;

public class CosmosDbContext : IDisposable
{
    private readonly CosmosClient _client;
    private readonly string _databaseName;
    private Database? _database;

    public CosmosDbContext(CosmosClient client, string databaseName)
    {
        _client = client;
        _databaseName = databaseName;
    }

    private Database Database => _database ??= _client.GetDatabase(_databaseName);

    public Container Rooms => Database.GetContainer("Rooms");
    public Container Messages => Database.GetContainer("Messages");
    public Container Users => Database.GetContainer("Users");
    public Container IntegrationChannels => Database.GetContainer("IntegrationChannels");
    public Container Attachments => Database.GetContainer("Attachments");
    public Container FollowupSchedules => Database.GetContainer("FollowupSchedules");
    public Container ChatbotConfigurations => Database.GetContainer("ChatbotConfigurations");
    public Container CompanyFeatureSettings => Database.GetContainer("CompanyFeatureSettings");
    public Container UserVerifications => Database.GetContainer("UserVerifications");

    public async Task EnsureDatabaseCreatedAsync(CancellationToken ct = default)
    {
        DatabaseResponse dbResponse = await _client.CreateDatabaseIfNotExistsAsync(_databaseName, cancellationToken: ct);
        _database = dbResponse.Database;

        await CreateContainerAsync("Rooms", "/companyId", GetRoomsIndexingPolicy(), ct);
        await CreateContainerAsync("Messages", "/roomId", GetMessagesIndexingPolicy(), ct);
        await CreateContainerAsync("Users", "/companyId", GetUsersIndexingPolicy(), ct);
        await CreateContainerAsync("IntegrationChannels", "/companyId", GetIntegrationChannelsIndexingPolicy(), ct);
        await CreateContainerAsync("Attachments", "/roomId", null, ct);
        await CreateContainerAsync("FollowupSchedules", "/companyId", GetFollowupSchedulesIndexingPolicy(), ct);
        await CreateContainerAsync("ChatbotConfigurations", "/companyId", null, ct);
        await CreateContainerAsync("CompanyFeatureSettings", "/companyId", null, ct);
        await CreateContainerAsync("UserVerifications", "/companyId", null, ct);
    }

    private async Task CreateContainerAsync(string name, string partitionKeyPath, IndexingPolicy? indexingPolicy, CancellationToken ct)
    {
        ContainerProperties properties = new(name, partitionKeyPath);
        if (indexingPolicy is not null)
        {
            properties.IndexingPolicy = indexingPolicy;
        }
        await _database!.CreateContainerIfNotExistsAsync(properties, cancellationToken: ct);
    }

    private static IndexingPolicy GetRoomsIndexingPolicy()
    {
        IndexingPolicy policy = new() { IndexingMode = IndexingMode.Consistent, Automatic = true };
        policy.IncludedPaths.Add(new IncludedPath { Path = "/*" });
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/customer/*" });
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/sessions/*" });
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/tags/*" });
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/participantUserIds/*" });
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/attendedUserIds/*" });
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/followupContent/?" });
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/\"_etag\"/?" });

        policy.CompositeIndexes.Add(new([
            new() { Path = "/state", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/lastMessageTimestamp", Order = CompositePathSortOrder.Descending }
        ]));
        policy.CompositeIndexes.Add(new([
            new() { Path = "/state", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/platform", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/lastMessageTimestamp", Order = CompositePathSortOrder.Descending }
        ]));
        policy.CompositeIndexes.Add(new([
            new() { Path = "/state", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/assignToUserId", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/lastMessageTimestamp", Order = CompositePathSortOrder.Descending }
        ]));
        policy.CompositeIndexes.Add(new([
            new() { Path = "/state", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/unread", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/lastMessageTimestamp", Order = CompositePathSortOrder.Descending }
        ]));
        policy.CompositeIndexes.Add(new([
            new() { Path = "/followupTimestamp", Order = CompositePathSortOrder.Ascending }
        ]));

        return policy;
    }

    private static IndexingPolicy GetMessagesIndexingPolicy()
    {
        IndexingPolicy policy = new() { IndexingMode = IndexingMode.Consistent, Automatic = true };
        policy.ExcludedPaths.Add(new ExcludedPath { Path = "/*" });
        policy.IncludedPaths.Add(new IncludedPath { Path = "/timestamp/?" });
        policy.IncludedPaths.Add(new IncludedPath { Path = "/isDeleted/?" });
        policy.IncludedPaths.Add(new IncludedPath { Path = "/mid/?" });
        policy.IncludedPaths.Add(new IncludedPath { Path = "/companyId/?" });
        policy.IncludedPaths.Add(new IncludedPath { Path = "/userId/?" });
        policy.IncludedPaths.Add(new IncludedPath { Path = "/type/?" });
        policy.IncludedPaths.Add(new IncludedPath { Path = "/deliveryStatus/?" });

        policy.CompositeIndexes.Add(new([
            new() { Path = "/isDeleted", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/timestamp", Order = CompositePathSortOrder.Descending }
        ]));

        return policy;
    }

    private static IndexingPolicy GetUsersIndexingPolicy()
    {
        IndexingPolicy policy = new() { IndexingMode = IndexingMode.Consistent, Automatic = true };
        policy.IncludedPaths.Add(new IncludedPath { Path = "/*" });

        policy.CompositeIndexes.Add(new([
            new() { Path = "/externalId", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/platform", Order = CompositePathSortOrder.Ascending }
        ]));
        policy.CompositeIndexes.Add(new([
            new() { Path = "/type", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/isActive", Order = CompositePathSortOrder.Ascending }
        ]));

        return policy;
    }

    private static IndexingPolicy GetIntegrationChannelsIndexingPolicy()
    {
        IndexingPolicy policy = new() { IndexingMode = IndexingMode.Consistent, Automatic = true };
        policy.IncludedPaths.Add(new IncludedPath { Path = "/*" });

        policy.CompositeIndexes.Add(new([
            new() { Path = "/platform", Order = CompositePathSortOrder.Ascending }
        ]));
        policy.CompositeIndexes.Add(new([
            new() { Path = "/isActive", Order = CompositePathSortOrder.Ascending }
        ]));

        return policy;
    }

    private static IndexingPolicy GetFollowupSchedulesIndexingPolicy()
    {
        IndexingPolicy policy = new() { IndexingMode = IndexingMode.Consistent, Automatic = true };
        policy.IncludedPaths.Add(new IncludedPath { Path = "/*" });

        policy.CompositeIndexes.Add(new([
            new() { Path = "/isProcessed", Order = CompositePathSortOrder.Ascending },
            new() { Path = "/scheduledTimestamp", Order = CompositePathSortOrder.Ascending }
        ]));

        return policy;
    }

    public void Dispose() => _client.Dispose();
}
