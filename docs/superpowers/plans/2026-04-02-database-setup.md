# Database Schema & Data Access Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Cosmos DB data access layer — entities aligned to spec, repository interfaces, Cosmos repository implementations with ETag concurrency, Redis cache service, indexing policies, DI wiring, seed data, and tests.

**Architecture:** Clean Architecture with Domain at center (entities, interfaces), Infrastructure at edge (Cosmos repos, Redis cache). All repositories use a generic base class with ETag retry logic for optimistic concurrency. Redis provides cache-aside pattern for read-heavy entities. Cosmos containers use custom indexing policies per query pattern.

**Tech Stack:** .NET 9, Azure Cosmos DB (Microsoft.Azure.Cosmos 3.58.0), StackExchange.Redis 2.12.8, System.Text.Json, xUnit 2.9.2

**Source Spec:** `docs/implementation/01-database-setup.md`
**Data Model Spec:** `docs/new-design/03-data-model.md`

---

## File Map

### Domain Layer (Create/Modify)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/OneBear.Domain/Common/IAuditableEntity.cs` | Audit field contract |
| Modify | `src/OneBear.Domain/Entities/CosmosEntity.cs` | Move to Common namespace concept, keep in Entities |
| Create | `src/OneBear.Domain/Common/ConcurrencyConflictException.cs` | ETag retry exhaustion exception |
| Modify | `src/OneBear.Domain/Enums/ChatState.cs` | Fix values: PascalCase, InProgress |
| Modify | `src/OneBear.Domain/Enums/MessageType.cs` | Add `All` array |
| Modify | `src/OneBear.Domain/Enums/MessageDeliveryState.cs` | Add `All` array |
| Modify | `src/OneBear.Domain/Enums/UserType.cs` | Add `All` array |
| Modify | `src/OneBear.Domain/Enums/Permission.cs` | Add `All` array |
| Create | `src/OneBear.Domain/ValueObjects/OrderItem.cs` | New VO for MessageOrder |
| Modify | `src/OneBear.Domain/ValueObjects/AutoReply.cs` | Add triggerType, keywords, attachmentUrl |
| Modify | `src/OneBear.Domain/ValueObjects/GreetingMessage.cs` | Add type, content, attachmentUrl |
| Modify | `src/OneBear.Domain/ValueObjects/PlatformCredentials.cs` | Add phoneNumberId, businessAccountId |
| Modify | `src/OneBear.Domain/ValueObjects/ChatSession.cs` | Rename fields per spec |
| Modify | `src/OneBear.Domain/ValueObjects/Shortcut.cs` | Rename to keyword, add attachmentUrl |
| Modify | `src/OneBear.Domain/ValueObjects/MessageAttachment.cs` | Rename fields per spec |
| Modify | `src/OneBear.Domain/ValueObjects/MessageOrder.cs` | Add items list |
| Modify | `src/OneBear.Domain/ValueObjects/AutoAssignmentSettings.cs` | Rename strategy->mode, userIds->agentUserIds |
| Modify | `src/OneBear.Domain/Entities/ChatRoom.cs` | Already close to spec, no major changes |
| Modify | `src/OneBear.Domain/Entities/ChatMessage.cs` | Major rewrite: align field names to spec |
| Modify | `src/OneBear.Domain/Entities/ChatUser.cs` | Major rewrite: add externalId, integrationId, platform, etc. |
| Modify | `src/OneBear.Domain/Entities/IntegrationChannel.cs` | Add hasChatFeature, lists for greetings/autoReplies/shortcuts |
| Modify | `src/OneBear.Domain/Entities/Attachment.cs` | Fix partition concept (roomId), rename fields |
| Modify | `src/OneBear.Domain/Entities/FollowupSchedule.cs` | Rename isCompleted->isProcessed, add cancellation fields |
| Modify | `src/OneBear.Domain/Entities/ChatbotConfiguration.cs` | Major rewrite: isEnabled, scheduleMode, businessOverview, etc. |
| Modify | `src/OneBear.Domain/Entities/CompanyFeatureSettings.cs` | Replace individual flags with features/settings dictionaries |
| Modify | `src/OneBear.Domain/Entities/UserVerification.cs` | Rename verificationCode->verificationValue |
| Modify | `src/OneBear.Domain/Interfaces/Repositories/IChatRoomRepository.cs` | Full method signatures |
| Modify | `src/OneBear.Domain/Interfaces/Repositories/IChatMessageRepository.cs` | Full method signatures |
| Modify | `src/OneBear.Domain/Interfaces/Repositories/IChatUserRepository.cs` | Full method signatures |
| Modify | `src/OneBear.Domain/Interfaces/Repositories/IIntegrationChannelRepository.cs` | Full method signatures |
| Modify | `src/OneBear.Domain/Interfaces/Repositories/IAttachmentRepository.cs` | Full method signatures |
| Modify | `src/OneBear.Domain/Interfaces/Repositories/IFollowupScheduleRepository.cs` | Full method signatures |
| Modify | `src/OneBear.Domain/Interfaces/Repositories/IChatbotConfigurationRepository.cs` | Full method signatures |
| Create | `src/OneBear.Domain/Interfaces/Repositories/ICompanyFeatureSettingsRepository.cs` | New repo interface |
| Create | `src/OneBear.Domain/Interfaces/Repositories/IUserVerificationRepository.cs` | New repo interface |
| Modify | `src/OneBear.Domain/Interfaces/ICacheService.cs` | Add GetOrSetAsync, MultiGetAsync |
| Create | `src/OneBear.Domain/Common/RoomFilter.cs` | Query filter record |
| Delete | `src/OneBear.Domain/Interfaces/IChatRoomRepository.cs` | Remove root-level duplicate |
| Delete | `src/OneBear.Domain/Interfaces/IChatMessageRepository.cs` | Remove root-level duplicate |
| Delete | `src/OneBear.Domain/Interfaces/IChatUserRepository.cs` | Remove root-level duplicate |
| Delete | `src/OneBear.Domain/Interfaces/IIntegrationChannelRepository.cs` | Remove root-level duplicate |
| Delete | `src/OneBear.Domain/Interfaces/IAttachmentRepository.cs` | Remove root-level duplicate |
| Delete | `src/OneBear.Domain/Interfaces/IFollowupScheduleRepository.cs` | Remove root-level duplicate |
| Delete | `src/OneBear.Domain/Interfaces/IChatbotConfigurationRepository.cs` | Remove root-level duplicate |

### Infrastructure Layer (Create/Modify)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/OneBear.Infrastructure/Persistence/Cosmos/CosmosRepositoryBase.cs` | Generic base with ETag retry |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/CosmosDbContext.cs` | Add EnsureDatabaseCreatedAsync, indexing |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatRoomRepository.cs` | Full implementation |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatMessageRepository.cs` | Full implementation |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatUserRepository.cs` | Full implementation |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/IntegrationChannelRepository.cs` | Full implementation |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/AttachmentRepository.cs` | Full implementation |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/FollowupScheduleRepository.cs` | Full implementation |
| Modify | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatbotConfigurationRepository.cs` | Full implementation |
| Create | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/CompanyFeatureSettingsRepository.cs` | New repo |
| Create | `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/UserVerificationRepository.cs` | New repo |
| Modify | `src/OneBear.Infrastructure/Caching/RedisCacheService.cs` | Implement ICacheService, add GetOrSet/MultiGet |
| Create | `src/OneBear.Infrastructure/Caching/CacheKeys.cs` | Centralized key + TTL constants |
| Modify | `src/OneBear.Infrastructure/DependencyInjection.cs` | Full DI registration |
| Create | `src/OneBear.Infrastructure/Persistence/Cosmos/Seeding/CosmosSeeder.cs` | Dev seed data |

### Test Layer (Create/Modify)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `tests/OneBear.Domain.Tests/Entities/ChatRoomTests.cs` | Fix broken test after enum change |
| Create | `tests/OneBear.Domain.Tests/Enums/StringEnumTests.cs` | Verify All arrays |
| Create | `tests/OneBear.Infrastructure.Tests/Caching/CacheKeysTests.cs` | Key pattern + TTL tests |
| Create | `tests/OneBear.Infrastructure.Tests/Caching/RedisCacheServiceTests.cs` | GetOrSetAsync flow |
| Create | `tests/OneBear.Infrastructure.Tests/Persistence/CosmosRepositoryBaseTests.cs` | ETag retry logic |
| Modify | `tests/OneBear.Infrastructure.Tests/OneBear.Infrastructure.Tests.csproj` | Add Moq dependency |

---

## Task 1: Domain Foundation — Common Types

**Files:**
- Create: `src/OneBear.Domain/Common/IAuditableEntity.cs`
- Create: `src/OneBear.Domain/Common/ConcurrencyConflictException.cs`
- Create: `src/OneBear.Domain/Common/RoomFilter.cs`

- [ ] **Step 1: Create IAuditableEntity interface**

```csharp
// src/OneBear.Domain/Common/IAuditableEntity.cs
namespace OneBear.Domain.Common;

public interface IAuditableEntity
{
    string? CreatedBy { get; set; }
    long CreatedTimestamp { get; set; }
    string? UpdatedBy { get; set; }
    long? UpdatedTimestamp { get; set; }
}
```

- [ ] **Step 2: Create ConcurrencyConflictException**

```csharp
// src/OneBear.Domain/Common/ConcurrencyConflictException.cs
namespace OneBear.Domain.Common;

public class ConcurrencyConflictException : Exception
{
    public ConcurrencyConflictException(string message) : base(message) { }
    public ConcurrencyConflictException(string message, Exception inner) : base(message, inner) { }
}
```

- [ ] **Step 3: Create RoomFilter record**

```csharp
// src/OneBear.Domain/Common/RoomFilter.cs
namespace OneBear.Domain.Common;

public record RoomFilter
{
    public string? State { get; init; }
    public string? Platform { get; init; }
    public string? AssignToUserId { get; init; }
    public bool? HasUnread { get; init; }
    public string? SearchQuery { get; init; }
}
```

- [ ] **Step 4: Verify build**

Run: `cd one-bear/backend && dotnet build --no-restore 2>&1 | tail -5`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

- [ ] **Step 5: Commit**

```bash
git add src/OneBear.Domain/Common/
git commit -m "feat(domain): add IAuditableEntity, ConcurrencyConflictException, RoomFilter"
```

---

## Task 2: Domain Enums — Fix String Constants

**Files:**
- Modify: `src/OneBear.Domain/Enums/ChatState.cs`
- Modify: `src/OneBear.Domain/Enums/MessageType.cs`
- Modify: `src/OneBear.Domain/Enums/MessageDeliveryState.cs`
- Modify: `src/OneBear.Domain/Enums/UserType.cs`
- Modify: `src/OneBear.Domain/Enums/Permission.cs`

- [ ] **Step 1: Rewrite ChatState.cs**

The current ChatState uses lowercase values ("new", "open") and has "Open" instead of "InProgress". Rewrite to match spec:

```csharp
// src/OneBear.Domain/Enums/ChatState.cs
namespace OneBear.Domain.Enums;

public static class ChatState
{
    public const string New = "New";
    public const string InProgress = "InProgress";
    public const string Closed = "Closed";
    public const string Resolved = "Resolved";

    public static readonly string[] All = [New, InProgress, Closed, Resolved];
}
```

