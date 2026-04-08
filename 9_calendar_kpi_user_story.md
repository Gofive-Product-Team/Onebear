# 9. Calendar & KPI — User Story

**Status**: Ready for feedback
**Priority**: 🟡 High (Business intelligence + performance tracking)
**Target Users**: Agents (personal KPIs), Managers (team KPIs), Admin (full visibility)
**Primary Device**: Desktop (main), Mobile (quick check)
**Time Target**: KPI refresh every 5 minutes, <1 sec page load

---

## Feature Overview

The **Calendar & KPI** system provides real-time business dashboards showing sales, orders, response rates, and other key metrics. The calendar displays daily revenue heatmaps, while KPI tiles show role-specific metrics that update automatically as orders are placed and completed.

**Goal**: One dashboard → Instant visibility into shop health, team performance, and revenue trends.

---

## User Personas & Goals

### Persona 1: Agent/Staff
- Wants to see: Today's personal sales, unanswered chats, new orders assigned to them
- **Goal**: "How much did I sell today?" "Do I have any pending chats?"

### Persona 2: Manager
- Wants to see: Team-wide sales, revenue, response metrics, performance trends
- **Goal**: "What's our daily revenue?" "Which agent is underperforming?" "What's the team's AI adoption?"

### Persona 3: Admin/Owner
- Wants to see: Complete business metrics, calendar heatmap, historical trends
- **Goal**: "Weekly/monthly revenue?" "Peak selling days?" "Which channels drive most revenue?"

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **KPI dashboard adoption** | 90%+ | If not visible, can't optimize |
| **Dashboard load time** | <1 sec | Fast = insights usable |
| **KPI refresh accuracy** | 100% | Real-time = trust the data |
| **Role-based visibility** | 100% | Agents don't see salary details |
| **Historical data** | 1+ years | Trend analysis = better forecasting |

---

## KPI Definitions (Role-Based)

### Agent View (Personal Dashboard)

```
┌─────────────────────────────────────────┐
│ 📊 Your Dashboard (Agent Name)          │
│                                         │
│ TODAY                                   │
│ ┌─────────────────────────────────────┐│
│ │ 💰 Today's Sales      ฿12,500      ││
│ │    3 orders completed                ││
│ │                                      ││
│ │ 📦 New Orders         5              ││
│ │    Assigned to you (at CREATED)      ││
│ │                                      ││
│ │ ✅ Paid Orders        3              ││
│ │    Orders you converted to payment   ││
│ │                                      ││
│ │ 💬 Unanswered Chats   2              ││
│ │    Awaiting your response            ││
│ │                                      ││
│ │ 🤖 AI-Closed Orders   1              ││
│ │    Orders AI closed (no handoff)     ││
│ │                                      ││
│ │ 📮 Follow-ups Sent    8              ││
│ │    Automated follow-ups sent today   ││
│ │                                      ││
│ │ ⏳ Orders Awaiting Payment  3        ││
│ │    Customer ready, link sent         ││
│ └─────────────────────────────────────┘│
│                                         │
│ THIS WEEK                               │
│ ┌─────────────────────────────────────┐│
│ │ 💰 Week Total         ฿87,500      ││
│ │ 📈 vs Last Week       +15% ↑       ││
│ │ 🎯 Target             ฿100,000     ││
│ │ 📊 Achievement        87.5% 🔴     ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘

What Agents CAN see:
  ✅ Personal sales (Paid orders only)
  ✅ Personal "New Orders" count (at CREATED) — pipeline view
  ✅ Personal "Paid Orders" count (at PAID) — conversion view
  ✅ Personal unanswered chats
  ✅ AI-closed orders (counted at PAID status, not intent)
  ✅ Follow-ups sent (personal)
  ✅ Personal weekly target + progress

What Agents CANNOT see:
  ❌ Revenue data
  ❌ Team sales
  ❌ Other agents' metrics
  ❌ Customer payment details
  ❌ Salary/commission
```

### Manager View (Team Dashboard)

