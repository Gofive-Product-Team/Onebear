# CLAUDE.md -- One Bear Platform

This file provides guidance to Claude Code when working with the One Bear codebase.

## 1. Project Overview

**One Bear** is a ground-up rebuild of SalesBear/Venio -- a multi-platform social messaging SaaS for customer service agents. It consolidates chat from 9 platforms (LINE, Facebook, Instagram, WhatsApp, Email, TikTok, Lazada, Shopee, internal Venio channel) into a single agent console.

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React + TypeScript | React 19, TypeScript 5.7 |
| Build tool | Vite | 6 |
| Routing | TanStack Router | latest stable |
| Server state | TanStack Query (React Query) | latest stable |
| Client state | Zustand | latest stable |
| UI components | Shadcn/ui + Radix UI primitives | latest stable |
| Styling | Tailwind CSS | 4 |
| Forms | React Hook Form + Zod | RHF latest, Zod 3 |
| Tables | TanStack Table | latest stable |
| Rich text editor | TipTap (ProseMirror) | 2 |
| Charts | Recharts | latest stable |
| i18n | i18next + react-i18next | latest stable |
| Frontend testing | Vitest + Testing Library + Playwright | latest stable |
| Backend | .NET (C#) | 9 |
| Real-time | Azure SignalR Service + ASP.NET Core SignalR Hub | managed |
| Primary database | Azure Cosmos DB (NoSQL) | improved indexes |
| Cache | Azure Cache for Redis (StackExchange.Redis) | distributed |
| Message broker | RabbitMQ via MassTransit | MassTransit latest |
| API style | REST + OpenAPI (code-first via Swashbuckle/NSwag) | OpenAPI 3.x |
| Auth | GoFive IdP (IdentityServer4) -- existing, kept as-is | OAuth2 PKCE |
| Deployment | Azure Container Apps (API + Worker), Azure Static Web Apps (SPA) | managed |
| Monorepo | Nx | latest stable |
| Observability | OpenTelemetry + Azure Monitor (Application Insights) | OTel SDK |
| Background jobs | .NET Worker Service + Quartz.NET | .NET 9 |

### Architecture Pattern

**Clean Architecture** with four layers (Domain at center, Application, Infrastructure, Presentation at edges). Three deployable units:

1. **One Bear SPA** -- React 19 single-page application (Azure Static Web Apps)
2. **OneBear.API** -- .NET 9 REST API + SignalR Hub (Azure Container Apps, 2-10 replicas)
3. **OneBear.Worker** -- .NET 9 Worker Service + Quartz.NET (Azure Container Apps, 1-4 replicas)

Azure SignalR Service manages WebSocket fan-out externally (replaces the old Node.js Socket.IO server entirely).

### Repository Structure

Two repositories:

**Frontend monorepo (Nx):**

```
one-bear/
  apps/
    web/                          # React 19 + Vite 6 main application
  libs/
    api-client/                   # Auto-generated TypeScript client from OpenAPI spec
    shared-types/                 # TypeScript types shared with backend
    ui/                           # Shadcn/ui base components (copied + customized)
    chat/                         # Chat-specific components and hooks
    i18n/                         # i18next config and translation files
    test-utils/                   # Shared test helpers and fixtures
  tools/
    openapi-codegen/              # OpenAPI -> TypeScript code generator
  nx.json
  tsconfig.base.json
```

**Backend (.NET solution):**

```
OneBear.sln
  src/
    OneBear.API/                  # Controllers, SignalR Hub, Middleware, DI wiring
    OneBear.Application/          # Use cases, services, commands/queries, validators, DTOs
    OneBear.Domain/               # Entities, value objects, enums, interfaces, Result<T>
    OneBear.Infrastructure/       # Cosmos repos, Redis cache, platform adapters, MassTransit, blob storage
    OneBear.Worker/               # RabbitMQ consumers, Quartz.NET scheduled jobs
  tests/
    OneBear.API.Tests/
    OneBear.Application.Tests/
    OneBear.Domain.Tests/
    OneBear.Infrastructure.Tests/
    OneBear.Worker.Tests/
  Directory.Build.props
```

---

## 2. Development Conventions

### Frontend Folder Structure (apps/web)

```
src/
  routes/                         # TanStack Router file-based routes
    __root.tsx                    # Root layout
    _authenticated/               # Auth-guarded route group
      chat/
        index.tsx                 # /chat (room list)
        $roomId.tsx               # /chat/:roomId
      customer/
        index.tsx
      dashboard/
        index.tsx
      settings/
        index.tsx
      payment/
        index.tsx
      satisfaction/
        index.tsx
  components/
    ui/                           # Shadcn/ui base components (Button, Input, Dialog, etc.)
    chat/                         # Chat domain components (MessageBubble, RoomCard, Composer, etc.)
    layout/                       # Shell, Sidebar, Header, Navigation
  hooks/                          # Custom React hooks
  stores/                         # Zustand stores (client state only)
  api/                            # TanStack Query hooks wrapping the generated API client
  lib/                            # Utility functions
  types/                          # TypeScript types and Zod schemas
  i18n/                           # i18next setup, namespace loaders
```

### Backend Folder Structure (OneBear.Application)

```
OneBear.Application/
  Messaging/
    Commands/                     # SendMessageCommand + Handler + Validator
    Queries/                      # GetMessageHistoryQuery + Handler
    MessageOrchestrator.cs        # Central inbound/outbound pipeline
  Rooms/
    Commands/                     # UpdateRoomState, ReassignRoomOwner, UpdateFollowup
    Queries/                      # ListRooms, GetBadgeCount, SearchRooms
    Services/                     # RoomQueryService, RoomStateService, RoomParticipantService, BadgeService
  Integrations/
    Commands/                     # ConnectPlatform, RevokePlatform, UpdateGreeting, UpdateAutoReply, etc.
    Queries/                      # GetIntegrationSettings
    Services/                     # IntegrationService, GreetingService, AutoReplyService, ShortcutService, AutoAssignmentService
  Chatbot/
    Services/                     # ChatbotService
  Notifications/
    Services/                     # NotificationService
  Common/
    Interfaces/                   # IChatRoomRepository, ICacheService, IBlobStorageService, etc.
    DTOs/                         # ChatRoomDto, ChatMessageDto, etc.
    Mappings/                     # AutoMapper or Mapster profiles
```

### Naming Conventions

**Frontend (TypeScript/React):**

| Thing | Convention | Example |
|-------|-----------|---------|
| Component files | PascalCase `.tsx` | `MessageBubble.tsx` |
| Hook files | camelCase with `use` prefix | `useRoomList.ts` |
| Store files | camelCase with `-store` suffix | `chat-store.ts` |
| Utility files | camelCase `.ts` | `formatDate.ts` |
| Test files | Same name + `.test.ts(x)` | `MessageBubble.test.tsx` |
| E2E test files | descriptive + `.spec.ts` | `send-message.spec.ts` |
| Route files | lowercase, TanStack Router convention | `$roomId.tsx`, `index.tsx` |
| CSS classes | Tailwind utility classes only | No custom CSS files |
| Types/interfaces | PascalCase, no `I` prefix | `ChatRoom`, `MessagePayload` |
| Zod schemas | camelCase with `Schema` suffix | `sendMessageSchema` |
| Enums | PascalCase | `SocialPlatform`, `ChatState` |
| Constants | UPPER_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| Translation keys | dot-separated namespaces | `chat.room.empty`, `settings.integration.title` |

**Backend (C#/.NET):**

| Thing | Convention | Example |
|-------|-----------|---------|
| Classes | PascalCase, one per file | `ChatRoom.cs`, `RoomQueryService.cs` |
| Interfaces | PascalCase with `I` prefix | `IChatRoomRepository`, `IPlatformAdapter` |
| Methods | PascalCase | `ProcessInboundAsync()` |
| Properties | PascalCase | `CompanyId`, `LastMessageTimestamp` |
| Private fields | `_camelCase` | `_cacheService` |
| Constants | PascalCase | `MaxRetryCount` |
| Async methods | `Async` suffix | `SendTextAsync()`, `GetRoomsAsync()` |
| Commands | Verb + Noun + `Command` | `SendMessageCommand` |
| Queries | Verb + Noun + `Query` | `ListRoomsQuery` |
| Handlers | Command/Query name + `Handler` | `SendMessageCommandHandler` |
| Validators | Command name + `Validator` | `SendMessageCommandValidator` |
| Consumers | Verb + Noun + `Consumer` | `SendGreetingMessageConsumer` |
| Tests | `MethodName_ShouldExpectedBehavior_WhenCondition` | `SendText_ShouldReturnSuccess_WhenTokenValid` |

### Code Style

**Frontend:**
- Prettier: 120 char width, single quotes, no semicolons, tabs, trailing commas (ES5), always arrow parens
- ESLint with `@nx/eslint` + `prettier/recommended`
- `@nx/enforce-module-boundaries` for Nx library imports
- Strict TypeScript: `strict: true`, `noUncheckedIndexedAccess: true`
- No `any` -- use `unknown` and narrow with Zod or type guards
- No barrel files (`index.ts` re-exports) in `apps/web` -- import directly

**Backend:**
- `.editorconfig`: K&R braces, 4-space indent, CRLF line endings
- PascalCase for public members, `_camelCase` for private fields
- Prefer explicit types over `var`
- Nullable reference types enabled (`<Nullable>enable</Nullable>`)
- One class per file for entities and DTOs
- FluentValidation for all command/query validation
- XML doc comments on all public API surface (controllers, hub methods)

### Git Branch Strategy

```
main                              # Production-ready, protected
  develop                         # Integration branch
    feature/OB-123-description    # Feature branches (from develop)
    fix/OB-456-description        # Bug fix branches
    chore/OB-789-description      # Tooling, deps, config
```

- PRs require 1 approval + passing CI
- Squash merge to `develop`; merge commit from `develop` to `main`
- Branch naming: `{type}/OB-{ticket}-{short-description}`

### Commit Message Format

```
type(scope): short description

Optional body explaining why, not what.

Refs: OB-123
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`
Scopes: `chat`, `room`, `integration`, `dashboard`, `settings`, `auth`, `signalr`, `worker`, `infra`, `ui`

---

## 3. Key Commands

### Frontend (Nx monorepo)

```bash
# Dev server
nx serve web                              # Start Vite dev server (HMR)

# Testing
nx test web                               # Vitest unit/component tests
nx test web --watch                        # Watch mode
nx test ui                                # Test ui library
nx e2e web-e2e                            # Playwright E2E tests
nx e2e web-e2e --headed                   # Playwright headed mode

# Build
nx build web                              # Production build
nx build web --configuration=uat          # UAT build

# Lint
nx lint web                               # ESLint
nx lint web --fix                         # ESLint autofix
nx format:write                           # Prettier format all

# Other
nx graph                                  # Visualize dependency graph
nx affected -t test                       # Only test affected projects
nx affected -t lint                       # Only lint affected projects
nx run-many -t test --all                 # Test all projects

# Code generation
nx g @nx/react:component MessageBubble --project=chat --directory=src/components
nx g @nx/react:hook useRoomList --project=web --directory=src/hooks

# OpenAPI client generation
nx run api-client:generate                # Regenerate TypeScript client from OpenAPI spec
```

### Backend (.NET)

```bash
cd src/OneBear.API

# Build
dotnet build                              # Debug build
dotnet build -c Release                   # Release build
dotnet clean && dotnet build              # Clean build

# Run
dotnet run                                # Start API (Development profile)
dotnet run --environment Development      # Explicit environment
dotnet watch run                          # Hot reload dev server

# Tests
dotnet test                               # Run all tests
dotnet test --filter "ClassName=RoomQueryServiceTests"
dotnet test --filter "FullyQualifiedName~SendMessage"
dotnet test --collect:"XPlat Code Coverage"   # With coverage

# Lint / format
dotnet format                             # Apply .editorconfig rules
dotnet format --verify-no-changes         # CI check (no changes expected)

# Worker
cd src/OneBear.Worker
dotnet run                                # Start worker (RabbitMQ consumers + Quartz.NET)

# Docker
docker build -t onebear-api -f src/OneBear.API/Dockerfile .
docker build -t onebear-worker -f src/OneBear.Worker/Dockerfile .
```

### Infrastructure / Database

```bash
# Cosmos DB -- no migrations (schemaless), but indexing policy changes:
# Indexing policies are defined in OneBear.Infrastructure/Persistence/Cosmos/IndexPolicies/
# Applied via a startup initializer or a dedicated CLI tool

# Redis
redis-cli PING                            # Health check
redis-cli FLUSHDB                         # Clear cache (dev only!)

# RabbitMQ
# Management UI: http://localhost:15672 (guest/guest in dev)

# Azure Container Apps (deployment)
az containerapp up --name onebear-api --source .
az containerapp logs show --name onebear-api --resource-group onebear-rg
```

---

## 4. Architecture Rules

### Layer Boundaries (Dependency Rule)

All arrows point inward. Inner layers NEVER reference outer layers.

```
OneBear.API            -->  OneBear.Application, OneBear.Infrastructure, OneBear.Domain
OneBear.Worker         -->  OneBear.Application, OneBear.Infrastructure, OneBear.Domain
OneBear.Infrastructure -->  OneBear.Domain (implements interfaces defined in Domain)
OneBear.Application    -->  OneBear.Domain (uses entities, interfaces, Result<T>)
OneBear.Domain         -->  (nothing -- innermost layer, zero external dependencies)
```

**Violations that will fail code review:**
- Domain referencing Application, Infrastructure, or API
- Application referencing Infrastructure or API
- Infrastructure referencing API
- Any layer importing a NuGet package that belongs to another layer's concern (e.g., Cosmos SDK in Application)

### State Management Rules (Frontend)

**Server state (data from the API) = TanStack Query. Always.**
- Room list, messages, users, integrations, chatbot config
- Use query keys based on entity and params: `['rooms', companyId, filters]`
- SignalR events invalidate queries: when `ReceiveMessage` arrives, invalidate `['messages', roomId]`
- Never duplicate server data in Zustand

**Client state (UI-only) = Zustand.**
- Selected room, sidebar open/closed, active filters, UI preferences
- Auth state (current user, permissions, token) with `localStorage` persistence
- Zustand stores are small and focused -- one store per concern, not a god store

**What goes where:**

| Data | Where | Why |
|------|-------|-----|
| Chat rooms | TanStack Query | Server-owned, cached, SignalR-invalidated |
| Messages | TanStack Query (infinite query) | Paginated, SignalR-appended |
| Integration settings | TanStack Query | Server-owned, infrequently changes |
| Selected room ID | Zustand | UI state, not persisted to server |
| Sidebar panel state | Zustand | UI state |
| Current user + permissions | Zustand (persisted) | Derived from auth token |
| Filter/sort criteria | URL search params (TanStack Router) | Shareable, bookmarkable |

### API Call Patterns

**All API calls go through the auto-generated OpenAPI client (`libs/api-client`).**

```typescript
// CORRECT: Use the generated client wrapped in TanStack Query
const { data: rooms } = useQuery({
  queryKey: ['rooms', companyId, filters],
  queryFn: () => api.chats.getRooms(companyId, filters),
})

// WRONG: Raw fetch calls
const res = await fetch('/api/chats/rooms') // Never do this
```

**API response wrapper:** All backend responses use `{ data, success, message }`. The generated client handles unwrapping.

**Pagination:** Cosmos DB cursor-based pagination via `continuationToken`. TanStack Query's `useInfiniteQuery` for message history.

### Error Handling Patterns

**Backend -- Result<T> pattern (railway-oriented):**

```csharp
// Application layer returns Result<T>, never throws for business errors
public async Task<Result<ChatRoomDto>> GetRoomAsync(string roomId, CancellationToken ct)
{
    ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, ct);
    if (room is null)
        return new Result<ChatRoomDto>.Failure(
            new Error("ROOM_NOT_FOUND", "Room not found", ErrorType.NotFound));
    return new Result<ChatRoomDto>.Success(_mapper.Map<ChatRoomDto>(room));
}

// Controller maps Result to HTTP status
return result switch
{
    Result<T>.Success s => Ok(s.Value),
    Result<T>.Failure { Error.Type: ErrorType.NotFound } f => NotFound(f.Error),
    Result<T>.Failure { Error.Type: ErrorType.Validation } f => BadRequest(f.Error),
    Result<T>.Failure { Error.Type: ErrorType.Conflict } f => Conflict(f.Error),
    Result<T>.Failure { Error.Type: ErrorType.PlatformError } f => StatusCode(502, f.Error),
    Result<T>.Failure { Error.Type: ErrorType.RateLimited } f => StatusCode(429, f.Error),
    _ => StatusCode(500)
};
```

**Exceptions are for unexpected infrastructure failures only** (Cosmos SDK timeout, Redis down, etc.). These are caught by `ExceptionHandlingMiddleware` and mapped to ProblemDetails (500).

**Frontend -- TanStack Query error handling:**
- `onError` callbacks per query/mutation for toast notifications
- Global error boundary for unrecoverable errors
- SignalR reconnection is handled by the `@microsoft/signalr` client with automatic retry

**Polly circuit breakers** on all outbound HTTP calls to platforms. Per-platform policies defined in `OneBear.Infrastructure`. Retry 3x with exponential backoff, circuit breaks after 5 failures in 30s.

### Real-Time Event Patterns (SignalR)

The SignalR Hub (`ChatHub`) is embedded in OneBear.API. Azure SignalR Service handles WebSocket connections.

**Hub methods (client -> server):**

| Method | Purpose |
|--------|---------|
| `SendMessage(payload)` | Agent sends a message. Hub delegates to `MessageOrchestrator`. |
| `JoinRoom(roomIds[])` | Subscribe to room groups. |
| `LeaveRoom(roomId)` | Unsubscribe from room group. |
| `AttendRoom(roomId)` | Signal active viewing (presence). |
| `ExitRoom(roomId)` | Signal stop viewing. |
| `Typing(roomId, status)` | Typing indicator relay. |

**Client-side events (server -> client):**

| Event | Purpose |
|-------|---------|
| `ReceiveMessage(message)` | New or updated message in a subscribed room. |
| `ReceiveRoom(room)` | Room created/updated/assigned -- sent to userId group. |
| `UpdateRoom(roomUpdate)` | Room state change (status, assignment, tags). |
| `TypingIndicator(roomId, user, status)` | Typing broadcast. |
| `AttendanceChanged(roomId, user, attending)` | Presence change. |

**Frontend integration pattern:**

```typescript
// SignalR events invalidate TanStack Query caches
connection.on('ReceiveMessage', (message) => {
  queryClient.setQueryData(['messages', message.roomId], (old) => appendMessage(old, message))
})

connection.on('ReceiveRoom', (room) => {
  queryClient.invalidateQueries({ queryKey: ['rooms'] })
})
```

**Group management:** Server-controlled. Users are added to groups based on their `companyId` and rooms they have permission to access. Hub methods validate permissions before joining groups -- any authenticated user can NOT join any room (fixes old Socket.IO vulnerability).

### Platform Adapter Pattern (Backend)

All 8 platforms implement `IPlatformAdapter`. The `MessageOrchestrator` resolves the correct adapter via keyed DI:

```csharp
// Resolution
IPlatformAdapter adapter = sp.GetRequiredKeyedService<IPlatformAdapter>(platform);
```

Adapters are in `OneBear.Infrastructure.PlatformAdapters/`. Each wraps a typed `HttpClient` with Polly resilience. Instagram delegates to `FacebookAdapter` with an IG flag.

---

## 5. Business Context

### This App Replaces SalesBear

One Bear is a complete rewrite. No code is carried over from the Angular/Socket.IO system. All business behavior must be re-implemented from the authoritative business rules document.

### Business Rules

**All rules in `docs/architecture/07-business-rules.md` must be implemented.** Key domains:

- **AUTH**: OAuth2 PKCE via GoFive IdP, JWT validation, permission model (Chat_View, Chat_Resolved, Chat_Mention, Chat_AssignAllCompany, Chat_AccessAllData)
- **MSG**: Inbound/outbound message pipeline, 60+ message types, platform-specific capabilities, delivery status tracking (Pending -> Completed/Failed)
- **ROOM**: Room lifecycle state machine (New -> InProgress -> Close/Resolved), ETag-based concurrency, follow-up scheduling
- **ASSIGN**: Auto-assignment (round-robin, load-based), manual reassignment, attend/exit presence
- **AI**: 4 eligibility checks before AI chatbot engagement, callback handling
- **AUTOREPLY**: Keyword-based auto-reply rules, greeting messages on new room
- **NOTIFY**: Push notifications routed to room owner + participants + mentioned users
- **INT**: Integration CRUD per platform, credential management, token refresh lifecycle (Lazada 30-day, Shopee 4-hour, etc.)

### External Dependencies

See `docs/architecture/08-dependencies.md` for full map. Key integrations:

| System | Protocol | Purpose |
|--------|----------|---------|
| GoFive IdP (`login.gofive.co.th`) | OAuth2/OIDC | Authentication, SSO |
| Client Portal (`portal.gofive.co.th`) | REST | Subscription plan checks, feature gating |
| Venio CRM API (`portal.veniocrm.com/api/v4`) | REST | Customer sync, tag sync |
| Empeo API | REST | Employee/agent profile sync |
| AI Chatbot Service | REST + callback | RAG-based auto-responder |
| 8 Social Platforms | REST (webhook in, HTTP out) | Message send/receive |

---

## 6. DO NOT

### Anti-Patterns to Avoid

**These are the exact problems from SalesBear that One Bear exists to fix. Do not reintroduce them.**

- **No god classes.** No service class exceeding ~300 lines. SalesBear had `ChatroomServices` (2,700 lines), `IntegrationSettingServices` (1,593 lines), `GenericMessagingService` (846 lines). Each is decomposed into focused services in One Bear.

- **No static singletons for state.** SalesBear used `AppConfig` (static mutable class) and `DependenciesInjector` (anti-pattern singleton). Use Zustand stores (frontend) or proper DI-scoped services (backend).

- **No untyped event buses.** SalesBear used `COMMON_EVENT` and `OPEN_MODULE` as untyped RxJS Subjects as a cross-module event bus. Use typed SignalR hub methods, typed MassTransit message contracts, and TanStack Query cache invalidation.

- **No silent exception swallowing.** SalesBear had empty `catch {}` blocks that silently dropped errors causing undelivered messages. Use `Result<T>` for expected failures and let unexpected exceptions propagate to the global handler with OpenTelemetry tracing.

- **No in-memory-only cache.** SalesBear used LazyCache (per-process, not shared). Use Redis for all caching so it works across multiple API replicas.

- **No embedded secrets.** SalesBear had an RSA private key in source code (V-01), hardcoded API keys (V-02), and credentials in `appsettings.json`. All secrets go in Azure Key Vault, referenced via config.

- **No open CORS.** SalesBear used `AllowAll` CORS policy. Use explicit origin allowlists.

- **No unvalidated input.** SalesBear had no centralized input validation and no SignalR payload validation. Use FluentValidation for all commands and strongly-typed SignalR hub methods.

- **No query-string token injection.** SalesBear allowed `?access_token=` URL params to bypass OAuth. This is removed entirely.

- **No HTTP bridge for real-time.** SalesBear's .NET API called Socket.IO via HTTP POST, which called .NET back via HTTP POST (4 network hops). SignalR Hub runs in-process -- use `IHubContext<ChatHub>` directly (2 hops).

- **No micro-frontend CDN coupling.** SalesBear loaded remote Web Components from `app.gofive.co.th/modules/`. One Bear is a single SPA with code-split routes.

- **No `any` in TypeScript.** Use `unknown` and validate with Zod or type guards.

- **No `var` in C# when the type is not obvious.** Prefer explicit types for readability.

- **No manual `fetch()` calls.** All API calls go through the generated OpenAPI client.

- **No duplicating server state in Zustand.** If data comes from the API, it belongs in TanStack Query.

- **No CSS files or SCSS.** Use Tailwind utility classes only. Component-level styles use Tailwind's `cn()` merge utility with Shadcn/ui.

- **No default Cosmos DB indexing.** Every container must have a custom indexing policy that only indexes queried paths.

### Coverage Targets

- Unit tests: >= 80% line coverage for new code
- Component tests: every message type renderer, every form component
- E2E tests: 20-30 critical user flows (login, send message, receive message, room management)
- Backend: zero untested platform adapters (SalesBear's socket server had zero tests)

---

## 7. Quick Reference

### SalesBear God Class -> One Bear Service Map

| SalesBear (old) | One Bear (new) |
|-----------------|----------------|
| `ChatroomServices` (2,700 LOC) | `RoomQueryService` + `RoomStateService` + `RoomParticipantService` + `BadgeService` |
| `IntegrationSettingServices` (1,593 LOC) | `IntegrationService` + `GreetingService` + `AutoReplyService` + `ShortcutService` + `AutoAssignmentService` |
| `GenericMessagingService` (846 LOC) | `MessageOrchestrator` + `IPlatformAdapter` pattern |
| Socket.IO server (585 LOC, 0 tests) | Azure SignalR Service + `ChatHub` in OneBear.API |
| `AppConfig` static singleton | Zustand stores (frontend) / DI services (backend) |
| `Gofive.EventBusRabbitMQ` | MassTransit |
| LazyCache (in-process) | Azure Cache for Redis (distributed) |
| Exceptionless + Sentry (fragmented) | OpenTelemetry + Azure Monitor (unified) |
| Azure Functions (timer triggers) | .NET Worker Service + Quartz.NET |

### Cosmos DB Partition Keys

| Container | Partition Key |
|-----------|--------------|
| Rooms | `/companyId` |
| Messages | `/roomId` |
| Users | `/companyId` |
| IntegrationSettings | `/companyId` |
| Attachments | `/roomId` |
| FollowupSchedules | `/companyId` |
| ChatbotConfigurations | `/companyId` |

### Redis Cache TTLs

| Entity | Key Pattern | TTL |
|--------|-------------|-----|
| IntegrationSettings | `int:{integrationId}` | 1 hour |
| IntegrationSettings (by company) | `int:company:{companyId}` | 1 hour |
| ChatUser | `user:{userId}` | 5 minutes |
| ChatbotConfiguration | `chatbot:{companyId}` | 30 minutes |
| CompanyFeatureSettings | `features:{companyId}` | 15 minutes |
| Badge counts | `badge:{companyId}:{userId}` | 30 seconds |
| ChatRoom | NOT CACHED | -- (high contention, use ETag) |
| ChatMessage | NOT CACHED | -- (write-heavy, streamed via SignalR) |

### RabbitMQ Event Contracts (MassTransit)

| Event | Trigger | Consumer |
|-------|---------|----------|
| `SendGreetingMessage` | New room created | Send greeting via platform adapter |
| `SendAutoReplyMessage` | Inbound message matches keyword | Send auto-reply |
| `SendAiChatbotMessage` | Passes 4 AI eligibility checks | Forward to AI service |
| `SocialChatNotification` | New message, mention, or follow-up | Route push notification |
| `LinkTagsToRoom` | AI tags or manual rule match | Apply tags, sync to CRM |
| `WebhookIntegration` | Any inbound message | Deliver to external webhook subscribers |
| `UpsertEmployeeChatData` | HR sync trigger | Update agent profiles from Empeo |

All consumers retry 3x (incremental: 0s, 5s, 10s) then dead-letter to `{queue}_error`. Alert on dead-letter depth > 0.

---

## 8. Foundation Services (Implemented)

### Authentication

**Production:** OAuth2 PKCE via GoFive IdP (external). SPA redirects to `login.gofive.co.th`, gets JWT tokens, and the API validates them via JWKS discovery.

**Development:** `POST /api/v1/dev/token` generates JWT tokens signed with a symmetric key. This endpoint only exists in Development environment.

```bash
# Get a dev token
curl -X POST http://localhost:5000/api/v1/dev/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"dev-user","companyId":"dev-company","permissions":[3001,3002,3003,3004,3005]}'
```

**Auth schemes:**

| Scheme | Header | Applied To |
|--------|--------|------------|
| JWT Bearer | `Authorization: Bearer {token}` | All user-facing endpoints |
| API Key | `X-Api-Key: {key}` | Internal webhooks, AI callbacks |
| Anonymous + Signature | None | Platform webhook endpoints |

**Permission policies (real enforcement, not stubs):**

| Policy | Permission ID | Required For |
|--------|--------------|-------------|
| `Chat.View` | 3001 | Read rooms/messages |
| `Chat.Resolve` | 3002 | Resolve/close rooms |
| `Chat.Mention` | 3003 | Mention users |
| `Chat.AssignAll` | 3004 | Assign to any employee |
| `Chat.Admin` | 3005 | Access all company data |

**CompanyId validation:** Global `CompanyIdValidationFilter` ensures `companyId` in URL path matches the JWT `company_id` claim. Returns 403 on mismatch.

**Key files:**
- `src/OneBear.API/Auth/DevTokenController.cs` — Dev token endpoint
- `src/OneBear.API/Auth/PermissionRequirement.cs` — Permission-based authorization handler
- `src/OneBear.API/Auth/ApiKeyAuthHandler.cs` — API key auth with constant-time comparison
- `src/OneBear.API/Auth/CompanyIdValidationFilter.cs` — Tenant isolation filter
- `src/OneBear.API/Auth/ClaimsPrincipalExtensions.cs` — Helper methods (GetUserId, GetCompanyId, HasPermission)

**Frontend auth flow:**
1. App checks `useAuthStore.isAuthenticated`
2. If not authenticated, shows `LoginPage` (calls dev token endpoint in dev mode)
3. Token stored in Zustand with `persist` middleware (localStorage)
4. `api-client.ts` reads token from store, sets `Authorization` header
5. On 401 response, auto-logout and redirect to login
6. `isTokenExpired()` checks with 1-minute buffer before actual expiry

### Error Handling

**Backend:**
- `ExceptionHandlingMiddleware` catches all unhandled exceptions
- Correlation ID: reads `X-Correlation-Id` header or generates new GUID, sets on response
- Maps exceptions to ProblemDetails with appropriate HTTP status codes
- Internal errors hide details — return correlation ID for debugging
- Slow request warning: logs requests taking >5000ms
- `ResultExtensions.ToActionResult()` maps `Result<T>` to HTTP responses without repeating switch patterns

**Frontend:**
- `ErrorBoundary` component wraps the app — catches React render errors
- `ApiError` class with `status`, `body`, `correlationId` for structured error handling
- 401 responses auto-trigger logout
- `X-Correlation-Id` sent on every request for traceability

### Real-Time (SignalR)

**Server (ChatHub):**
- JWT authenticated — same token as REST API
- On connect: auto-joins `user:{userId}` and `company:{companyId}` groups
- Structured lifecycle logging (connect, disconnect, join, attend)
- Typed `SendMessagePayload` for `SendMessage` hub method
- Typing indicators broadcast to `Clients.OthersInGroup` (excludes sender)
- `SignalRNotifierService` implements `ISignalRNotifier` via `IHubContext<ChatHub>` for server-side push

**Client:**
- `startSignalR()` / `stopSignalR()` / `getConnectionState()` exports
- Token from Zustand store — refreshed on each reconnect via `accessTokenFactory`
- Exponential backoff reconnect: 0, 1s, 2s, 5s, 10s, 30s max
- Connection lifecycle logging (reconnecting, reconnected, closed)

**SignalR hub path:** `/hubs/chat`

**Group naming:**

| Group | Pattern | Joined By |
|-------|---------|-----------|
| User | `user:{userId}` | Auto on connect |
| Company | `company:{companyId}` | Auto on connect |
| Room | `room:{roomId}` | Client calls `JoinRooms` |
| Presence | `presence:{roomId}` | Client calls `AttendRoom` |

### Shared Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `PagedResult<T>` | Application/Common/DTOs | Cosmos cursor-based pagination envelope |
| `DateTimeHelper` | Application/Common | Unix ms <-> DateTimeOffset conversion |
| `ValidationHelper` | Application/Common | `EnsureNotNull`, `EnsureNotEmpty` returning `Result<T>` |
| `ResultExtensions` | API/Extensions | `Result<T>` -> `IActionResult` mapping |
| `ClaimsPrincipalExtensions` | API/Auth | JWT claim reading helpers |
| `api-client.ts` | Frontend/lib | Typed API client with auth + error handling |
| `pagination.ts` | Frontend/lib | `PagedResponse<T>`, `toQueryParams()` |
| `date.ts` | Frontend/lib | `formatRelativeTime()`, `formatTime()` |