- [ ] **Step 2: Add All array to MessageType.cs**

Add to end of MessageType class:

```csharp
    public static readonly string[] All = [Text, Image, Video, Audio, File, Sticker, Location, System,
        TemplateMessage, Carousel, ReactionAdded, ReactionRemoved, Note, EmailMessage, Story, Order, Product, Flex, Comment];
```

- [ ] **Step 3: Add All array to MessageDeliveryState.cs**

```csharp
    public static readonly string[] All = [Pending, Sent, Delivered, Read, Failed];
```

- [ ] **Step 4: Add All array to UserType.cs**

```csharp
    public static readonly string[] All = [Customer, Agent, Bot];
```

- [ ] **Step 5: Add All array to Permission.cs**

```csharp
    public static readonly int[] All = [ChatView, ChatResolved, ChatMention, ChatAssignAllCompany, ChatAccessAllData];
```

- [ ] **Step 6: Verify build**

Run: `cd one-bear/backend && dotnet build --no-restore 2>&1 | tail -5`
Expected: Build succeeded. Note: ChatRoom defaults to `ChatState.New` which was "new" (lowercase) before. The ChatRoom entity already references `Enums.ChatState.New` so the VALUE changes from "new" to "New" — this is intentional per spec.

- [ ] **Step 7: Commit**

```bash
git add src/OneBear.Domain/Enums/
git commit -m "feat(domain): align string enum constants to spec — PascalCase values, All arrays"
```

---

## Task 3: Domain Value Objects — Align to Spec

**Files:**
- Create: `src/OneBear.Domain/ValueObjects/OrderItem.cs`
- Modify: 10 existing VO files

- [ ] **Step 1: Create OrderItem.cs**

```csharp
// src/OneBear.Domain/ValueObjects/OrderItem.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class OrderItem
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = default!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("price")]
    public decimal Price { get; set; }
}
```

- [ ] **Step 2: Rewrite AutoReply.cs**

```csharp
// src/OneBear.Domain/ValueObjects/AutoReply.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class AutoReply
{
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("triggerType")]
    public string TriggerType { get; set; } = default!;

    [JsonPropertyName("keywords")]
    public List<string>? Keywords { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = default!;

    [JsonPropertyName("attachmentUrl")]
    public string? AttachmentUrl { get; set; }
}
```

- [ ] **Step 3: Rewrite GreetingMessage.cs**

```csharp
// src/OneBear.Domain/ValueObjects/GreetingMessage.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class GreetingMessage
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;

    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;

    [JsonPropertyName("attachmentUrl")]
    public string? AttachmentUrl { get; set; }

    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }
}
```

- [ ] **Step 4: Rewrite PlatformCredentials.cs**

```csharp
// src/OneBear.Domain/ValueObjects/PlatformCredentials.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class PlatformCredentials
{
    [JsonPropertyName("channelId")]
    public string? ChannelId { get; set; }

    [JsonPropertyName("channelSecret")]
    public string? ChannelSecret { get; set; }

    [JsonPropertyName("accessToken")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("appId")]
    public string? AppId { get; set; }

    [JsonPropertyName("appSecret")]
    public string? AppSecret { get; set; }

    [JsonPropertyName("phoneNumberId")]
    public string? PhoneNumberId { get; set; }

    [JsonPropertyName("businessAccountId")]
    public string? BusinessAccountId { get; set; }

    [JsonPropertyName("tokenExpiresAt")]
    public long? TokenExpiresAt { get; set; }
}
```

- [ ] **Step 5: Rewrite ChatSession.cs**

```csharp
// src/OneBear.Domain/ValueObjects/ChatSession.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class ChatSession
{
    [JsonPropertyName("startTimestamp")]
    public long StartTimestamp { get; set; }

    [JsonPropertyName("endTimestamp")]
    public long? EndTimestamp { get; set; }

    [JsonPropertyName("agentUserId")]
    public string AgentUserId { get; set; } = default!;
}
```

- [ ] **Step 6: Rewrite Shortcut.cs**

```csharp
// src/OneBear.Domain/ValueObjects/Shortcut.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class Shortcut
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("categoryId")]
    public string? CategoryId { get; set; }

    [JsonPropertyName("keyword")]
    public string Keyword { get; set; } = default!;

    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;

    [JsonPropertyName("attachmentUrl")]
    public string? AttachmentUrl { get; set; }
}
```

- [ ] **Step 7: Rewrite MessageAttachment.cs**

```csharp
// src/OneBear.Domain/ValueObjects/MessageAttachment.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class MessageAttachment
{
    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = default!;

    [JsonPropertyName("fileUrl")]
    public string FileUrl { get; set; } = default!;

    [JsonPropertyName("thumbnailUrl")]
    public string? ThumbnailUrl { get; set; }

    [JsonPropertyName("contentType")]
    public string ContentType { get; set; } = default!;

    [JsonPropertyName("size")]
    public long Size { get; set; }
}
```

- [ ] **Step 8: Rewrite MessageOrder.cs — add items list**

```csharp
// src/OneBear.Domain/ValueObjects/MessageOrder.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class MessageOrder
{
    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = default!;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("totalAmount")]
    public decimal? TotalAmount { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [JsonPropertyName("items")]
    public List<OrderItem>? Items { get; set; }
}
```

- [ ] **Step 9: Rewrite AutoAssignmentSettings.cs**

```csharp
// src/OneBear.Domain/ValueObjects/AutoAssignmentSettings.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class AutoAssignmentSettings
{
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "roundRobin";

    [JsonPropertyName("agentUserIds")]
    public List<string> AgentUserIds { get; set; } = new();
}
```

- [ ] **Step 10: Rewrite ShortcutCategory.cs — remove sortOrder, keep simple**

```csharp
// src/OneBear.Domain/ValueObjects/ShortcutCategory.cs
namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class ShortcutCategory
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
}
```

- [ ] **Step 11: Verify build**

Run: `cd one-bear/backend && dotnet build --no-restore 2>&1 | tail -10`
Expected: May have errors if entities reference old VO field names. That's OK — we fix entities in Task 4.

- [ ] **Step 12: Commit**

```bash
git add src/OneBear.Domain/ValueObjects/
git commit -m "feat(domain): align all value objects to data model spec"
```

---

## Task 4: Domain Entities — Align to Data Model Spec

All entities must match `docs/new-design/03-data-model.md` exactly. Implement `IAuditableEntity` on all mutable entities.

**Files:**
- Modify: all 9 entity files in `src/OneBear.Domain/Entities/`

- [ ] **Step 1: Rewrite ChatMessage.cs**

This is the biggest change — many field renames.

```csharp
// src/OneBear.Domain/Entities/ChatMessage.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;
using OneBear.Domain.ValueObjects;

public class ChatMessage : CosmosEntity, IAuditableEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("type")]
    public string Type { get; set; } = Enums.MessageType.Text;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("mid")]
    public string? Mid { get; set; }

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("traceId")]
    public string? TraceId { get; set; }

    [JsonPropertyName("deliveryStatus")]
    public string DeliveryStatus { get; set; } = Enums.MessageDeliveryState.Pending;

    [JsonPropertyName("deliveryError")]
    public string? DeliveryError { get; set; }

    [JsonPropertyName("attachment")]
    public MessageAttachment? Attachment { get; set; }

    [JsonPropertyName("replyTo")]
    public ReplyToMessage? ReplyTo { get; set; }

    [JsonPropertyName("product")]
    public MessageProduct? Product { get; set; }

    [JsonPropertyName("order")]
    public MessageOrder? Order { get; set; }

    [JsonPropertyName("referral")]
    public MessageReferral? Referral { get; set; }

    [JsonPropertyName("mentions")]
    public List<MessageMention>? Mentions { get; set; }

    [JsonPropertyName("emailRecipients")]
    public EmailRecipients? EmailRecipients { get; set; }

    [JsonPropertyName("isEdited")]
    public bool IsEdited { get; set; }

    [JsonPropertyName("editedTimestamp")]
    public long? EditedTimestamp { get; set; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }

    [JsonPropertyName("deletedTimestamp")]
    public long? DeletedTimestamp { get; set; }

    // IAuditableEntity — using Timestamp as CreatedTimestamp equivalent
    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
```

- [ ] **Step 2: Rewrite ChatUser.cs**

```csharp
// src/OneBear.Domain/Entities/ChatUser.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

public class ChatUser : CosmosEntity, IAuditableEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("externalId")]
    public string ExternalId { get; set; } = default!;

    [JsonPropertyName("originalName")]
    public string? OriginalName { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("pictureUrl")]
    public string? PictureUrl { get; set; }

    [JsonPropertyName("integrationId")]
    public string IntegrationId { get; set; } = default!;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("type")]
    public string Type { get; set; } = Enums.UserType.Customer;

    [JsonPropertyName("isGroup")]
    public bool IsGroup { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("profileUpdateTimestamp")]
    public long? ProfileUpdateTimestamp { get; set; }

    [JsonPropertyName("platformMetadata")]
    public Dictionary<string, string>? PlatformMetadata { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
```

- [ ] **Step 3: Rewrite IntegrationChannel.cs**

```csharp
// src/OneBear.Domain/Entities/IntegrationChannel.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;
using OneBear.Domain.ValueObjects;

public class IntegrationChannel : CosmosEntity, IAuditableEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("hasChatFeature")]
    public bool HasChatFeature { get; set; }

    [JsonPropertyName("credentials")]
    public PlatformCredentials? Credentials { get; set; }

    [JsonPropertyName("greetingMessages")]
    public List<GreetingMessage> GreetingMessages { get; set; } = new();

    [JsonPropertyName("autoReplies")]
    public List<AutoReply> AutoReplies { get; set; } = new();

    [JsonPropertyName("autoAssignment")]
    public AutoAssignmentSettings? AutoAssignment { get; set; }

    [JsonPropertyName("platformSettings")]
    public Dictionary<string, object>? PlatformSettings { get; set; }

    [JsonPropertyName("shortcuts")]
    public List<Shortcut> Shortcuts { get; set; } = new();

    [JsonPropertyName("shortcutCategories")]
    public List<ShortcutCategory> ShortcutCategories { get; set; } = new();

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
```

- [ ] **Step 4: Update ChatRoom.cs — add IAuditableEntity**

ChatRoom is already close to spec. Add interface and `CreatedTimestamp` property to satisfy IAuditableEntity:

```csharp
// Just update the class declaration and ensure IAuditableEntity is implemented.
// ChatRoom already has CreatedBy, UpdatedBy, UpdatedTimestamp, CreatedTimestamp.
// Change: class ChatRoom : CosmosEntity → class ChatRoom : CosmosEntity, IAuditableEntity
// The file already has createdTimestamp as a property, so IAuditableEntity should be satisfied.
// Add: using OneBear.Domain.Common;
```

Full file — replace existing:

```csharp
// src/OneBear.Domain/Entities/ChatRoom.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;
using OneBear.Domain.ValueObjects;

public class ChatRoom : CosmosEntity, IAuditableEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("assignToUserId")]
    public string? AssignToUserId { get; set; }

    [JsonPropertyName("state")]
    public string State { get; set; } = Enums.ChatState.New;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("kind")]
    public string? Kind { get; set; }

    [JsonPropertyName("integrationId")]
    public string IntegrationId { get; set; } = default!;

    [JsonPropertyName("unread")]
    public int Unread { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("userMessageTimestamp")]
    public long? UserMessageTimestamp { get; set; }

    [JsonPropertyName("lastMessageTimestamp")]
    public long? LastMessageTimestamp { get; set; }

    [JsonPropertyName("followupTimestamp")]
    public long? FollowupTimestamp { get; set; }

    [JsonPropertyName("followupContent")]
    public string? FollowupContent { get; set; }

    [JsonPropertyName("participantUserIds")]
    public List<string> ParticipantUserIds { get; set; } = new();

    [JsonPropertyName("attendedUserIds")]
    public List<string> AttendedUserIds { get; set; } = new();

    [JsonPropertyName("customer")]
    public RoomCustomer? Customer { get; set; }

    [JsonPropertyName("tags")]
    public List<RoomTag> Tags { get; set; } = new();

    [JsonPropertyName("sessions")]
    public List<ChatSession> Sessions { get; set; } = new();

    [JsonPropertyName("isAiMuted")]
    public bool IsAiMuted { get; set; }

    [JsonPropertyName("customerId")]
    public string? CustomerId { get; set; }

    [JsonPropertyName("contactId")]
    public string? ContactId { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
```

- [ ] **Step 5: Rewrite Attachment.cs**

```csharp
// src/OneBear.Domain/Entities/Attachment.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class Attachment : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("messageId")]
    public string MessageId { get; set; } = default!;

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = default!;

    [JsonPropertyName("fileUrl")]
    public string FileUrl { get; set; } = default!;

    [JsonPropertyName("thumbnailUrl")]
    public string? ThumbnailUrl { get; set; }

    [JsonPropertyName("contentType")]
    public string ContentType { get; set; } = default!;

    [JsonPropertyName("size")]
    public long Size { get; set; }

    [JsonPropertyName("uploadedBy")]
    public string UploadedBy { get; set; } = default!;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}
```

- [ ] **Step 6: Rewrite FollowupSchedule.cs**

```csharp
// src/OneBear.Domain/Entities/FollowupSchedule.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class FollowupSchedule : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("scheduledTimestamp")]
    public long ScheduledTimestamp { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("createdBy")]
    public string CreatedBy { get; set; } = default!;

    [JsonPropertyName("isProcessed")]
    public bool IsProcessed { get; set; }

    [JsonPropertyName("processedTimestamp")]
    public long? ProcessedTimestamp { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("cancelledBy")]
    public string? CancelledBy { get; set; }

    [JsonPropertyName("cancelledTimestamp")]
    public long? CancelledTimestamp { get; set; }
}
```

- [ ] **Step 7: Rewrite ChatbotConfiguration.cs**

```csharp
// src/OneBear.Domain/Entities/ChatbotConfiguration.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.ValueObjects;

public class ChatbotConfiguration : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("scheduleMode")]
    public string ScheduleMode { get; set; } = "always";

    [JsonPropertyName("daySchedules")]
    public List<DaySchedule> DaySchedules { get; set; } = new();

    [JsonPropertyName("businessOverview")]
    public string? BusinessOverview { get; set; }

    [JsonPropertyName("responseStyle")]
    public string? ResponseStyle { get; set; }

    [JsonPropertyName("instructions")]
    public string? Instructions { get; set; }

    [JsonPropertyName("knowledgeSources")]
    public List<KnowledgeSource> KnowledgeSources { get; set; } = new();

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}
```

- [ ] **Step 8: Rewrite CompanyFeatureSettings.cs**

```csharp
// src/OneBear.Domain/Entities/CompanyFeatureSettings.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class CompanyFeatureSettings : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("features")]
    public Dictionary<string, bool> Features { get; set; } = new();

    [JsonPropertyName("settings")]
    public Dictionary<string, string> Settings { get; set; } = new();

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
```

- [ ] **Step 9: Rewrite UserVerification.cs**

```csharp
// src/OneBear.Domain/Entities/UserVerification.cs
namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class UserVerification : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("verificationType")]
    public string VerificationType { get; set; } = default!;

    [JsonPropertyName("verificationValue")]
    public string VerificationValue { get; set; } = default!;

    [JsonPropertyName("isVerified")]
    public bool IsVerified { get; set; }

    [JsonPropertyName("verifiedTimestamp")]
    public long? VerifiedTimestamp { get; set; }

    [JsonPropertyName("expiresTimestamp")]
    public long? ExpiresTimestamp { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }
}
```

- [ ] **Step 10: Fix build errors in API/Application layers**

After entity changes, the API controllers and hub may have references to renamed fields. Search for and fix:
- `ChatMessage.SenderUserId` → `ChatMessage.UserId`
- `ChatMessage.MessageType` → `ChatMessage.Type`
- `ChatMessage.DeliveryState` → `ChatMessage.DeliveryStatus`
- `ChatMessage.ExternalMessageId` → `ChatMessage.Mid`
- `ChatMessage.Attachments` (List) → `ChatMessage.Attachment` (single)
- `ChatUser.ExternalUserId` → `ChatUser.ExternalId`
- `ChatUser.UserType` → `ChatUser.Type`
- `IntegrationChannel.Name` → removed (field not in spec)
- `CompanyFeatureSettings.IsChatbotEnabled` → `CompanyFeatureSettings.Features["chatbot"]`
- `ChatbotConfiguration.IsActive` → `ChatbotConfiguration.IsEnabled`
- `FollowupSchedule.IsCompleted` → `FollowupSchedule.IsProcessed`

Run: `cd one-bear/backend && dotnet build 2>&1 | grep "error CS"` to find all compile errors.
Fix each error. The API controllers return stub JSON so most won't reference entities directly. The ChatHub has a `SendMessagePayload` that may reference old fields.

- [ ] **Step 11: Verify build**

Run: `cd one-bear/backend && dotnet build 2>&1 | tail -5`
Expected: Build succeeded. 0 Error(s)

- [ ] **Step 12: Commit**

```bash
git add src/OneBear.Domain/Entities/ src/OneBear.API/ src/OneBear.Application/
git commit -m "feat(domain): rewrite all entities to match data model spec"
```

---

## Task 5: Domain Interfaces — Repository Contracts

Clean up duplicate interfaces and implement full method signatures per spec.

**Files:**
- Delete: 7 root-level duplicate interfaces in `src/OneBear.Domain/Interfaces/`
- Modify: 7 existing files in `src/OneBear.Domain/Interfaces/Repositories/`
- Create: 2 new repo interfaces
- Modify: `src/OneBear.Domain/Interfaces/ICacheService.cs`

- [ ] **Step 1: Delete root-level duplicate interfaces**

```bash
cd one-bear/backend
rm src/OneBear.Domain/Interfaces/IChatRoomRepository.cs
rm src/OneBear.Domain/Interfaces/IChatMessageRepository.cs
rm src/OneBear.Domain/Interfaces/IChatUserRepository.cs
rm src/OneBear.Domain/Interfaces/IIntegrationChannelRepository.cs
rm src/OneBear.Domain/Interfaces/IAttachmentRepository.cs
rm src/OneBear.Domain/Interfaces/IFollowupScheduleRepository.cs
rm src/OneBear.Domain/Interfaces/IChatbotConfigurationRepository.cs
```

- [ ] **Step 2: Rewrite IChatRoomRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IChatRoomRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface IChatRoomRepository
{
    Task<ChatRoom?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(List<ChatRoom> Items, string? ContinuationToken)> QueryByFilterAsync(
        string companyId, RoomFilter filter, int pageSize = 20, string? continuationToken = null, CancellationToken ct = default);
    Task<ChatRoom> CreateAsync(ChatRoom room, CancellationToken ct = default);
    Task<ChatRoom> UpdateAsync(ChatRoom room, CancellationToken ct = default);
    Task<int> GetBadgeCountAsync(string companyId, string? assignToUserId, CancellationToken ct = default);
    Task<ChatRoom?> GetByUserAndIntegrationAsync(string companyId, string userId, string integrationId, CancellationToken ct = default);
}
```

- [ ] **Step 3: Rewrite IChatMessageRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IChatMessageRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IChatMessageRepository
{
    Task<ChatMessage?> GetByIdAsync(string id, string roomId, CancellationToken ct = default);
    Task<(List<ChatMessage> Items, string? ContinuationToken)> GetByRoomIdAsync(
        string roomId, int pageSize = 20, string? continuationToken = null, bool excludeDeleted = true, CancellationToken ct = default);
    Task<ChatMessage> CreateAsync(ChatMessage message, CancellationToken ct = default);
    Task<ChatMessage> UpdateAsync(ChatMessage message, CancellationToken ct = default);
    Task<ChatMessage?> GetByMidAsync(string roomId, string mid, CancellationToken ct = default);
}
```

- [ ] **Step 4: Rewrite IChatUserRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IChatUserRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IChatUserRepository
{
    Task<ChatUser?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<ChatUser?> GetByExternalIdAsync(string companyId, string externalId, string platform, CancellationToken ct = default);
    Task<List<ChatUser>> GetByIdsAsync(string companyId, IEnumerable<string> ids, CancellationToken ct = default);
    Task<ChatUser> UpsertAsync(ChatUser user, CancellationToken ct = default);
    Task<(List<ChatUser> Items, string? ContinuationToken)> QueryByTypeAsync(
        string companyId, string userType, int pageSize = 50, string? continuationToken = null, CancellationToken ct = default);
}
```

- [ ] **Step 5: Rewrite IIntegrationChannelRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IIntegrationChannelRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IIntegrationChannelRepository
{
    Task<IntegrationChannel?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<IntegrationChannel>> GetByCompanyIdAsync(string companyId, CancellationToken ct = default);
    Task<IntegrationChannel?> GetByPlatformAsync(string companyId, string platform, CancellationToken ct = default);
    Task<IntegrationChannel> CreateAsync(IntegrationChannel channel, CancellationToken ct = default);
    Task<IntegrationChannel> UpdateAsync(IntegrationChannel channel, CancellationToken ct = default);
    Task DeleteAsync(string id, string companyId, CancellationToken ct = default);
}
```

- [ ] **Step 6: Rewrite IAttachmentRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IAttachmentRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IAttachmentRepository
{
    Task<Attachment?> GetByIdAsync(string id, string roomId, CancellationToken ct = default);
    Task<List<Attachment>> GetByRoomIdAsync(string roomId, CancellationToken ct = default);
    Task<Attachment> CreateAsync(Attachment attachment, CancellationToken ct = default);
}
```

- [ ] **Step 7: Rewrite IFollowupScheduleRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IFollowupScheduleRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IFollowupScheduleRepository
{
    Task<FollowupSchedule?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<FollowupSchedule>> GetDueSchedulesAsync(string companyId, long beforeTimestamp, CancellationToken ct = default);
    Task<FollowupSchedule?> GetByRoomIdAsync(string companyId, string roomId, CancellationToken ct = default);
    Task<FollowupSchedule> CreateAsync(FollowupSchedule schedule, CancellationToken ct = default);
    Task<FollowupSchedule> UpdateAsync(FollowupSchedule schedule, CancellationToken ct = default);
}
```