```
┌─────────────────────────────────────────┐
│ 📊 Team Dashboard                       │
│                                         │
│ TODAY                                   │
│ ┌─────────────────────────────────────┐│
│ │ 💰 Team Revenue       ฿125,000     ││
│ │    30 orders completed               ││
│ │                                      ││
│ │ 📦 Total New Orders   45             ││
│ │    Across all agents (at CREATED)    ││
│ │                                      ││
│ │ ✅ Total Paid Orders  30             ││
│ │    Across all agents (at PAID)       ││
│ │                                      ││
│ │ 💬 Unanswered Chats   12             ││
│ │    Team SLA: 95% within 2 min       ││
│ │                                      ││
│ │ 🤖 AI-Closed Orders   8              ││
│ │    % of orders AI closed: 26.7%     ││
│ │                                      ││
│ │ 📮 Follow-ups Sent    120            ││
│ │    Total team follow-ups             ││
│ │                                      ││
│ │ ⏳ Payment Awaiting   25             ││
│ │    Total pending payment             ││
│ └─────────────────────────────────────┘│
│                                         │
│ TEAM PERFORMANCE (sortable by metric)  │
│ ┌─────────────────────────────────────┐│
│ │ Agent      │ Sales   │ Orders │ SLA ││
│ ├─────────────────────────────────────┤│
│ │ Agent A    │ ฿45,000 │ 10    │ 98% ││
│ │ Agent B    │ ฿38,000 │ 9     │ 94% ││
│ │ Agent C    │ ฿28,500 │ 7     │ 92% ││
│ │ AI System  │ ฿13,500 │ 4     │ 99% ││
│ └─────────────────────────────────────┘│
│ [Show Trends] [Export Report]          │
└─────────────────────────────────────────┘

What Managers CAN see:
  ✅ Team total revenue
  ✅ Team total orders
  ✅ Team SLA metrics
  ✅ Per-agent sales breakdown
  ✅ AI closure rate
  ✅ Follow-up performance
  ✅ Team trends (vs last week/month)
  ✅ Team targets + achievement

What Managers CANNOT see:
  ❌ Individual customer payments
  ❌ Employee salary/commission
```

### Admin/Owner View (Full Analytics)

```
┌─────────────────────────────────────────┐
│ 📊 Business Analytics Dashboard         │
│                                         │
│ CALENDAR VIEW                           │
│ ┌─────────────────────────────────────┐│
│ │ April 2026                          ││
│ │ Mon Tue Wed Thu Fri Sat Sun         ││
│ │  1   2   3   4   5   6   7         ││
│ │ ฿8k ฿12k ฿15k ฿9k  ฿18k ฿5k  ฿3k ││
│ │  8   9  10  11  12  13  14        ││
│ │ ฿22k ฿19k ฿25k ฿17k ฿14k ฿4k  ฿2k ││
│ │ ...                                 ││
│ │                                     ││
│ │ Heat intensity = Revenue amount     ││
│ │ Dark red = Highest revenue day      ││
│ └─────────────────────────────────────┘│
│                                         │
│ THIS MONTH OVERVIEW                     │
│ ┌─────────────────────────────────────┐│
│ │ 💰 Total Revenue      ฿1,250,000   ││
│ │ 📦 Total Orders       315          ││
│ │ 📈 Avg Order Value    ฿3,968      ││
│ │ 🎯 Target            ฿1,500,000   ││
│ │ 📊 Achievement        83.3%         ││
│ │ 🌐 Top Channel        LINE (45%)   ││
│ │ 🏆 Top Agent          Agent A      ││
│ └─────────────────────────────────────┘│
│                                         │
│ CHANNEL BREAKDOWN                       │
│ ┌─────────────────────────────────────┐│
│ │ LINE: ฿562,500 (45%)               ││
│ │ Facebook: ฿375,000 (30%)           ││
│ │ Instagram: ฿187,500 (15%)          ││
│ │ WhatsApp: ฿125,000 (10%)           ││
│ └─────────────────────────────────────┘│
│                                         │
│ [Export PDF] [Print] [Share]           │
└─────────────────────────────────────────┘

What Admin CAN see:
  ✅ Complete revenue by day/week/month
  ✅ Calendar heatmap visualization
  ✅ All metrics (agents, AI, channels)
  ✅ Historical trends (1+ years)
  ✅ Detailed breakdown by channel
  ✅ Export & sharing reports
```

