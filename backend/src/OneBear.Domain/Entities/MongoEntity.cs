namespace OneBear.Domain.Entities;

using MongoDB.Bson.Serialization.Attributes;

public abstract class MongoEntity
{
    [BsonId]
    [BsonElement("_id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("_v")]
    public long Version { get; set; }

    [BsonElement("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;
}