- [ ] **Step 8: Rewrite IChatbotConfigurationRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IChatbotConfigurationRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IChatbotConfigurationRepository
{
    Task<ChatbotConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default);
    Task<ChatbotConfiguration> UpsertAsync(ChatbotConfiguration config, CancellationToken ct = default);
}
```

- [ ] **Step 9: Create ICompanyFeatureSettingsRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/ICompanyFeatureSettingsRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface ICompanyFeatureSettingsRepository
{
    Task<CompanyFeatureSettings?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default);
    Task<CompanyFeatureSettings> UpsertAsync(CompanyFeatureSettings settings, CancellationToken ct = default);
}
```

- [ ] **Step 10: Create IUserVerificationRepository.cs**

```csharp
// src/OneBear.Domain/Interfaces/Repositories/IUserVerificationRepository.cs
namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IUserVerificationRepository
{
    Task<UserVerification?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<UserVerification>> GetByUserIdAsync(string companyId, string userId, CancellationToken ct = default);
    Task<UserVerification> CreateAsync(UserVerification verification, CancellationToken ct = default);
    Task<UserVerification> UpdateAsync(UserVerification verification, CancellationToken ct = default);
}
```

- [ ] **Step 11: Update ICacheService.cs — add GetOrSetAsync, MultiGetAsync**

```csharp
// src/OneBear.Domain/Interfaces/ICacheService.cs
namespace OneBear.Domain.Interfaces;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default) where T : class;
    Task RemoveAsync(string key, CancellationToken ct = default);
    Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T?>> factory, TimeSpan? ttl = null, CancellationToken ct = default) where T : class;
    Task<Dictionary<string, T?>> MultiGetAsync<T>(IEnumerable<string> keys, CancellationToken ct = default) where T : class;
}
```

- [ ] **Step 12: Fix build — update Infrastructure repo stubs to implement new interfaces**

The repository stubs in Infrastructure will now fail to compile because the interfaces have methods. Temporarily add `throw new NotImplementedException()` to satisfy the compiler. They will be properly implemented in Tasks 7-9.

Run: `cd one-bear/backend && dotnet build 2>&1 | grep "error CS"` and fix each stub.

- [ ] **Step 13: Verify build**

Run: `cd one-bear/backend && dotnet build 2>&1 | tail -5`
Expected: Build succeeded. 0 Error(s)

- [ ] **Step 14: Commit**

```bash
git add src/OneBear.Domain/Interfaces/
git commit -m "feat(domain): full repository interface contracts per spec"
```

---

## Task 6: Infrastructure — CosmosRepositoryBase + CosmosDbContext

**Files:**
- Create: `src/OneBear.Infrastructure/Persistence/Cosmos/CosmosRepositoryBase.cs`
- Modify: `src/OneBear.Infrastructure/Persistence/Cosmos/CosmosDbContext.cs`

- [ ] **Step 1: Create CosmosRepositoryBase.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/CosmosRepositoryBase.cs
namespace OneBear.Infrastructure.Persistence.Cosmos;

using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public abstract class CosmosRepositoryBase<T> where T : CosmosEntity
{
    protected readonly Container _container;
    protected readonly ILogger _logger;

    protected CosmosRepositoryBase(Container container, ILogger logger)
    {
        _container = container;
        _logger = logger;
    }

    protected async Task<T?> ReadAsync(string id, PartitionKey pk, CancellationToken ct)
    {
        try
        {
            ItemResponse<T> response = await _container.ReadItemAsync<T>(id, pk, cancellationToken: ct);
            T entity = response.Resource;
            entity.ETag = response.ETag;
            return entity;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    protected async Task<T> CreateItemAsync(T entity, PartitionKey pk, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (auditable.CreatedTimestamp == 0)
                auditable.CreatedTimestamp = now;
            auditable.UpdatedTimestamp ??= now;
        }

        ItemResponse<T> response = await _container.CreateItemAsync(entity, pk, cancellationToken: ct);
        T created = response.Resource;
        created.ETag = response.ETag;
        return created;
    }

    protected async Task<T> ReplaceItemAsync(T entity, PartitionKey pk, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            auditable.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }

        ItemRequestOptions options = new();
        if (entity.ETag is not null)
        {
            options.IfMatchEtag = entity.ETag;
        }

        ItemResponse<T> response = await _container.ReplaceItemAsync(entity, entity switch
        {
            // Extract id via reflection-free pattern matching per entity
            _ => GetEntityId(entity)
        }, pk, options, ct);

        T replaced = response.Resource;
        replaced.ETag = response.ETag;
        return replaced;
    }

    protected async Task<T> ReplaceWithRetryAsync(
        T entity, PartitionKey pk, Func<T, T> mutator, CancellationToken ct, int maxRetries = 3)
    {
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                return await ReplaceItemAsync(entity, pk, ct);
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.PreconditionFailed && attempt < maxRetries - 1)
            {
                _logger.LogWarning("ETag conflict on {Type} {Id}, retry {Attempt}/{Max}",
                    typeof(T).Name, GetEntityId(entity), attempt + 1, maxRetries);

                ItemResponse<T> fresh = await _container.ReadItemAsync<T>(
                    GetEntityId(entity), pk, cancellationToken: ct);
                entity = mutator(fresh.Resource);
                entity.ETag = fresh.ETag;
            }
        }

        throw new ConcurrencyConflictException(
            $"Failed to update {typeof(T).Name} {GetEntityId(entity)} after {maxRetries} retries");
    }

    protected async Task DeleteItemAsync(string id, PartitionKey pk, CancellationToken ct)
    {
        await _container.DeleteItemAsync<T>(id, pk, cancellationToken: ct);
    }

    protected async Task<T> UpsertItemAsync(T entity, PartitionKey pk, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (auditable.CreatedTimestamp == 0)
                auditable.CreatedTimestamp = now;
            auditable.UpdatedTimestamp = now;
        }

        ItemResponse<T> response = await _container.UpsertItemAsync(entity, pk, cancellationToken: ct);
        T result = response.Resource;
        result.ETag = response.ETag;
        return result;
    }

    protected async Task<(List<TResult> Items, string? ContinuationToken)> QueryAsync<TResult>(
        QueryDefinition query, PartitionKey pk, int pageSize, string? continuationToken, CancellationToken ct)
    {
        QueryRequestOptions options = new()
        {
            PartitionKey = pk,
            MaxItemCount = pageSize
        };

        using FeedIterator<TResult> iterator = _container.GetItemQueryIterator<TResult>(
            query, continuationToken, options);

        List<TResult> results = new();
        string? nextToken = null;

        if (iterator.HasMoreResults)
        {
            FeedResponse<TResult> response = await iterator.ReadNextAsync(ct);
            results.AddRange(response);
            nextToken = response.ContinuationToken;
        }

        return (results, nextToken);
    }

    protected abstract string GetEntityId(T entity);
}
```

- [ ] **Step 2: Rewrite CosmosDbContext.cs with initialization and indexing**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/CosmosDbContext.cs
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
```

- [ ] **Step 3: Verify build**

Run: `cd one-bear/backend && dotnet build 2>&1 | tail -5`
Expected: Build succeeded. 0 Error(s)

- [ ] **Step 4: Commit**

```bash
git add src/OneBear.Infrastructure/Persistence/Cosmos/CosmosRepositoryBase.cs
git add src/OneBear.Infrastructure/Persistence/Cosmos/CosmosDbContext.cs
git commit -m "feat(infra): CosmosRepositoryBase with ETag retry, CosmosDbContext with indexing policies"
```

---

## Task 7: Repository Implementations — ChatRoom, ChatMessage, ChatUser

**Files:**
- Modify: `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatRoomRepository.cs`
- Modify: `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatMessageRepository.cs`
- Modify: `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatUserRepository.cs`

- [ ] **Step 1: Implement ChatRoomRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatRoomRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;

public class ChatRoomRepository : CosmosRepositoryBase<ChatRoom>, IChatRoomRepository
{
    public ChatRoomRepository(CosmosDbContext context, ILogger<ChatRoomRepository> logger)
        : base(context.Rooms, logger) { }

    protected override string GetEntityId(ChatRoom entity) => entity.Id;

    public Task<ChatRoom?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<(List<ChatRoom> Items, string? ContinuationToken)> QueryByFilterAsync(
        string companyId, RoomFilter filter, int pageSize = 20, string? continuationToken = null, CancellationToken ct = default)
    {
        List<string> conditions = new() { "c.companyId = @companyId" };
        QueryDefinition query;

        if (filter.State is not null)
            conditions.Add("c.state = @state");
        if (filter.Platform is not null)
            conditions.Add("c.platform = @platform");
        if (filter.AssignToUserId is not null)
            conditions.Add("c.assignToUserId = @assignToUserId");
        if (filter.HasUnread == true)
            conditions.Add("c.unread > 0");
        if (filter.SearchQuery is not null)
            conditions.Add("CONTAINS(LOWER(c.customer.name), LOWER(@searchQuery))");

        string sql = $"SELECT * FROM c WHERE {string.Join(" AND ", conditions)} ORDER BY c.lastMessageTimestamp DESC";
        query = new QueryDefinition(sql).WithParameter("@companyId", companyId);

        if (filter.State is not null)
            query = query.WithParameter("@state", filter.State);
        if (filter.Platform is not null)
            query = query.WithParameter("@platform", filter.Platform);
        if (filter.AssignToUserId is not null)
            query = query.WithParameter("@assignToUserId", filter.AssignToUserId);
        if (filter.SearchQuery is not null)
            query = query.WithParameter("@searchQuery", filter.SearchQuery);

        return await QueryAsync<ChatRoom>(query, new PartitionKey(companyId), pageSize, continuationToken, ct);
    }

    public Task<ChatRoom> CreateAsync(ChatRoom room, CancellationToken ct = default)
        => CreateItemAsync(room, new PartitionKey(room.CompanyId), ct);

    public Task<ChatRoom> UpdateAsync(ChatRoom room, CancellationToken ct = default)
        => ReplaceItemAsync(room, new PartitionKey(room.CompanyId), ct);

    public async Task<int> GetBadgeCountAsync(string companyId, string? assignToUserId, CancellationToken ct = default)
    {
        string sql = "SELECT VALUE COUNT(1) FROM c WHERE c.companyId = @companyId AND c.state != @closed AND c.state != @resolved AND c.unread > 0";
        QueryDefinition query = new QueryDefinition(sql)
            .WithParameter("@companyId", companyId)
            .WithParameter("@closed", ChatState.Closed)
            .WithParameter("@resolved", ChatState.Resolved);

        if (assignToUserId is not null)
        {
            sql += " AND c.assignToUserId = @assignToUserId";
            query = new QueryDefinition(sql)
                .WithParameter("@companyId", companyId)
                .WithParameter("@closed", ChatState.Closed)
                .WithParameter("@resolved", ChatState.Resolved)
                .WithParameter("@assignToUserId", assignToUserId);
        }

        using FeedIterator<int> iterator = _container.GetItemQueryIterator<int>(
            query, requestOptions: new() { PartitionKey = new PartitionKey(companyId) });

        if (iterator.HasMoreResults)
        {
            FeedResponse<int> response = await iterator.ReadNextAsync(ct);
            return response.FirstOrDefault();
        }

        return 0;
    }