---

## Calendar & Heatmap System

### Daily Revenue Heatmap

```
Visual representation of revenue over time:

April 2026 Calendar:
┌──────────────────────────────────────┐
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun  │
├──────────────────────────────────────┤
│  1    2    3    4    5    6    7    │
│ ฿8k  ฿12k ฿15k ฿9k  ฿18k ฿5k  ฿3k  │
│ 🟩  🟩  🟥  🟨  🟥  🟫  ⬜ │
│                                      │
│  8    9   10   11   12   13   14    │
│ ฿22k ฿19k ฿25k ฿17k ฿14k ฿4k  ฿2k  │
│ 🟥  🟩  🟥  🟩  🟨  🟫  ⬜ │
│                                      │
│ Color coding:                        │
│ 🟥 Dark red   = Highest (>฿20k)     │
│ 🟩 Green      = High (฿10-20k)      │
│ 🟨 Yellow     = Medium (฿5-10k)     │
│ 🟫 Brown      = Low (฿1-5k)         │
│ ⬜ Gray       = No sales/holidays    │
└──────────────────────────────────────┘

Click on day → See:
  - Orders placed that day (count + revenue)
  - Orders completed that day
  - Top products sold
  - Channel breakdown
  - Top agents
```

---

## KPI Refresh Mechanism

### Refresh Model: 5-Minute Polling + Event-Triggered Immediate Refresh

```
KPI Refresh Rules (Locked Decisions: GAP 30, GAP 31, GAP 32, GAP 33):

Baseline: KPI snapshots refresh every 5 minutes.

Immediate refresh triggered by:
  ✅ New order CREATED → "New Orders" count +1 instantly (GAP 31)
  ✅ Order status → Paid → "Paid Orders" count +1 instantly; Revenue +฿X (GAP 31, GAP 32)
  ✅ Order status → Paid AND ai_closed = true → "AI-Closed Orders" count +1 (GAP 32)
  ✅ Paid order REVERSED → Revenue -฿X instantly; historical data updated (GAP 33)
  ✅ Follow-up sent → Follow-up count +1
  ✅ Chat answered → SLA metric updates

Deduplication (GAP 30):
  When 5-min timer fires at same moment as an order event:
  → Merge into 1 refresh job (no duplicate execution)
  → Implementation: Redis set keyed by workspace_id; check before enqueuing

Example timeline:
14:30:00.000 - Order created (status: Created)
14:30:00.050 - [Immediate refresh] "New Orders: 46" (was 45) — CREATED event
14:30:00.100 - Dashboard tile updates; "Paid Orders" unchanged

14:35:15.000 - Order status → Paid
14:35:15.050 - [Immediate refresh] "Paid Orders: 31" (was 30); "Today's Sales: ฿130,500"
14:35:15.100 - Revenue tile and calendar heatmap update

14:35:15.000 - (same moment) 5-min timer also fires
14:35:15.001 - Deduplication: Redis key workspace_123 already set → skip timer refresh
14:35:15.002 - Only 1 refresh executes (not 2)

15:15:00.000 - Paid order reversed (refund)
15:15:00.050 - [Immediate refresh] Revenue -฿5,500; historical data for 14:35 date updated
15:15:00.100 - "Today's Sales: ฿125,000" (was ฿130,500)

Technology:
  - WebSocket or Server-Sent Events for push delivery
  - Fallback to polling if WebSocket/SSE connection fails
  - Dashboard auto-subscribes to workspace KPI events
  - Redis set for refresh deduplication (keyed by workspace_id)
  - <100ms latency from event to dashboard update
```

---

## Configuration & Settings

### Admin Configuration

