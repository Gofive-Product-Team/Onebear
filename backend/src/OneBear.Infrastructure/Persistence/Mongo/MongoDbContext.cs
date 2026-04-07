namespace OneBear.Infrastructure.Persistence.Mongo;

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;
using OneBear.Domain.Entities;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    static MongoDbContext()
    {
        ConventionPack conventions = new()
        {
            new CamelCaseElementNameConvention(),
            new IgnoreExtraElementsConvention(true),
            new EnumRepresentationConvention(BsonType.String)
        };
        ConventionRegistry.Register("OneBearConventions", conventions, _ => true);
    }

    public MongoDbContext(IMongoClient client, string databaseName)
    {
        _database = client.GetDatabase(databaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<ChatRoom> Rooms => _database.GetCollection<ChatRoom>("Rooms");
    public IMongoCollection<ChatMessage> Messages => _database.GetCollection<ChatMessage>("Messages");
    public IMongoCollection<ChatUser> Users => _database.GetCollection<ChatUser>("Users");
    public IMongoCollection<IntegrationChannel> IntegrationChannels => _database.GetCollection<IntegrationChannel>("IntegrationChannels");
    public IMongoCollection<Attachment> Attachments => _database.GetCollection<Attachment>("Attachments");
    public IMongoCollection<FollowupSchedule> FollowupSchedules => _database.GetCollection<FollowupSchedule>("FollowupSchedules");
    public IMongoCollection<ChatbotConfiguration> ChatbotConfigurations => _database.GetCollection<ChatbotConfiguration>("ChatbotConfigurations");
    public IMongoCollection<CompanyFeatureSettings> CompanyFeatureSettings => _database.GetCollection<CompanyFeatureSettings>("CompanyFeatureSettings");
    public IMongoCollection<UserVerification> UserVerifications => _database.GetCollection<UserVerification>("UserVerifications");
    public IMongoCollection<Customer> Customers => _database.GetCollection<Customer>("Customers");
    public IMongoCollection<ActivityLog> ActivityLogs => _database.GetCollection<ActivityLog>("ActivityLogs");
    public IMongoCollection<UserProfile> UserProfiles => _database.GetCollection<UserProfile>("UserProfiles");
}