    public async Task<ChatRoom?> GetByUserAndIntegrationAsync(
        string companyId, string userId, string integrationId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.userId = @userId AND c.integrationId = @integrationId")
            .WithParameter("@companyId", companyId)
            .WithParameter("@userId", userId)
            .WithParameter("@integrationId", integrationId);

        (List<ChatRoom> items, _) = await QueryAsync<ChatRoom>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }
}
```

- [ ] **Step 2: Implement ChatMessageRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatMessageRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatMessageRepository : CosmosRepositoryBase<ChatMessage>, IChatMessageRepository
{
    public ChatMessageRepository(CosmosDbContext context, ILogger<ChatMessageRepository> logger)
        : base(context.Messages, logger) { }

    protected override string GetEntityId(ChatMessage entity) => entity.Id;

    public Task<ChatMessage?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(roomId), ct);

    public async Task<(List<ChatMessage> Items, string? ContinuationToken)> GetByRoomIdAsync(
        string roomId, int pageSize = 20, string? continuationToken = null, bool excludeDeleted = true, CancellationToken ct = default)
    {
        string sql = excludeDeleted
            ? "SELECT * FROM c WHERE c.roomId = @roomId AND c.isDeleted = false ORDER BY c.timestamp DESC"
            : "SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.timestamp DESC";

        QueryDefinition query = new QueryDefinition(sql)
            .WithParameter("@roomId", roomId);

        return await QueryAsync<ChatMessage>(query, new PartitionKey(roomId), pageSize, continuationToken, ct);
    }

    public Task<ChatMessage> CreateAsync(ChatMessage message, CancellationToken ct = default)
        => CreateItemAsync(message, new PartitionKey(message.RoomId), ct);

    public Task<ChatMessage> UpdateAsync(ChatMessage message, CancellationToken ct = default)
        => ReplaceItemAsync(message, new PartitionKey(message.RoomId), ct);

    public async Task<ChatMessage?> GetByMidAsync(string roomId, string mid, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.roomId = @roomId AND c.mid = @mid")
            .WithParameter("@roomId", roomId)
            .WithParameter("@mid", mid);

        (List<ChatMessage> items, _) = await QueryAsync<ChatMessage>(
            query, new PartitionKey(roomId), 1, null, ct);
        return items.FirstOrDefault();
    }
}
```

- [ ] **Step 3: Implement ChatUserRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatUserRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatUserRepository : CosmosRepositoryBase<ChatUser>, IChatUserRepository
{
    public ChatUserRepository(CosmosDbContext context, ILogger<ChatUserRepository> logger)
        : base(context.Users, logger) { }

    protected override string GetEntityId(ChatUser entity) => entity.Id;

    public Task<ChatUser?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<ChatUser?> GetByExternalIdAsync(
        string companyId, string externalId, string platform, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.externalId = @externalId AND c.platform = @platform")
            .WithParameter("@companyId", companyId)
            .WithParameter("@externalId", externalId)
            .WithParameter("@platform", platform);

        (List<ChatUser> items, _) = await QueryAsync<ChatUser>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public async Task<List<ChatUser>> GetByIdsAsync(
        string companyId, IEnumerable<string> ids, CancellationToken ct = default)
    {
        string[] idArray = ids.Distinct().ToArray();
        if (idArray.Length == 0) return new();

        // Build IN clause with parameters
        List<string> paramNames = new();
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId AND ARRAY_CONTAINS(@ids, c.id)")
            .WithParameter("@companyId", companyId)
            .WithParameter("@ids", idArray);

        (List<ChatUser> items, _) = await QueryAsync<ChatUser>(
            query, new PartitionKey(companyId), idArray.Length, null, ct);
        return items;
    }

    public Task<ChatUser> UpsertAsync(ChatUser user, CancellationToken ct = default)
        => UpsertItemAsync(user, new PartitionKey(user.CompanyId), ct);

    public async Task<(List<ChatUser> Items, string? ContinuationToken)> QueryByTypeAsync(
        string companyId, string userType, int pageSize = 50, string? continuationToken = null, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.type = @type AND c.isActive = true")
            .WithParameter("@companyId", companyId)
            .WithParameter("@type", userType);

        return await QueryAsync<ChatUser>(query, new PartitionKey(companyId), pageSize, continuationToken, ct);
    }
}
```

- [ ] **Step 4: Verify build**

Run: `cd one-bear/backend && dotnet build 2>&1 | tail -5`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatRoomRepository.cs
git add src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatMessageRepository.cs
git add src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatUserRepository.cs
git commit -m "feat(infra): implement ChatRoom, ChatMessage, ChatUser repositories"
```

---

## Task 8: Repository Implementations — IntegrationChannel, Attachment, FollowupSchedule

**Files:**
- Modify: 3 repository files in `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/`

- [ ] **Step 1: Implement IntegrationChannelRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/IntegrationChannelRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class IntegrationChannelRepository : CosmosRepositoryBase<IntegrationChannel>, IIntegrationChannelRepository
{
    public IntegrationChannelRepository(CosmosDbContext context, ILogger<IntegrationChannelRepository> logger)
        : base(context.IntegrationChannels, logger) { }

    protected override string GetEntityId(IntegrationChannel entity) => entity.Id;

    public Task<IntegrationChannel?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<List<IntegrationChannel>> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId")
            .WithParameter("@companyId", companyId);

        (List<IntegrationChannel> items, _) = await QueryAsync<IntegrationChannel>(
            query, new PartitionKey(companyId), 100, null, ct);
        return items;
    }

    public async Task<IntegrationChannel?> GetByPlatformAsync(string companyId, string platform, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.platform = @platform")
            .WithParameter("@companyId", companyId)
            .WithParameter("@platform", platform);

        (List<IntegrationChannel> items, _) = await QueryAsync<IntegrationChannel>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<IntegrationChannel> CreateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => CreateItemAsync(channel, new PartitionKey(channel.CompanyId), ct);

    public Task<IntegrationChannel> UpdateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => ReplaceItemAsync(channel, new PartitionKey(channel.CompanyId), ct);

    public Task DeleteAsync(string id, string companyId, CancellationToken ct = default)
        => DeleteItemAsync(id, new PartitionKey(companyId), ct);
}
```

- [ ] **Step 2: Implement AttachmentRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/AttachmentRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class AttachmentRepository : CosmosRepositoryBase<Attachment>, IAttachmentRepository
{
    public AttachmentRepository(CosmosDbContext context, ILogger<AttachmentRepository> logger)
        : base(context.Attachments, logger) { }

    protected override string GetEntityId(Attachment entity) => entity.Id;

    public Task<Attachment?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(roomId), ct);

    public async Task<List<Attachment>> GetByRoomIdAsync(string roomId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.timestamp DESC")
            .WithParameter("@roomId", roomId);

        (List<Attachment> items, _) = await QueryAsync<Attachment>(
            query, new PartitionKey(roomId), 100, null, ct);
        return items;
    }

    public Task<Attachment> CreateAsync(Attachment attachment, CancellationToken ct = default)
        => CreateItemAsync(attachment, new PartitionKey(attachment.RoomId), ct);
}
```

- [ ] **Step 3: Implement FollowupScheduleRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/FollowupScheduleRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class FollowupScheduleRepository : CosmosRepositoryBase<FollowupSchedule>, IFollowupScheduleRepository
{
    public FollowupScheduleRepository(CosmosDbContext context, ILogger<FollowupScheduleRepository> logger)
        : base(context.FollowupSchedules, logger) { }

    protected override string GetEntityId(FollowupSchedule entity) => entity.Id;

    public Task<FollowupSchedule?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<List<FollowupSchedule>> GetDueSchedulesAsync(
        string companyId, long beforeTimestamp, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.isProcessed = false AND c.scheduledTimestamp <= @before ORDER BY c.scheduledTimestamp ASC")
            .WithParameter("@companyId", companyId)
            .WithParameter("@before", beforeTimestamp);

        (List<FollowupSchedule> items, _) = await QueryAsync<FollowupSchedule>(
            query, new PartitionKey(companyId), 100, null, ct);
        return items;
    }

    public async Task<FollowupSchedule?> GetByRoomIdAsync(string companyId, string roomId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.roomId = @roomId AND c.isProcessed = false")
            .WithParameter("@companyId", companyId)
            .WithParameter("@roomId", roomId);

        (List<FollowupSchedule> items, _) = await QueryAsync<FollowupSchedule>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<FollowupSchedule> CreateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => CreateItemAsync(schedule, new PartitionKey(schedule.CompanyId), ct);

    public Task<FollowupSchedule> UpdateAsync(FollowupSchedule schedule, CancellationToken ct = default)
        => ReplaceItemAsync(schedule, new PartitionKey(schedule.CompanyId), ct);
}
```

- [ ] **Step 4: Verify build + Commit**

```bash
cd one-bear/backend && dotnet build 2>&1 | tail -5
git add src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/
git commit -m "feat(infra): implement IntegrationChannel, Attachment, FollowupSchedule repositories"
```

---

## Task 9: Repository Implementations — Chatbot, CompanyFeature, UserVerification

**Files:**
- Modify: `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatbotConfigurationRepository.cs`
- Create: `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/CompanyFeatureSettingsRepository.cs`
- Create: `src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/UserVerificationRepository.cs`

- [ ] **Step 1: Implement ChatbotConfigurationRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/ChatbotConfigurationRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatbotConfigurationRepository : CosmosRepositoryBase<ChatbotConfiguration>, IChatbotConfigurationRepository
{
    public ChatbotConfigurationRepository(CosmosDbContext context, ILogger<ChatbotConfigurationRepository> logger)
        : base(context.ChatbotConfigurations, logger) { }

    protected override string GetEntityId(ChatbotConfiguration entity) => entity.Id;

    public async Task<ChatbotConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId")
            .WithParameter("@companyId", companyId);

        (List<ChatbotConfiguration> items, _) = await QueryAsync<ChatbotConfiguration>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<ChatbotConfiguration> UpsertAsync(ChatbotConfiguration config, CancellationToken ct = default)
        => UpsertItemAsync(config, new PartitionKey(config.CompanyId), ct);
}
```

- [ ] **Step 2: Create CompanyFeatureSettingsRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/CompanyFeatureSettingsRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class CompanyFeatureSettingsRepository : CosmosRepositoryBase<CompanyFeatureSettings>, ICompanyFeatureSettingsRepository
{
    public CompanyFeatureSettingsRepository(CosmosDbContext context, ILogger<CompanyFeatureSettingsRepository> logger)
        : base(context.CompanyFeatureSettings, logger) { }

    protected override string GetEntityId(CompanyFeatureSettings entity) => entity.Id;

    public async Task<CompanyFeatureSettings?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId")
            .WithParameter("@companyId", companyId);

        (List<CompanyFeatureSettings> items, _) = await QueryAsync<CompanyFeatureSettings>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<CompanyFeatureSettings> UpsertAsync(CompanyFeatureSettings settings, CancellationToken ct = default)
        => UpsertItemAsync(settings, new PartitionKey(settings.CompanyId), ct);
}
```

- [ ] **Step 3: Create UserVerificationRepository.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/UserVerificationRepository.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class UserVerificationRepository : CosmosRepositoryBase<UserVerification>, IUserVerificationRepository
{
    public UserVerificationRepository(CosmosDbContext context, ILogger<UserVerificationRepository> logger)
        : base(context.UserVerifications, logger) { }

    protected override string GetEntityId(UserVerification entity) => entity.Id;

    public Task<UserVerification?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<List<UserVerification>> GetByUserIdAsync(string companyId, string userId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.userId = @userId")
            .WithParameter("@companyId", companyId)
            .WithParameter("@userId", userId);

        (List<UserVerification> items, _) = await QueryAsync<UserVerification>(
            query, new PartitionKey(companyId), 50, null, ct);
        return items;
    }

    public Task<UserVerification> CreateAsync(UserVerification verification, CancellationToken ct = default)
        => CreateItemAsync(verification, new PartitionKey(verification.CompanyId), ct);

    public Task<UserVerification> UpdateAsync(UserVerification verification, CancellationToken ct = default)
        => ReplaceItemAsync(verification, new PartitionKey(verification.CompanyId), ct);
}
```

- [ ] **Step 4: Verify build + Commit**

```bash
cd one-bear/backend && dotnet build 2>&1 | tail -5
git add src/OneBear.Infrastructure/Persistence/Cosmos/Repositories/
git commit -m "feat(infra): implement Chatbot, CompanyFeature, UserVerification repositories"
```

---

## Task 10: Redis Cache — CacheService + CacheKeys

**Files:**
- Modify: `src/OneBear.Infrastructure/Caching/RedisCacheService.cs`
- Create: `src/OneBear.Infrastructure/Caching/CacheKeys.cs`
- Delete: `src/OneBear.Application/Common/Interfaces/IAppCacheService.cs` (replaced by Domain ICacheService)

- [ ] **Step 1: Create CacheKeys.cs**

```csharp
// src/OneBear.Infrastructure/Caching/CacheKeys.cs
namespace OneBear.Infrastructure.Caching;

public static class CacheKeys
{
    public static string IntegrationChannel(string companyId, string channelId) => $"ic:{companyId}:{channelId}";
    public static string IntegrationChannelList(string companyId) => $"ic:list:{companyId}";
    public static readonly TimeSpan IntegrationChannelTtl = TimeSpan.FromHours(1);

    public static string ChatUser(string companyId, string userId) => $"user:{companyId}:{userId}";
    public static readonly TimeSpan ChatUserTtl = TimeSpan.FromMinutes(5);

    public static string ChatbotConfig(string companyId) => $"chatbot:{companyId}";
    public static readonly TimeSpan ChatbotConfigTtl = TimeSpan.FromMinutes(30);

    public static string FeatureSettings(string companyId) => $"features:{companyId}";
    public static readonly TimeSpan FeatureSettingsTtl = TimeSpan.FromMinutes(15);

    public static string BadgeCount(string companyId, string userId) => $"badge:{companyId}:{userId}";
    public static readonly TimeSpan BadgeCountTtl = TimeSpan.FromSeconds(30);
}
```

- [ ] **Step 2: Rewrite RedisCacheService.cs to implement Domain ICacheService**

```csharp
// src/OneBear.Infrastructure/Caching/RedisCacheService.cs
namespace OneBear.Infrastructure.Caching;

using System.Text.Json;
using OneBear.Domain.Interfaces;
using StackExchange.Redis;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class
    {
        IDatabase db = _redis.GetDatabase();
        RedisValue value = await db.StringGetAsync(key);
        if (value.IsNullOrEmpty)
            return default;
        return JsonSerializer.Deserialize<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default) where T : class
    {
        IDatabase db = _redis.GetDatabase();
        string json = JsonSerializer.Serialize(value);
        await db.StringSetAsync(key, json, ttl);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        IDatabase db = _redis.GetDatabase();
        await db.KeyDeleteAsync(key);
    }

    public async Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T?>> factory, TimeSpan? ttl = null, CancellationToken ct = default) where T : class
    {
        T? cached = await GetAsync<T>(key, ct);
        if (cached is not null)
            return cached;

        T? value = await factory(ct);
        if (value is not null)
            await SetAsync(key, value, ttl, ct);

        return value;
    }

    public async Task<Dictionary<string, T?>> MultiGetAsync<T>(IEnumerable<string> keys, CancellationToken ct = default) where T : class
    {
        string[] keyArray = keys.ToArray();
        if (keyArray.Length == 0)
            return new();

        IDatabase db = _redis.GetDatabase();
        RedisKey[] redisKeys = keyArray.Select(k => (RedisKey)k).ToArray();
        RedisValue[] values = await db.StringGetAsync(redisKeys);

        Dictionary<string, T?> result = new(keyArray.Length);
        for (int i = 0; i < keyArray.Length; i++)
        {
            result[keyArray[i]] = values[i].IsNullOrEmpty
                ? default
                : JsonSerializer.Deserialize<T>(values[i]!);
        }

        return result;
    }
}
```

- [ ] **Step 3: Remove IAppCacheService and update references**

Delete `src/OneBear.Application/Common/Interfaces/IAppCacheService.cs`.
Search for any references to `IAppCacheService` and replace with `ICacheService` from `OneBear.Domain.Interfaces`.

Run: `cd one-bear/backend && grep -r "IAppCacheService" src/ --include="*.cs" -l` to find files to update.

- [ ] **Step 4: Verify build + Commit**

```bash
cd one-bear/backend && dotnet build 2>&1 | tail -5
git add src/OneBear.Infrastructure/Caching/ src/OneBear.Application/
git commit -m "feat(infra): implement RedisCacheService with GetOrSet/MultiGet, CacheKeys constants"
```

---

## Task 11: Infrastructure DI Registration

**Files:**
- Modify: `src/OneBear.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Implement full DI registration**

```csharp
// src/OneBear.Infrastructure/DependencyInjection.cs
namespace OneBear.Infrastructure;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Infrastructure.Caching;
using OneBear.Infrastructure.Persistence.Cosmos;
using OneBear.Infrastructure.Persistence.Cosmos.Repositories;
using StackExchange.Redis;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Cosmos DB
        services.AddSingleton(sp =>
        {
            string connectionString = configuration.GetConnectionString("CosmosDb")
                ?? throw new InvalidOperationException("CosmosDb connection string is required");
            return new CosmosClient(connectionString, new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                }
            });
        });

        string databaseName = configuration.GetValue<string>("CosmosDb:DatabaseName") ?? "OneBear";
        services.AddSingleton(sp => new CosmosDbContext(sp.GetRequiredService<CosmosClient>(), databaseName));

        // Redis
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            string connectionString = configuration.GetConnectionString("Redis")
                ?? throw new InvalidOperationException("Redis connection string is required");
            return ConnectionMultiplexer.Connect(connectionString);
        });
        services.AddSingleton<ICacheService, RedisCacheService>();

        // Repositories
        services.AddScoped<IChatRoomRepository, ChatRoomRepository>();
        services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
        services.AddScoped<IChatUserRepository, ChatUserRepository>();
        services.AddScoped<IIntegrationChannelRepository, IntegrationChannelRepository>();
        services.AddScoped<IAttachmentRepository, AttachmentRepository>();
        services.AddScoped<IFollowupScheduleRepository, FollowupScheduleRepository>();
        services.AddScoped<IChatbotConfigurationRepository, ChatbotConfigurationRepository>();
        services.AddScoped<ICompanyFeatureSettingsRepository, CompanyFeatureSettingsRepository>();
        services.AddScoped<IUserVerificationRepository, UserVerificationRepository>();

        return services;
    }
}
```

- [ ] **Step 2: Update Program.cs to call AddInfrastructure**

Find the API `Program.cs` and add `builder.Services.AddInfrastructure(builder.Configuration);` if not already present. Also add database initialization in Development:

```csharp
// Add after app is built, before app.Run():
if (app.Environment.IsDevelopment())
{
    using IServiceScope scope = app.Services.CreateScope();
    CosmosDbContext cosmosDb = scope.ServiceProvider.GetRequiredService<CosmosDbContext>();
    await cosmosDb.EnsureDatabaseCreatedAsync();
}
```

- [ ] **Step 3: Verify build + Commit**

```bash
cd one-bear/backend && dotnet build 2>&1 | tail -5
git add src/OneBear.Infrastructure/DependencyInjection.cs src/OneBear.API/Program.cs
git commit -m "feat(infra): wire up DI for all repositories, Cosmos, and Redis"
```

---

## Task 12: Seed Data

**Files:**
- Create: `src/OneBear.Infrastructure/Persistence/Cosmos/Seeding/CosmosSeeder.cs`

- [ ] **Step 1: Create CosmosSeeder.cs**

```csharp
// src/OneBear.Infrastructure/Persistence/Cosmos/Seeding/CosmosSeeder.cs
namespace OneBear.Infrastructure.Persistence.Cosmos.Seeding;