```
⚙️ Calendar & KPI Settings

REFRESH SETTINGS:
  KPI polling interval: 5 minutes (fixed — not configurable)
  Immediate refresh on order CREATED: [Toggle] ✅ (always on — GAP 31)
  Immediate refresh on order PAID: [Toggle] ✅ (always on — GAP 31)
  Refresh deduplication (Redis): [Toggle] ✅ (always on — GAP 30)
  WebSocket/SSE push connection: [Toggle] ✅ (for live delivery)
  Fallback to polling: [Toggle] ✅ (if WebSocket/SSE fails)

CALENDAR SETTINGS:
  Heat map intensity: [By revenue amount ▼]
  Show holidays: [Toggle] ✅
  Time zone: [Asia/Bangkok ▼]
  Week starts on: [Monday ▼]

KPI DISPLAY:
  Default view: [Dashboard ▼] (or Calendar)
  Show targets: [Toggle] ✅
  Show comparisons (vs last period): [Toggle] ✅

AGENT KPI VISIBILITY:
  Allow agents to see own sales: [Toggle] ✅
  Show daily target: [Toggle] ✅
  Show weekly target: [Toggle] ✅
  Show AI-closed orders: [Toggle] ✅

MANAGER KPI VISIBILITY:
  Show team revenue: [Toggle] ✅
  Show channel breakdown: [Toggle] ✅
  Show per-agent breakdown: [Toggle] ✅
  Show AI closure rate: [Toggle] ✅
  Show payment pending: [Toggle] ✅

EXPORT OPTIONS:
  Allow PDF export: [Toggle] ✅
  Allow CSV export: [Toggle] ✅
  Allow email scheduling: [Toggle] ✅
```

---

## Acceptance Criteria

### KPI Calculations
- [ ] Daily revenue = SUM(order.amount) WHERE order.status = 'Paid' AND order.paid_at ON target date (see Locked Decision: GAP 32)
- [ ] If a Paid order is reversed, deduct from daily revenue immediately; update historical data for the original paid_at date (see Locked Decision: GAP 33)
- [ ] Weekly revenue = Sum of Paid-order revenue (Mon-Sun, shop timezone)
- [ ] Monthly revenue = Sum of Paid-order revenue (1st-last day, shop timezone)
- [ ] "New Orders" count = COUNT(orders) WHERE order.status = 'Created' on target date — snapshot at CREATED event (see Locked Decision: GAP 31)
- [ ] "Paid Orders" count = COUNT(orders) WHERE order.status = 'Paid' on target date — snapshot at PAID event (see Locked Decision: GAP 31)
- [ ] Avg order value = Total Paid revenue / Total Paid orders
- [ ] AI closure rate = COUNT(orders WHERE ai_closed = true AND status = 'Paid') / COUNT(orders WHERE status = 'Paid') (see Locked Decision: GAP 32)
- [ ] SLA metric = Chats answered within 2 min / Total chats
- [ ] Payment pending = Orders with status PENDING_PAYMENT or PENDING_VERIFY
- [ ] KPI refresh deduplication: Redis set keyed by workspace_id prevents duplicate refresh jobs when timer and order event fire simultaneously (see Locked Decision: GAP 30)

### Agent Dashboard
- [ ] Shows personal sales (only own completed orders)
- [ ] Shows new orders assigned to agent — counted at order CREATED event (see Locked Decision: GAP 31)
- [ ] Shows paid orders assigned to agent — counted at order PAID event (see Locked Decision: GAP 31)
- [ ] Shows unanswered chats assigned to agent
- [ ] Shows AI-closed orders (for context) — counted only when order reaches PAID status (see Locked Decision: GAP 32)
- [ ] Shows follow-ups sent by agent
- [ ] Shows orders awaiting payment
- [ ] Shows daily + weekly targets
- [ ] Does NOT show: team sales, revenue, other agents' metrics
- [ ] Updates every 5 minutes (polling interval)
- [ ] Instant refresh on own order creation or own order paid event
- [ ] When 5-min refresh fires simultaneously with an order event, deduplicate into 1 refresh (see Locked Decision: GAP 30)

