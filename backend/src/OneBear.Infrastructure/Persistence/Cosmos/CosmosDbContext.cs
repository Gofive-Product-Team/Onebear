namespace OneBear.Infrastructure.Persistence.Cosmos;

using Microsoft.Azure.Cosmos;

public class CosmosDbContext : IDisposable
{
    private readonly CosmosClient _client;
    private readonly Database _database;

    public CosmosDbContext(string connectionString, string databaseName = "OneBear")
    {
        _client = new CosmosClient(connectionString, new CosmosClientOptions
        {
            SerializerOptions = new CosmosSerializationOptions
            {
                PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
            }
        });
        _database = _client.GetDatabase(databaseName);
    }

    public Container Rooms => _database.GetContainer("Rooms");
    public Container Messages => _database.GetContainer("Messages");
    public Container Users => _database.GetContainer("Users");
    public Container IntegrationChannels => _database.GetContainer("IntegrationChannels");
    public Container Attachments => _database.GetContainer("Attachments");
    public Container FollowupSchedules => _database.GetContainer("FollowupSchedules");
    public Container ChatbotConfigurations => _database.GetContainer("ChatbotConfigurations");
    public Container CompanyFeatureSettings => _database.GetContainer("CompanyFeatureSettings");
    public Container UserVerifications => _database.GetContainer("UserVerifications");

    public void Dispose() => _client.Dispose();
}