using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.ValueObjects;

public class CosmosSeeder
{
    private readonly CosmosDbContext _context;
    private readonly ILogger<CosmosSeeder> _logger;

    public CosmosSeeder(CosmosDbContext context, ILogger<CosmosSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedDevelopmentDataAsync(CancellationToken ct = default)
    {
        string companyId = "company-demo-001";
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // Integration Channels
        IntegrationChannel lineChannel = new()
        {
            Id = "int-line-001", CompanyId = companyId, Platform = SocialPlatform.Line,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { ChannelId = "demo-line-ch", ChannelSecret = "demo-secret", AccessToken = "demo-token" },
            GreetingMessages = [new() { Type = "text", Content = "Welcome! How can we help?", IsEnabled = true }],
            AutoReplies = [new() { IsEnabled = true, TriggerType = "outsideBusinessHours", Message = "We're offline. We'll reply during business hours." }],
            AutoAssignment = new AutoAssignmentSettings { IsEnabled = true, Mode = "roundRobin", AgentUserIds = ["agent-001", "agent-002"] },
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        IntegrationChannel fbChannel = new()
        {
            Id = "int-fb-002", CompanyId = companyId, Platform = SocialPlatform.Facebook,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { AppId = "demo-app-id", AppSecret = "demo-secret", AccessToken = "demo-token" },
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        await UpsertIfNotExistsAsync(_context.IntegrationChannels, lineChannel, companyId, ct);
        await UpsertIfNotExistsAsync(_context.IntegrationChannels, fbChannel, companyId, ct);

        // Chat Users
        ChatUser customer1 = new()
        {
            Id = "u-line-customer-001", CompanyId = companyId, ExternalId = "U1234567890abcdef",
            OriginalName = "Somchai K.", DisplayName = "Somchai K.", PictureUrl = null,
            IntegrationId = "int-line-001", Platform = SocialPlatform.Line, Type = UserType.Customer,
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        ChatUser agent1 = new()
        {
            Id = "agent-001", CompanyId = companyId, ExternalId = "agent-001",
            DisplayName = "Agent One", IntegrationId = "int-line-001",
            Platform = SocialPlatform.Line, Type = UserType.Agent,
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        ChatUser agent2 = new()
        {
            Id = "agent-002", CompanyId = companyId, ExternalId = "agent-002",
            DisplayName = "Agent Two", IntegrationId = "int-fb-002",
            Platform = SocialPlatform.Facebook, Type = UserType.Agent,
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        await UpsertIfNotExistsAsync(_context.Users, customer1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, agent1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, agent2, companyId, ct);

        // Chat Rooms
        ChatRoom room1 = new()
        {
            Id = "room-001", CompanyId = companyId, UserId = "u-line-customer-001",
            State = ChatState.New, Platform = SocialPlatform.Line, IntegrationId = "int-line-001",
            Unread = 2, CreatedTimestamp = now - 3600000, LastMessageTimestamp = now - 60000,
            Customer = new RoomCustomer { Name = "Somchai K.", ExternalId = "U1234567890abcdef" },
            CreatedBy = "system", UpdatedBy = "system", UpdatedTimestamp = now
        };

        ChatRoom room2 = new()
        {
            Id = "room-002", CompanyId = companyId, UserId = "u-line-customer-001",
            AssignToUserId = "agent-001", State = ChatState.InProgress,
            Platform = SocialPlatform.Facebook, IntegrationId = "int-fb-002",
            Unread = 0, CreatedTimestamp = now - 7200000, LastMessageTimestamp = now - 300000,
            Customer = new RoomCustomer { Name = "Somchai K.", ExternalId = "U1234567890abcdef" },
            Sessions = [new() { StartTimestamp = now - 3600000, AgentUserId = "agent-001" }],
            CreatedBy = "system", UpdatedBy = "agent-001", UpdatedTimestamp = now
        };

        await UpsertIfNotExistsAsync(_context.Rooms, room1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Rooms, room2, companyId, ct);

        // Messages
        ChatMessage msg1 = new()
        {
            Id = "msg-001", RoomId = "room-001", CompanyId = companyId, UserId = "u-line-customer-001",
            Content = "Hello, I have a question about your product.", Platform = SocialPlatform.Line,
            Type = MessageType.Text, Timestamp = now - 120000, DeliveryStatus = "Delivered",
            CreatedTimestamp = now - 120000
        };

        ChatMessage msg2 = new()
        {
            Id = "msg-002", RoomId = "room-001", CompanyId = companyId, UserId = "u-line-customer-001",
            Platform = SocialPlatform.Line, Type = MessageType.Image, Timestamp = now - 60000,
            Attachment = new MessageAttachment { FileName = "product.jpg", FileUrl = "https://example.com/product.jpg", ContentType = "image/jpeg", Size = 102400 },
            DeliveryStatus = "Delivered", CreatedTimestamp = now - 60000
        };

        ChatMessage msg3 = new()
        {
            Id = "msg-003", RoomId = "room-002", CompanyId = companyId, UserId = "u-line-customer-001",
            Content = "When will my order arrive?", Platform = SocialPlatform.Facebook,
            Type = MessageType.Text, Timestamp = now - 600000, DeliveryStatus = "Delivered",
            CreatedTimestamp = now - 600000
        };

        ChatMessage msg4 = new()
        {
            Id = "msg-004", RoomId = "room-002", CompanyId = companyId, UserId = "agent-001",
            Content = "Let me check your order status.", Platform = SocialPlatform.Facebook,
            Type = MessageType.Text, Timestamp = now - 300000, DeliveryStatus = "Delivered",
            CreatedTimestamp = now - 300000
        };

        ChatMessage msg5 = new()
        {
            Id = "msg-005", RoomId = "room-002", CompanyId = companyId, UserId = "system",
            Content = "Agent One joined the conversation.", Platform = SocialPlatform.Facebook,
            Type = MessageType.System, Timestamp = now - 3600000, DeliveryStatus = "Delivered",
            CreatedTimestamp = now - 3600000
        };

        await UpsertIfNotExistsAsync(_context.Messages, msg1, "room-001", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg2, "room-001", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg3, "room-002", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg4, "room-002", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg5, "room-002", ct);

        // Attachment
        Attachment att1 = new()
        {
            Id = "att-001", RoomId = "room-001", MessageId = "msg-002", CompanyId = companyId,
            FileName = "product.jpg", FileUrl = "https://example.com/product.jpg",
            ContentType = "image/jpeg", Size = 102400, UploadedBy = "u-line-customer-001", Timestamp = now - 60000
        };
        await UpsertIfNotExistsAsync(_context.Attachments, att1, "room-001", ct);

        // FollowupSchedule
        FollowupSchedule followup1 = new()
        {
            Id = "followup-001", CompanyId = companyId, RoomId = "room-002",
            ScheduledTimestamp = now + 86400000, Content = "Follow up on order inquiry",
            CreatedBy = "agent-001", CreatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.FollowupSchedules, followup1, companyId, ct);

        // ChatbotConfiguration
        ChatbotConfiguration chatbot1 = new()
        {
            Id = "chatbot-001", CompanyId = companyId, IsEnabled = true, ScheduleMode = "always",
            BusinessOverview = "We are a demo e-commerce company.",
            ResponseStyle = "Friendly and professional",
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.ChatbotConfigurations, chatbot1, companyId, ct);

        // CompanyFeatureSettings
        CompanyFeatureSettings features1 = new()
        {
            Id = "features-001", CompanyId = companyId,
            Features = new() { ["chatbot"] = true, ["autoAssignment"] = true, ["followup"] = true, ["satisfactionSurvey"] = false },
            Settings = new() { ["maxAgents"] = "10", ["maxIntegrations"] = "5" },
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.CompanyFeatureSettings, features1, companyId, ct);

        // UserVerification
        UserVerification verification1 = new()
        {
            Id = "verify-001", CompanyId = companyId, UserId = "agent-001",
            VerificationType = "email", VerificationValue = "agent1@example.com",
            IsVerified = true, VerifiedTimestamp = now, CreatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.UserVerifications, verification1, companyId, ct);

        _logger.LogInformation("Development seed data created for company {CompanyId}", companyId);
    }

    private async Task UpsertIfNotExistsAsync<T>(Container container, T item, string partitionKeyValue, CancellationToken ct)
    {
        try
        {
            await container.UpsertItemAsync(item, new PartitionKey(partitionKeyValue), cancellationToken: ct);
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogDebug("Seed item already exists, skipping");
        }
    }
}
```

- [ ] **Step 2: Register seeder in DI and call from Program.cs**

Add to `DependencyInjection.cs`:
```csharp
services.AddTransient<CosmosSeeder>();
```

Update Program.cs Development block:
```csharp
if (app.Environment.IsDevelopment())
{
    using IServiceScope scope = app.Services.CreateScope();
    CosmosDbContext cosmosDb = scope.ServiceProvider.GetRequiredService<CosmosDbContext>();
    await cosmosDb.EnsureDatabaseCreatedAsync();

    CosmosSeeder seeder = scope.ServiceProvider.GetRequiredService<CosmosSeeder>();
    await seeder.SeedDevelopmentDataAsync();
}
```

- [ ] **Step 3: Verify build + Commit**

```bash
cd one-bear/backend && dotnet build 2>&1 | tail -5
git add src/OneBear.Infrastructure/Persistence/Cosmos/Seeding/
git add src/OneBear.Infrastructure/DependencyInjection.cs src/OneBear.API/Program.cs
git commit -m "feat(infra): add CosmosSeeder with idempotent development seed data"
```

---

## Task 13: Domain Tests

**Files:**
- Modify: `tests/OneBear.Domain.Tests/Entities/ChatRoomTests.cs`
- Create: `tests/OneBear.Domain.Tests/Enums/StringEnumTests.cs`

- [ ] **Step 1: Fix ChatRoomTests — update expected default state**

The ChatState.New value changed from "new" to "New". Update the test:

```csharp
// tests/OneBear.Domain.Tests/Entities/ChatRoomTests.cs
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;

namespace OneBear.Domain.Tests.Entities;

public class ChatRoomTests
{
    [Fact]
    public void NewRoom_ShouldHaveDefaultValues()
    {
        ChatRoom room = new()
        {
            CompanyId = "company-1",
            UserId = "user-1",
            Platform = SocialPlatform.Line,
            IntegrationId = "int-1"
        };

        Assert.NotNull(room.Id);
        Assert.Equal("New", room.State);
        Assert.Equal(1, room.SchemaVersion);
        Assert.Equal(0, room.Unread);
        Assert.False(room.IsAiMuted);
        Assert.Empty(room.ParticipantUserIds);
        Assert.Empty(room.Tags);
    }
}
```

- [ ] **Step 2: Create StringEnumTests.cs**

```csharp
// tests/OneBear.Domain.Tests/Enums/StringEnumTests.cs
using OneBear.Domain.Enums;

namespace OneBear.Domain.Tests.Enums;

public class StringEnumTests
{
    [Fact]
    public void ChatState_All_ContainsAllConstants()
    {
        Assert.Equal(4, ChatState.All.Length);
        Assert.Contains("New", ChatState.All);
        Assert.Contains("InProgress", ChatState.All);
        Assert.Contains("Closed", ChatState.All);
        Assert.Contains("Resolved", ChatState.All);
    }

    [Fact]
    public void ChatState_All_HasNoDuplicates()
    {
        Assert.Equal(ChatState.All.Length, ChatState.All.Distinct().Count());
    }

    [Fact]
    public void SocialPlatform_All_ContainsAllPlatforms()
    {
        Assert.Equal(8, SocialPlatform.All.Length);
        Assert.Contains("Line", SocialPlatform.All);
        Assert.Contains("Facebook", SocialPlatform.All);
        Assert.Contains("Instagram", SocialPlatform.All);
        Assert.Contains("WhatsApp", SocialPlatform.All);
        Assert.Contains("Email", SocialPlatform.All);
        Assert.Contains("TikTok", SocialPlatform.All);
        Assert.Contains("Lazada", SocialPlatform.All);
        Assert.Contains("Shopee", SocialPlatform.All);
    }

    [Fact]
    public void MessageType_All_ContainsAllTypes()
    {
        Assert.Equal(19, MessageType.All.Length);
        Assert.Contains("Text", MessageType.All);
        Assert.Contains("Image", MessageType.All);
        Assert.Contains("System", MessageType.All);
        Assert.Equal(MessageType.All.Length, MessageType.All.Distinct().Count());
    }

    [Fact]
    public void MessageDeliveryState_All_ContainsAllStates()
    {
        Assert.Equal(5, MessageDeliveryState.All.Length);
        Assert.Contains("Pending", MessageDeliveryState.All);
        Assert.Contains("Failed", MessageDeliveryState.All);
        Assert.Equal(MessageDeliveryState.All.Length, MessageDeliveryState.All.Distinct().Count());
    }

    [Fact]
    public void UserType_All_ContainsAllTypes()
    {
        Assert.Equal(3, UserType.All.Length);
        Assert.Contains("Customer", UserType.All);
        Assert.Contains("Agent", UserType.All);
        Assert.Contains("Bot", UserType.All);
    }

    [Fact]
    public void Permission_All_ContainsAllPermissions()
    {
        Assert.Equal(5, Permission.All.Length);
        Assert.Contains(3001, Permission.All);
        Assert.Contains(3005, Permission.All);
    }
}
```

- [ ] **Step 3: Run tests**

Run: `cd one-bear/backend && dotnet test tests/OneBear.Domain.Tests/ --no-restore -v minimal 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/OneBear.Domain.Tests/
git commit -m "test(domain): fix ChatRoom test, add string enum All array tests"
```

---

## Task 14: Infrastructure Tests

**Files:**
- Modify: `tests/OneBear.Infrastructure.Tests/OneBear.Infrastructure.Tests.csproj`
- Create: `tests/OneBear.Infrastructure.Tests/Caching/CacheKeysTests.cs`
- Create: `tests/OneBear.Infrastructure.Tests/Caching/RedisCacheServiceTests.cs`
- Create: `tests/OneBear.Infrastructure.Tests/Persistence/CosmosRepositoryBaseTests.cs`

- [ ] **Step 1: Add Moq to test project**

```xml
<!-- Add to tests/OneBear.Infrastructure.Tests/OneBear.Infrastructure.Tests.csproj ItemGroup -->
<PackageReference Include="Moq" Version="4.20.72" />
```

- [ ] **Step 2: Create CacheKeysTests.cs**

```csharp
// tests/OneBear.Infrastructure.Tests/Caching/CacheKeysTests.cs
using OneBear.Infrastructure.Caching;

namespace OneBear.Infrastructure.Tests.Caching;

public class CacheKeysTests
{
    [Fact]
    public void IntegrationChannel_GeneratesCorrectKey()
    {
        Assert.Equal("ic:comp1:ch1", CacheKeys.IntegrationChannel("comp1", "ch1"));
    }

    [Fact]
    public void IntegrationChannelList_GeneratesCorrectKey()
    {
        Assert.Equal("ic:list:comp1", CacheKeys.IntegrationChannelList("comp1"));
    }

    [Fact]
    public void ChatUser_GeneratesCorrectKey()
    {
        Assert.Equal("user:comp1:u1", CacheKeys.ChatUser("comp1", "u1"));
    }

    [Fact]
    public void ChatbotConfig_GeneratesCorrectKey()
    {
        Assert.Equal("chatbot:comp1", CacheKeys.ChatbotConfig("comp1"));
    }

    [Fact]
    public void FeatureSettings_GeneratesCorrectKey()
    {
        Assert.Equal("features:comp1", CacheKeys.FeatureSettings("comp1"));
    }

    [Fact]
    public void BadgeCount_GeneratesCorrectKey()
    {
        Assert.Equal("badge:comp1:u1", CacheKeys.BadgeCount("comp1", "u1"));
    }

    [Fact]
    public void IntegrationChannelTtl_IsOneHour()
    {
        Assert.Equal(TimeSpan.FromHours(1), CacheKeys.IntegrationChannelTtl);
    }

    [Fact]
    public void ChatUserTtl_IsFiveMinutes()
    {
        Assert.Equal(TimeSpan.FromMinutes(5), CacheKeys.ChatUserTtl);
    }

    [Fact]
    public void ChatbotConfigTtl_IsThirtyMinutes()
    {
        Assert.Equal(TimeSpan.FromMinutes(30), CacheKeys.ChatbotConfigTtl);
    }

    [Fact]
    public void FeatureSettingsTtl_IsFifteenMinutes()
    {
        Assert.Equal(TimeSpan.FromMinutes(15), CacheKeys.FeatureSettingsTtl);
    }

    [Fact]
    public void BadgeCountTtl_IsThirtySeconds()
    {
        Assert.Equal(TimeSpan.FromSeconds(30), CacheKeys.BadgeCountTtl);
    }
}
```

- [ ] **Step 3: Create RedisCacheServiceTests.cs**

```csharp
// tests/OneBear.Infrastructure.Tests/Caching/RedisCacheServiceTests.cs
using System.Text.Json;
using Moq;
using OneBear.Infrastructure.Caching;
using StackExchange.Redis;

namespace OneBear.Infrastructure.Tests.Caching;

public class RedisCacheServiceTests
{
    private readonly Mock<IConnectionMultiplexer> _redisMock = new();
    private readonly Mock<IDatabase> _dbMock = new();
    private readonly RedisCacheService _sut;

    public RedisCacheServiceTests()
    {
        _redisMock.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(_dbMock.Object);
        _sut = new RedisCacheService(_redisMock.Object);
    }

    [Fact]
    public async Task GetOrSetAsync_ReturnsCachedValue_WhenCacheHit()
    {
        TestData expected = new("cached");
        _dbMock.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(JsonSerializer.Serialize(expected));

        bool factoryCalled = false;
        TestData? result = await _sut.GetOrSetAsync<TestData>("key", async ct =>
        {
            factoryCalled = true;
            return new TestData("from-factory");
        });

        Assert.Equal("cached", result!.Name);
        Assert.False(factoryCalled);
    }

    [Fact]
    public async Task GetOrSetAsync_CallsFactory_WhenCacheMiss()
    {
        _dbMock.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        TestData? result = await _sut.GetOrSetAsync<TestData>("key", async ct =>
        {
            return new TestData("from-factory");
        }, TimeSpan.FromMinutes(5));

        Assert.Equal("from-factory", result!.Name);
        _dbMock.Verify(d => d.StringSetAsync(
            It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), TimeSpan.FromMinutes(5),
            It.IsAny<bool>(), It.IsAny<When>(), It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    public async Task GetOrSetAsync_ReturnsNull_WhenFactoryReturnsNull()
    {
        _dbMock.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        TestData? result = await _sut.GetOrSetAsync<TestData>("key", async ct => null);

        Assert.Null(result);
        _dbMock.Verify(d => d.StringSetAsync(
            It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(),
            It.IsAny<bool>(), It.IsAny<When>(), It.IsAny<CommandFlags>()), Times.Never);
    }

    private record TestData(string Name);
}
```

- [ ] **Step 4: Create CosmosRepositoryBaseTests.cs**

```csharp
// tests/OneBear.Infrastructure.Tests/Persistence/CosmosRepositoryBaseTests.cs
using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Infrastructure.Persistence.Cosmos;

namespace OneBear.Infrastructure.Tests.Persistence;

public class CosmosRepositoryBaseTests
{
    private readonly Mock<Container> _containerMock = new();
    private readonly Mock<ILogger<TestRepository>> _loggerMock = new();

    [Fact]
    public async Task ReplaceWithRetry_SucceedsOnFirstAttempt()
    {
        TestEntity entity = new() { Id = "test-1", ETag = "etag-1" };
        ItemResponse<TestEntity> mockResponse = CreateMockResponse(entity, "etag-2");

        _containerMock.Setup(c => c.ReplaceItemAsync(
            It.IsAny<TestEntity>(), It.IsAny<string>(),
            It.IsAny<PartitionKey>(), It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResponse);

        TestRepository repo = new(_containerMock.Object, _loggerMock.Object);
        TestEntity result = await repo.TestReplaceWithRetry(entity, new PartitionKey("pk"), e => e);

        Assert.Equal("etag-2", result.ETag);
    }

    [Fact]
    public async Task ReplaceWithRetry_RetriesOnPreconditionFailed()
    {
        TestEntity entity = new() { Id = "test-1", ETag = "etag-1" };
        TestEntity freshEntity = new() { Id = "test-1", ETag = "etag-fresh" };
        ItemResponse<TestEntity> freshResponse = CreateMockResponse(freshEntity, "etag-fresh");
        ItemResponse<TestEntity> successResponse = CreateMockResponse(entity, "etag-success");

        int callCount = 0;
        _containerMock.Setup(c => c.ReplaceItemAsync(
            It.IsAny<TestEntity>(), It.IsAny<string>(),
            It.IsAny<PartitionKey>(), It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new CosmosException("Precondition failed", HttpStatusCode.PreconditionFailed, 0, "", 0);
                return Task.FromResult(successResponse);
            });

        _containerMock.Setup(c => c.ReadItemAsync<TestEntity>(
            It.IsAny<string>(), It.IsAny<PartitionKey>(),
            It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(freshResponse);

        TestRepository repo = new(_containerMock.Object, _loggerMock.Object);
        TestEntity result = await repo.TestReplaceWithRetry(entity, new PartitionKey("pk"), e => e);

        Assert.Equal(2, callCount);
    }

    [Fact]
    public async Task ReplaceWithRetry_ThrowsConcurrencyConflict_AfterMaxRetries()
    {
        TestEntity entity = new() { Id = "test-1", ETag = "etag-1" };
        TestEntity freshEntity = new() { Id = "test-1", ETag = "etag-fresh" };
        ItemResponse<TestEntity> freshResponse = CreateMockResponse(freshEntity, "etag-fresh");

        _containerMock.Setup(c => c.ReplaceItemAsync(
            It.IsAny<TestEntity>(), It.IsAny<string>(),
            It.IsAny<PartitionKey>(), It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CosmosException("Precondition failed", HttpStatusCode.PreconditionFailed, 0, "", 0));

        _containerMock.Setup(c => c.ReadItemAsync<TestEntity>(
            It.IsAny<string>(), It.IsAny<PartitionKey>(),
            It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(freshResponse);

        TestRepository repo = new(_containerMock.Object, _loggerMock.Object);

        await Assert.ThrowsAsync<ConcurrencyConflictException>(
            () => repo.TestReplaceWithRetry(entity, new PartitionKey("pk"), e => e));
    }

    private static ItemResponse<TestEntity> CreateMockResponse(TestEntity entity, string etag)
    {
        Mock<ItemResponse<TestEntity>> mock = new();
        mock.Setup(r => r.Resource).Returns(entity);
        mock.Setup(r => r.ETag).Returns(etag);
        return mock.Object;
    }

    // Test entity
    public class TestEntity : CosmosEntity
    {
        public string Id { get; set; } = default!;
    }

    // Expose protected methods for testing
    public class TestRepository : CosmosRepositoryBase<TestEntity>
    {
        public TestRepository(Container container, ILogger<TestRepository> logger)
            : base(container, logger) { }

        protected override string GetEntityId(TestEntity entity) => entity.Id;

        public Task<TestEntity> TestReplaceWithRetry(TestEntity entity, PartitionKey pk, Func<TestEntity, TestEntity> mutator)
            => ReplaceWithRetryAsync(entity, pk, mutator, CancellationToken.None);
    }
}
```

- [ ] **Step 5: Run all tests**

Run: `cd one-bear/backend && dotnet test --no-restore -v minimal 2>&1 | tail -15`
Expected: All tests pass (existing + new).

- [ ] **Step 6: Commit**

```bash
git add tests/
git commit -m "test(infra): add CacheKeys, RedisCacheService, CosmosRepositoryBase ETag retry tests"
```

---

## Task 15: Final Build Verification

- [ ] **Step 1: Clean build**

Run: `cd one-bear/backend && dotnet clean && dotnet build 2>&1 | tail -10`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

- [ ] **Step 2: Run all tests**

Run: `cd one-bear/backend && dotnet test 2>&1 | tail -20`
Expected: All tests pass. Check that total count increased from 82 to ~100+.

- [ ] **Step 3: Verify checklist**

Run these verification checks:
```bash
# Every entity has [JsonPropertyName] — spot check
grep -c "JsonPropertyName" src/OneBear.Domain/Entities/ChatRoom.cs
# Expected: ~25+

# Every entity has _schemaVersion
grep -r "_schemaVersion" src/OneBear.Domain/Entities/ --include="*.cs" -l | wc -l
# Expected: 9

# String enums are static classes
grep -r "public static class" src/OneBear.Domain/Enums/ --include="*.cs" | wc -l
# Expected: 6

# Repository interfaces use CancellationToken
grep -c "CancellationToken" src/OneBear.Domain/Interfaces/Repositories/IChatRoomRepository.cs
# Expected: 6+

# CacheKeys TTLs are correct
grep -A1 "IntegrationChannelTtl" src/OneBear.Infrastructure/Caching/CacheKeys.cs
grep -A1 "ChatUserTtl" src/OneBear.Infrastructure/Caching/CacheKeys.cs
grep -A1 "BadgeCountTtl" src/OneBear.Infrastructure/Caching/CacheKeys.cs
```

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final verification fixes for database setup"
```