### Manager Dashboard
- [ ] Shows team total revenue (sum of all orders with status = Paid) — see Locked Decision: GAP 32
- [ ] Shows team "New Orders" count (at CREATED) — separate from "Paid Orders" count (at PAID) — see Locked Decision: GAP 31
- [ ] Shows team unanswered chats + SLA %
- [ ] Shows AI closure rate (team-wide) — numerator is orders where ai_closed = true AND status = Paid (see Locked Decision: GAP 32)
- [ ] Shows per-agent breakdown (sortable by sales, orders, SLA)
- [ ] Shows total follow-ups sent (team)
- [ ] Shows total orders awaiting payment
- [ ] Shows team targets + achievement %
- [ ] Shows trends (vs last week, vs last month)
- [ ] Does NOT show: individual salaries, payment details
- [ ] Updates every 5 minutes (polling interval)
- [ ] Instant refresh on any team order creation or any team order paid event
- [ ] When 5-min refresh fires simultaneously with an order event, deduplicate into 1 refresh (see Locked Decision: GAP 30)
- [ ] If a Paid order is reversed, revenue decreases immediately and historical KPI data is updated (see Locked Decision: GAP 33)

### Admin Dashboard
- [ ] Shows complete revenue by day/week/month — counts only orders with status = Paid
- [ ] Calendar with daily revenue heatmap — heat intensity reflects Paid-only revenue for that day
- [ ] Shows all team metrics (aggregated)
- [ ] Shows "New Orders" count (at CREATED) and "Paid Orders" count (at PAID) as separate tiles (see Locked Decision: GAP 31)
- [ ] Shows channel breakdown (revenue by channel)
- [ ] Shows agent breakdown (revenue by agent)
- [ ] Shows historical data (1+ years)
- [ ] Historical KPI data reflects reversals retroactively — reversed Paid orders reduce revenue on their original date (see Locked Decision: GAP 33)
- [ ] Calendar click-through to day details
- [ ] Can filter by: date range, channel, agent, product
- [ ] Export to PDF (formatted report)
- [ ] Export to CSV (raw data)
- [ ] Share report via email/link
- [ ] Updates every 5 minutes (polling interval)
- [ ] Instant refresh on any order creation or order paid event
- [ ] When 5-min refresh fires simultaneously with an order event, deduplicate into 1 refresh (see Locked Decision: GAP 30)

### Calendar Heatmap
- [ ] Color intensity = Revenue amount (dark red = highest)
- [ ] Tooltips show date + revenue amount on hover
- [ ] Click day → Shows day details (orders, agents, channels)
- [ ] Multi-month view available (scroll/navigate)
- [ ] Year-over-year comparison (view same month last year)
- [ ] Highlight weekends differently (optional)
- [ ] Highlight holidays (if enabled)

### Refresh Mechanism
- [ ] KPI refreshes on a 5-minute polling cycle (baseline interval)
- [ ] Immediate refresh triggered on: new order created (CREATED event) OR order status changes to Paid (PAID event) — see Locked Decision: GAP 31
- [ ] When 5-min timer fires at same moment as a CREATED or PAID event: merge into 1 refresh (deduplication via Redis set keyed by workspace_id) — see Locked Decision: GAP 30
- [ ] If a Paid order is reversed: immediate KPI refresh, revenue decreases instantly — see Locked Decision: GAP 33
- [ ] Real-time push on order status change to Paid (revenue tile + calendar heatmap update)
- [ ] Real-time push on new order created (New Orders count tile update)
- [ ] Real-time push on follow-up sent (Follow-ups count update)
- [ ] Real-time push on chat answered (SLA metric update)
- [ ] WebSocket or Server-Sent Events for push delivery; fallback to polling if connection fails
- [ ] Page updates WITHOUT user refresh (automatic)
- [ ] No data loss or missed events (idempotent event queue)
- [ ] Mobile-friendly updates (responsive, battery-efficient)

### Performance
- [ ] Dashboard load time < 1 second
- [ ] KPI tile update < 500ms
- [ ] Calendar render < 2 seconds
- [ ] No blocking of user interactions during refresh
- [ ] Minimal network bandwidth (delta updates, not full refresh)

### Data Integrity
- [ ] Revenue KPI only counts orders with status = 'Paid' (not PENDING_VERIFY, not CREATED)
- [ ] "New Orders" KPI counts orders at CREATED event; "Paid Orders" KPI counts orders at PAID event (two distinct metrics — see Locked Decision: GAP 31)
- [ ] "AI-Closed Orders" KPI counts orders where ai_closed = true AND status = 'Paid' (see Locked Decision: GAP 32)
- [ ] Revenue reversal: if order status changes from Paid back to any non-Paid status, revenue is deducted immediately and historical data for the original paid_at date is updated (see Locked Decision: GAP 33)
- [ ] Agent sees only own data (query filter by user_id) — enforced at API level
- [ ] Manager sees team data (query filter by team_id) — enforced at API level
- [ ] Admin sees all data (no filter)
- [ ] Audit log: Every KPI export logged
- [ ] Historical data: Retained for 1+ years

---

## Edge Cases

### Timezone Handling
```
Problem: Orders from customers in different timezones

Solution:
  - All KPIs use shop timezone (Asia/Bangkok)
  - Order completion time = shop timezone
  - Calendar shows shop timezone (not customer's)
  - E.g., Customer in US pays 11pm US time = next day in Bangkok
```

### Partial Day Data
```
Problem: Dashboard shows partial data if viewed mid-day

Solution:
  - "Today" metrics are LIVE (updating as orders come in)
  - Label shows: "Today (as of HH:MM)" to indicate when last updated
  - Clearly show "In Progress" for today's metrics
```

### Month-end Rollover
```
Problem: Order completed at 23:59 vs 00:01

Solution:
  - Use order.completed_at timestamp (not server clock)
  - Each order belongs to its actual completion date
  - No rounding or ambiguity
```

### Deleted/Cancelled Orders
```
Problem: Order marked CANCELLED after being counted

Solution:
  - KPI only counts status = 'Paid'
  - Deleted/cancelled orders (that were never Paid) don't affect daily totals
  - Historical data reflects cancellations
  - Audit log shows cancellation timestamp
```

### Paid Order Reversed (Refund/Chargeback)
```
Problem: Order already counted as Paid revenue is reversed or refunded

Solution (Locked Decision: GAP 33):
  - Revenue decreases immediately on reversal event
  - Historical KPI snapshot for the original paid_at date is retroactively updated
  - "Today's Sales" tile and calendar heatmap reflect the deduction instantly
  - Audit log records: reversal timestamp, original paid_at date, amount deducted
  - Rationale: Historical KPI should reflect accurate current state, not a
    snapshot of past intent
```

---

## Integration Checklist

- [ ] **Order Management**: KPI counts COMPLETED orders only
- [ ] **AI Sales Agent**: KPI tracks AI-closed vs handoff orders
- [ ] **Inbox Chat**: KPI tracks unanswered chats + SLA metrics
- [ ] **Follow-up Management**: KPI counts follow-ups sent
- [ ] **Product Catalog**: KPI tracks revenue by product (optional detail)
- [ ] **CRM**: Link customer to orders in KPI drill-down
- [ ] **Permissions**: Agent/Manager/Admin see role-appropriate KPIs
- [ ] **Audit Log**: Export + view actions logged

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Dashboard load time** | <1 sec | Page load from click to render |
| **KPI accuracy** | 100% | Compare dashboard to raw data |
| **Refresh latency (polling)** | <5 min (baseline cycle) | Time from event to KPI update on schedule |
| **Refresh latency (event-triggered)** | <1 sec (CREATED / PAID events) | Time from order event to KPI update |
| **Revenue reversal latency** | <1 sec | Time from reversal event to KPI deduction |
| **Calendar render time** | <2 sec | Time to display full month |
| **Adoption rate** | 90%+ | Users viewing dashboard daily |
| **Export accuracy** | 100% | PDF/CSV matches dashboard |
| **Mobile responsiveness** | 100% | Works on all devices |

---

## Configuration Defaults

| Setting | Default | Why | Range |
|---------|---------|-----|-------|
| **Polling interval** | 5 minutes | Baseline KPI refresh cycle | Fixed (GAP 30) |
| **Immediate refresh events** | Order CREATED, Order PAID | Full picture of pipeline vs revenue | Fixed (GAP 31) |
| **Refresh deduplication** | ✅ ON | Redis set prevents duplicate refresh jobs | Always on (GAP 30) |
| **WebSocket/SSE push** | ✅ ON | Live push for immediate refresh events | Toggle |
| **Fallback polling** | ✅ ON | Backup if WebSocket/SSE fails | Toggle |
| **Update latency** | <100ms | Imperceptible to users | <500ms acceptable |
| **Calendar heat map** | Revenue amount | Most relevant metric | Revenue/Orders/AOV |
| **Historical retention** | 1+ years | Sufficient for trend analysis | 6mo-3yr |
| **Export formats** | PDF + CSV | Standard business formats | Toggle each |
| **Agent KPI fields** | 6 (sales, orders, chats, AI, follow-ups, pending) | Essential personal metrics | Configurable |
| **Manager KPI fields** | 8 (team revenue, orders, SLA, AI rate, agent breakdown, etc.) | Full team visibility | Configurable |

---

## Review Questions

1. **Agent revenue visibility**: Should Agents see their own commission/revenue, or just order count?
2. **Calendar heat map**: Should it show revenue only, or also orders/AOV as alternate views?
3. **Target setting**: Should targets be configurable per agent/manager, or global?
4. **Comparison periods**: Should we show vs last week, last month, last year, or all?
5. **Mobile view**: Should mobile dashboards be simplified (fewer metrics), or full-featured?
6. **Connection fallback**: If WebSocket fails, should system fallback to polling or alert user?
7. **Export scheduling**: Should admins be able to schedule daily/weekly report emails?
8. **Drill-down capability**: Should clicking on metrics show detailed breakdown (e.g., click revenue → see by channel/agent)?

---

## Locked Decisions

These decisions are locked in `MASTER_PROTOTYPE_SPECIFICATION.md` (April 8, 2026) and are authoritative. All implementation must conform to them.

---

### GAP 30: Refresh Timer Collision

**Decision**: When the 5-minute KPI refresh timer fires at the same moment an order event (CREATED or PAID) triggers an immediate refresh, merge both into a single refresh execution.

**Why it matters**: Without deduplication, two simultaneous refresh jobs would run against the same workspace data, causing redundant DB load and potential race conditions on KPI snapshot writes.

**Implementation rule**:
- Use a Redis set keyed by `workspace_id` to track pending refresh jobs.
- Before enqueuing any refresh (timer-based or event-based), check if a job for that `workspace_id` is already queued.
- If yes: skip the new enqueue. If no: enqueue and mark the key (with a short TTL matching the debounce window).
- This is the same deduplication pattern used in the Follow-up feature (GAP 17).

**Scope**: Applies to all KPI refresh triggers — timer, order CREATED, order PAID, and revenue reversal.

---

### GAP 31: "New Order" Definition — Two Separate Metrics

**Decision**: "New Orders" and "Paid Orders" are two distinct KPI tiles with independent counts and independent snapshot timestamps.

| Metric | Trigger | What it measures |
|--------|---------|-----------------|
| New Orders | Order status = Created | Pipeline volume — how many orders entered the system today |
| Paid Orders | Order status = Paid | Conversion — how many orders actually generated revenue today |

**Why it matters**: A single "order count" metric conflates pipeline with revenue. Shop owners need to see both — high New Orders + low Paid Orders signals a conversion problem. Splitting them gives full visibility.

**Implementation rule**:
- `kpi_snapshots` table tracks both `new_orders_count` (incremented at CREATED event) and `paid_orders_count` (incremented at PAID event) independently.
- Each tile on the dashboard draws from its respective snapshot field.
- Filters: Agent sees own `user_id`-scoped counts. Manager sees `team_id`-scoped. Admin sees all.

---

### GAP 32: "AI-Closed Orders" Trigger

**Decision**: An order is counted as "AI-Closed" only when it reaches **Paid** status AND `ai_closed = true`. Orders where the AI initiated the sale but the customer never paid are NOT counted.

**Formula**: `COUNT(orders WHERE ai_closed = true AND status = 'Paid')`

**Why it matters**: Counting AI-closed orders at CREATED or at intent overstates AI performance. Revenue is the only meaningful signal that the AI successfully closed a deal end-to-end.

**Implementation rule**:
- `orders` table has `ai_closed` boolean flag set to `true` when the AI agent was the last handler before payment.
- KPI snapshot increments `ai_closed_orders_count` only on the PAID event, not the CREATED event.
- AI closure rate = `ai_closed_orders_count / paid_orders_count` (both for the same date window).

---

### GAP 33: Paid → Reversed Revenue Retroactivity

**Decision**: When a Paid order is reversed (refund, chargeback, or manual status rollback), the revenue is deducted **immediately** from live KPI tiles AND **retroactively** from the historical KPI snapshot for the original `paid_at` date.

**Why it matters**: Historical KPI data must reflect accurate current state, not a snapshot of past intent. If April 5 showed ฿50,000 in revenue and one of those orders was later refunded, April 5's historical figure should decrease accordingly. Leaving stale data in history undermines forecasting and trend analysis.

**Behavior**:
- Live tiles ("Today's Sales", "Paid Orders") update immediately on reversal event.
- Historical calendar heatmap and monthly/weekly totals for the original `paid_at` date are recalculated.
- Audit log records: `reversed_at` timestamp, `original_paid_at` date, `amount_deducted`, `order_id`.
- If the reversal happens on the same day as the original payment, "Today's Sales" simply decreases.
- If the reversal happens on a different day, the historical date is updated; "Today's Sales" is not affected (the deduction applies to the original date's record).

**Implementation rule**:
- Reversal event triggers a `recalculate_kpi_snapshot(workspace_id, date=order.paid_at)` job.
- This job re-sums all currently-Paid orders for that date (rather than applying a delta), making it idempotent.
- The same deduplication logic (GAP 30) applies to prevent concurrent reversal recalculations from stacking.

---

## Ready for Feature #10: Booking & Appointments?

✅ Calendar & KPI complete (including all 4 locked gap decisions).

**Should I proceed to Feature #10: Booking & Appointments** (3-step in-chat flow, reminders, no-show handling, recurring appointments)?



---

## Prototype Updates (April 2026)

### Calendar & KPI as Role-aware Homepage (planned)

Per product direction, Calendar & KPI is intended to serve as the **homepage/landing page** after login for Admin and Manager roles, giving an immediate view of current store health.

**Admin/Manager Homepage View:**
- Full store KPIs: Today's Sales (฿), Paid Orders count, Unanswered Chats, AI-closed Orders, Pending Follow-ups, Orders Awaiting Payment
- Calendar heatmap showing daily revenue intensity
- Revenue trend chart
- Top-performing agents tile

**Agent/Staff Homepage View:**
- Personal KPIs only: My Sales Today, My New Orders, My Unanswered Chats, My AI-assisted Orders
- KPI numbers calculated only from that agent's own data (not team-wide)
- No revenue data visible to Agent role

**Implementation Note:** This is a routing change — the default route `/` (or `/dashboard`) will render the Calendar/KPI component based on user role. The current Dashboard page (3-tab: Chat / Revenue / AI Agent) will be merged with AI Data Analyst into a unified Analytics menu.

### Acceptance Criteria (homepage role-split)
- [ ] Admin/Manager: see all store KPIs and full calendar on landing
- [ ] Agent/Staff: see only personal KPIs on landing (no team revenue)
- [ ] Viewer: sees read-only full KPI dashboard (no action buttons)
- [ ] KPI numbers match role-filtered data (not inflated by other agents' numbers for Agent role)
