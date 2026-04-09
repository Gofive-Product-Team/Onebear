# 6. Follow-up Management — User Story

**Status**: Ready for feedback
**Priority**: 🟡 High (Revenue retention + re-engagement driver)
**Target Users**: Managers, Agents/Staff
**Primary Device**: Mobile (create) + Desktop (admin config)
**Time Target**: 15-minute scheduler cycles, flexible send window

---

## Feature Overview

The **Follow-up Management** system automatically re-engages customers who showed interest but haven't completed an order. It sends intelligent reminders based on admin-configured schedules, respecting customer timezones and send windows.

**Goal**: Recover abandoned browsing → convert to orders → increase AOV through timely follow-ups.

---

## User Personas & Goals

### Persona 1: Busy Manager
- Manages 5-10 agents across 2-3 channels
- Wants hands-off follow-ups with minimal config
- **Goal**: Set once, let system run 24/7 to recover lost sales

### Persona 2: Hands-on Agent
- Personally tracks "interested but not ordered" customers
- Wants to queue follow-ups manually for their chats
- **Goal**: Send quick reminder → close order in next message

### Persona 3: Store Owner (Admin)
- Needs insights: Which follow-ups worked? ROI?
- Wants to adjust send windows by channel (e.g., LINE 8am-10pm, Facebook 9am-8pm)
- **Goal**: Optimize follow-up timing per channel → higher conversion

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **Recovery rate** | 15-25% of abandoned chats → orders | Each recovered order = +฿500-5000 |
| **Avg follow-ups sent/day** | 20-50 per shop | Passive revenue from re-engagement |
| **Open rate** | 40%+ (first 2 hours) | Customers check messages during business hours |
| **Handoff rate** | <10% (AI closes most) | Reduces agent workload |
| **Setup time** | <2 min (default works) | Low friction = high adoption |

---

## 3-Step Feature Architecture

### Step 1: Trigger Logic (When to Queue Follow-up)

**Auto-queue conditions** (triggered in background):
1. **Abandoned Browse** → Customer asked about product, then went silent for admin-configured time (default 2+ hours)
2. **AI Gave Up** → AI tried 2+ clarifications, customer didn't respond or kept asking price (no purchase intent detected)
3. **Manual Queue** → Agent clicks [Follow-up] button in chat

**Configurable by Admin**:
- **Trigger delay**: How long to wait before first follow-up (default 2h, configurable 1-24h)
- **Trigger message**: Custom message for abandoned customers (per channel, with {{product_name}}, {{product_price}} variables)
- **Retry schedule**: Second/third follow-up timing and messages (e.g., +4h delay, different message)

**Do NOT auto-queue if**:
- ❌ Customer already responded (conversation active)
- ❌ Order already placed (customer completed intent)
- ❌ Chat marked as "Do Not Disturb" by admin

---

### Step 2: Scheduler (How to Send)

**Scheduler runs**: Every 15 minutes (system-wide)

**Per follow-up, check**:
1. Is it within the send window? (default 09:00-21:00 Bangkok time)
2. Has debounce delay passed? (e.g., don't send if 1 follow-up sent < 4 hours ago)
3. Have max attempts been exceeded? (default 2, max 5)
4. Is the stop condition triggered?

**If all pass** → Send follow-up message to customer via original channel

**Scheduler Refresh Collision (GAP 17 — LOCKED)**:
When the 15-minute refresh timer fires at the same moment as a status change event (e.g., order paid, customer reply received), the system merges both triggers into a single refresh cycle — no duplicate processing. Deduplication is enforced via a Redis pending-refresh set, keyed by `workspace_id`. If a refresh is already queued for that workspace, the incoming trigger is dropped; the queued refresh handles it.

```
Example Timeline (with admin-configured 2h delay + 4h debounce):
14:30 → Customer abandoned chat (signal detected)
16:30 → 2h passed, scheduler triggers follow-up #1 message
        (admin configured: "Item still available! Price: ฿{{product_price}}")
16:31 → Message sent successfully
20:30 → 4h debounce passed, scheduler checks for follow-up #2
20:31 → Scheduler triggers follow-up #2 message
        (admin configured: "New discount: 10% off this item!")
22:45 → Outside send window (21:00 cutoff), queued for tomorrow 09:00
```

```
Example — Refresh Collision (GAP 17):
16:30:00 → 15-min scheduler cycle begins for workspace "ShopA"
16:30:00 → Order #123 marked Paid simultaneously → triggers status-change refresh
           → System checks Redis: refresh already queued for "ShopA"
           → Status-change refresh DROPPED — scheduler cycle handles it
16:30:05 → Single unified cycle processes all pending follow-ups for "ShopA"
           → Order #123 stop condition detected → follow-up cancelled correctly
```

---

### Step 3: Merge Behavior (Multiple Follow-ups)

**Merge rule (GAP 18 — LOCKED)**: When 3 or more follow-ups are scheduled for the same customer within the same 5-minute window, they are merged into **1 single message**. Grouping key: `customer_id` + scheduled send time (rounded to 5-minute bucket). Content is assembled in merge order (oldest queued first). The merged message reads naturally as: "X, Y, and Z are ready for you."

```
Scenario (3 follow-ups at 18:45 for same customer):
- Queue 1 (18:43 queued): "Shirt ฿599 — still in stock"
- Queue 2 (18:44 queued): "New discount code: SAVE10 (today only)"
- Queue 3 (18:44 queued): "Free shipping on orders over ฿1000"

MERGED MESSAGE (sent as 1 message at 18:45):
"Shirt ฿599 — still in stock, New discount code: SAVE10 (today only),
and Free shipping on orders over ฿1000 are ready for you.

[Check Now]"
```

**Format**:
- Each merged follow-up contributes its core content inline
- All 3+ follow-ups merged into 1 message (no truncation — all are included)
- Always include 1 CTA at bottom: "[Check Now]" or "[Claim Discount]"
- Merge grouping window: 5 minutes (follow-ups scheduled within 5 minutes of each other are treated as the same batch)

---

## Configuration Panel

### Admin Settings (Desktop) — One Rule Per Channel

```
⚙️ Follow-up Settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 LINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Toggle] Enable follow-ups: ✅

Send Window:    [08:00] to [22:00] (Bangkok time)
Max Attempts:   [2] attempts per customer (1-5)
Debounce:       [4] hours between attempts

ATTEMPT #1 — Send after customer silent for:
  Delay:   [2] hours
  Message: [textarea]
    "สินค้า {{product_name}} ยังมีคนสนใจเยอะ!
     ราคา: ฿{{product_price}} | Stock: {{product_stock}}
     [ดูสินค้า]"
  [Preview]

ATTEMPT #2 — Send [4] hours after Attempt #1:
  Message: [textarea]
    "ขออีกโอกาส! {{product_name}} ลดราคาแล้ว
     ตอนนี้ ฿{{product_price}}
     [สั่งเลย]"
  [Preview] [Remove Attempt #2]

[+ Add Attempt #3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Facebook
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Toggle] Enable follow-ups: ✅

Send Window:    [09:00] to [21:00] (Bangkok time)
Max Attempts:   [2] attempts per customer (1-5)
Debounce:       [4] hours between attempts

ATTEMPT #1 — Send after customer silent for:
  Delay:   [2] hours
  Message: [textarea]
    "Hi {{customer_name}}! Your item {{product_name}} (฿{{product_price}}) is still available!"
  [Preview]

ATTEMPT #2 — Send [4] hours after Attempt #1:
  Message: [textarea]
    "Last chance! {{product_name}} is almost out of stock. Order now for ฿{{product_price}}"
  [Preview] [Remove Attempt #2]

[+ Add Attempt #3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📷 Instagram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Toggle] Enable follow-ups: ❌ (disabled)

[Enable this channel]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 WhatsApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Toggle] Enable follow-ups: ❌ (disabled)

[Enable this channel]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 Lazada
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Toggle] Enable follow-ups: ✅

Send Window:    [09:00] to [21:00] (Bangkok time)
Max Attempts:   [1] attempt per customer (1-5)
Debounce:       [4] hours between attempts

ATTEMPT #1 — Send after customer silent for:
  Delay:   [3] hours
  Message: [textarea]
    "Don't miss out! {{product_name}} (฿{{product_price}}) is selling fast"
  [Preview]

[+ Add Attempt #2]
```

**Available variables** (insert into any message):
- `{{product_name}}` — Product name
- `{{product_price}}` — Current price
- `{{product_stock}}` — Current stock
- `{{customer_name}}` — Customer first name
- `{{discount_percent}}` — Discount if available

**Rules**:
- Each channel has its own complete rule (trigger time, send window, messages)
- Toggle to enable/disable each channel independently
- Changes take effect immediately (next scheduler cycle)
- Max 5 attempts per channel (but usually 2-3 is enough)

---

## Feature Flows

### Flow 1: Auto-triggered Follow-up (Agent view in Chat)

```
Chat Screen:
┌────────────────────────────────────────┐
│ Customer: "Berapa harganya?" (2h ago)  │
│ Agent: "฿499" → No response             │
│                                         │
│ [Follow-up scheduled] ✅               │
│ Next attempt: Today 18:45              │
│                                         │
│ [Cancel Follow-up] [Change Time]      │
└────────────────────────────────────────┘
```

**What agent sees**:
- Confirm follow-up is queued
- Next send time
- Option to cancel or reschedule

---

### Flow 2: Manual Queue (Agent initiates)

```
Chat Actions Menu:
  ┌──────────────────┐
  │ [Take Control]   │
  │ [Assign]         │
  │ [Follow-up] ← NEW│
  │ [Notes]          │
  │ [Mute]           │
  └──────────────────┘

Click [Follow-up]:
  ┌────────────────────────────────────┐
  │ Queue Follow-up                    │
  │                                    │
  │ Send at: [Today 18:45 ▼]          │
  │          Custom time: [HH:MM]      │
  │                                    │
  │ Message preview:                   │
  │ "สินค้า {{name}} ยังมีคนสนใจ..." │
  │ [Edit]                             │
  │                                    │
  │ Max attempts: 2                    │
  │ [Queue] [Cancel]                  │
  └────────────────────────────────────┘
```

**Options**:
- Queue now (scheduler will send at configured time)
- Queue with custom time (override next send window)
- Edit message before sending
- Set max attempts (1-5)

---

### Flow 3: Admin Dashboard (Follow-up Analytics)

```
Desktop Follow-up Dashboard:

📊 Today's Follow-ups
  Sent: 42
  Opened: 18 (43%)
  Converted: 5 (12%)
  Failed: 1

Recent Follow-ups:
┌──────────────────────────────────────────────┐
│ Customer  │ Channel │ Message  │ Sent  │ Status│
├──────────────────────────────────────────────┤
│ Niran K.  │ LINE    │ "Still..." │ 14:30 │ Opened│
│ Aom S.    │ FB      │ "New..." │ 15:45 │ Sent  │
│ Can't... │ IG      │ "Limited..."│ 16:00│ Failed│
│ Ped L.    │ LINE    │ "Back in..."│ 16:15│ Opened│
└──────────────────────────────────────────────┘

Filters:
  [All Channels ▼] [Today ▼] [All Status ▼]

Actions:
  [Export CSV] [View Details] [Resend Failed]
```

---

## Key User Flows

### Happy Path: Auto-Queue → Send → Conversion

```
Admin configured:
  - Trigger delay: 2 hours after silence
  - Attempt #1 message: "สินค้า {{product_name}} ยังมี! ฿{{product_price}}"
  - Attempt #2 message (4h later): "ลดราคาเพิ่ม 10%! ฿{{discounted_price}}"

Timeline:
1. 14:30 - Customer: "Shirt ฿599 ดีกว่า" → Agent: "นั่นราคาต่ำสุด" → Customer silent
2. 16:30 - 2h passed, scheduler triggers Attempt #1 → Sends: "สินค้า Shirt ยังมี! ฿599"
3. 16:31 - Customer opens message on LINE
4. 16:45 - Customer: "ลด 100 ได้ไหม?"
5. 16:50 - Agent: "ได้ค่ะ ฿499 ตกลง?"
6. 16:55 - Customer: "ตกลง!" [Payment link sent]
7. 17:10 - Order status = Paid → Follow-up STOPPED ✅ (no Attempt #2 sent)
```

### Multi-channel Merge

```
1. Customer browsed on LINE + Facebook (same person)
2. 14:30 abandoned on both channels
3. 18:45 scheduler runs:
   - Follow-up #1 (LINE): "Shirt available"
   - Follow-up #2 (FB): "New 10% discount"
   → MERGED on LINE: "Shirt available\n\nNew 10% discount ✨"
   → Separate message on FB (different channel)
```

### Disable for Unresponsive Customer (GAP 19 — LOCKED)

```
1. Follow-up #1 sent at 18:45 → No response
2. Follow-up #2 sent at 22:45 → No response (retry_count = 1)
3. Follow-up delivery fails → system retries automatically
   Retry 1: +1 min  → Still fails (retry_count = 1)
   Retry 2: +5 min  → Still fails (retry_count = 2)
   Retry 3: +15 min → Still fails (retry_count = 3)
4. After 3 retries: System stops auto-retry
   → Sets manual_review_required = true
   → Follow-up status = "Pending Admin Review"
   → Admin notified in dashboard (queue entry flagged)
5. Admin must manually review and choose: [Retry Now] or [Cancel]
```

Note: Max attempts (default 2, configurable 1-5) controls how many follow-up messages
are sent to the customer. Retry count (max 3) controls how many times the system retries
a single failed message delivery. These are independent counters.

---

## Acceptance Criteria

### Core Scheduler Logic
- [ ] Scheduler runs every 15 minutes (system-wide, no downtime)
- [ ] Respects send window (default 09:00-21:00 Bangkok)
- [ ] Respects debounce delay (default 4 hours between attempts)
- [ ] Respects max attempts (default 2, configurable 1-5)
- [ ] Stops if customer responds (conversation active)
- [ ] Stops if order completed (status = Paid/Completed)
- [ ] Stops if manually cancelled by agent
- [ ] [GAP 17] Scheduler refresh collision: Redis deduplication by workspace_id prevents duplicate processing when timer and status-change fire simultaneously
- [ ] [GAP 17] Only 1 refresh cycle runs per workspace per 15-min window regardless of how many events arrive concurrently

### Configurable Triggers (One Rule Per Channel)
- [ ] Each channel has own complete rule (enable/disable, send window, trigger delay, messages)
- [ ] Admin can set trigger delay per channel: 1-24 hours after customer abandonment (default 2h)
- [ ] Admin can configure message per attempt (1st, 2nd, 3rd follow-up) per channel
- [ ] Each trigger message supports variables: {{product_name}}, {{product_price}}, {{product_stock}}, {{customer_name}}, {{discount_percent}}
- [ ] Trigger configuration saved in workspace settings
- [ ] Changes apply to NEW abandoned customers immediately
- [ ] [+ Add Attempt #N] button to enable additional follow-up attempts per channel
- [ ] Message preview shows rendered output before save
- [ ] [Remove Attempt #N] to delete an attempt (keep min 1 attempt)
- [ ] Configuration UI shows all channels in one scrollable page (not separate tabs)

### Message Queuing
- [ ] Auto-trigger: Abandoned for admin-configured time (default 2h) after silent customer
- [ ] Auto-trigger: AI gave up (2+ clarifications, low confidence)
- [ ] Manual queue: Agent can click [Follow-up] in chat anytime
- [ ] Custom time: Agent can override scheduled time
- [ ] Message preview: Agent sees template before send
- [ ] Custom message: Agent can edit message before send

### Merge Behavior
- [ ] Multiple follow-ups for same customer → merged into 1 message
- [ ] [GAP 18] 3 or more follow-ups for same customer within same 5-minute window → all merged into 1 message (no truncation)
- [ ] [GAP 18] Merge grouping key: customer_id + 5-minute scheduled window
- [ ] [GAP 18] Merged message format: "X, Y, and Z are ready for you." (natural language join)
- [ ] Each merge has 1 CTA at bottom
- [ ] Merge preserves order (oldest queued first, newest last)

### Per-Channel Configuration (Independent Rules)
- [ ] Each channel shows as separate card/section on settings page (LINE, Facebook, Instagram, WhatsApp, Lazada, etc.)
- [ ] Each channel card includes: enable/disable toggle, send window, trigger delay, max attempts, debounce, message templates
- [ ] Admin can toggle enable/disable per channel (one toggle per channel)
- [ ] Admin can set send window per channel (e.g., LINE 08:00-22:00, Facebook 09:00-21:00)
- [ ] Admin can set trigger delay per channel (1-24h, e.g., LINE 1h, Facebook 2h, Lazada 3h)
- [ ] Admin can set max attempts per channel (1-5, default 2)
- [ ] Admin can set debounce per channel (2-48h, default 4h)
- [ ] Admin can configure separate messages for each channel
- [ ] Each channel is completely independent (no global defaults to override)
- [ ] Changes take effect immediately (scheduler picks up on next cycle)
- [ ] UI is simple, linear, scrollable - see all channels in one view

### Admin Dashboard
- [ ] Shows follow-ups sent today
- [ ] Shows open rate (% opened / % sent)
- [ ] Shows conversion rate (% converted / % opened)
- [ ] Shows failed attempts with reason
- [ ] Filterable by channel, date, status
- [ ] [Resend Failed] button for retry
- [ ] [Export CSV] for analytics

### Timing & Performance
- [ ] Follow-up delivery < 5 seconds after scheduler triggers
- [ ] Message rendered on customer device < 2 seconds
- [ ] No message loss (idempotent re-queue if scheduler crashes)
- [ ] Timezone handling: Always use Asia/Bangkok unless overridden

### Data Integrity
- [ ] Each follow-up logged with: customer_id, channel, message, sent_time, status, attempts
- [ ] [GAP 19] Each follow-up record tracks: retry_count (0-3) and manual_review_required (boolean)
- [ ] Audit log: "Follow-up #N sent to [Customer]"
- [ ] Audit log: "Follow-up stopped: max attempts reached"
- [ ] [GAP 19] Audit log: "Follow-up delivery failed after 3 retries — pending admin review"
- [ ] [GAP 19] Admin dashboard flags all records with manual_review_required = true
- [ ] No duplicate messages (idempotency key = customer_id + attempt_number + timestamp)

---

## Edge Cases & Error Handling

### Scheduler Crashes
**Problem**: Scheduler crashes during cycle
**Solution**:
- On restart, reprocess queued follow-ups from last successful cycle
- Idempotency check: Don't re-send if already sent to customer in last 5 minutes

### Message Delivery Fails
**Problem**: Channel API returns error (e.g., LINE API down)
**Solution (GAP 19 — LOCKED)**:
- Retry exactly 3 times with exponential backoff (1min, 5min, 15min)
- retry_count incremented on each attempt (0 → 1 → 2 → 3)
- After retry_count reaches 3: Auto-retry stops permanently for that message
- System sets manual_review_required = true on the follow-up record
- Follow-up status changes to "Pending Admin Review"
- Admin dashboard surfaces all flagged records; admin must choose [Retry Now] or [Cancel]
- Admin can manually [Retry Now] after channel recovers

### Timezone Edge Case
**Problem**: Send window spans midnight (e.g., 20:00-02:00)
**Solution**:
- Calculate per-customer timezone (from workspace default or contact record)
- If no custom timezone: Use workspace default (Asia/Bangkok)
- Example: Customer in US, shop in Bangkok
  - Shop send window: 09:00-21:00 Bangkok time = 00:00-12:00 US time
  - Send at customer's local 08:00 instead (respect customer preference)
  - *For MVP: Use workspace timezone only, add customer timezone in v2*

### Customer Unsubscribes
**Problem**: Customer marks message as spam or blocks shop
**Solution**:
- Mark follow-up as "Blocked" → no more follow-ups to this customer
- (Option) Add [Stop] button in message: Customer can opt-out
- Respect opt-out: No follow-ups until admin manually re-enables

### Merge Collision (3+ Follow-ups at same time)
**Problem**: Customer has 3 or more pending follow-ups scheduled within the same 5-minute window
**Solution (GAP 18 — LOCKED)**:
- Group all of them by customer_id + 5-minute scheduled window
- Merge ALL of them into 1 single message (no truncation, no re-queuing)
- Sort by queue creation time (oldest first) when assembling the merged message
- Format: "X, Y, and Z are ready for you."
- No follow-ups are dropped or deferred to the next cycle

### Custom Time Conflicts
**Problem**: Agent manually sets follow-up for 22:30, but send window ends at 21:00
**Solution**:
- Show warning: "⚠️ This time is outside send window (21:00). Message will be delayed until 09:00 tomorrow."
- Allow agent to proceed anyway (override)
- Or suggest nearest in-window time: "Next available: Tomorrow 09:00"

---

## Configuration Defaults (Per Channel)

| Setting | Default | Why | Range |
|---------|---------|-----|-------|
| **Enabled** | ✅ ON (all channels) | Passive revenue with 0 friction | Toggle on/off per channel |
| **Trigger delay** | 2 hours | Customer often returns within 2h | 1-24 hours per channel |
| **Max attempts** | 2 | Avoid spamming customers | 1-5 per channel |
| **Debounce** | 4 hours | Respects customer time | 2-48 hours per channel |
| **Send window** | 09:00-21:00 Bangkok | Respect waking hours | Custom per channel |
| **Merge enabled** | ✅ ON | Reduce message clutter | Always on (GAP 18) |
| **Merge window** | 5 minutes | Group near-simultaneous follow-ups | Fixed (not configurable) — GAP 18 |
| **Delivery retries** | 3 retries max | Exponential backoff before admin review | Fixed at 3 — GAP 19 |
| **Auto-trigger** | ✅ ON | Catch abandoned chats | Always on |

**Each channel is configured independently** — no global rules, just channel-specific cards with all settings visible together.

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Avg follow-ups/day** | 20-50 per shop | Count in scheduler logs |
| **Open rate** (first 2h) | 40%+ | Messages marked "read" / sent |
| **Click rate** | 25%+ (of opened) | Link clicks / opened |
| **Conversion rate** | 12-18% (of clicked) | Orders placed / clicks |
| **ROI** | 5:1 (min) | Revenue from follow-ups / cost |
| **Adoption** | >70% of shops enable | Shops with ≥1 follow-up sent |
| **Failed delivery** | <1% | Failed / sent |
| **Scheduler uptime** | 99.9%+ | No missed cycles |

---

## Integration Checklist

- [ ] **Inbox Chat**: When [Follow-up scheduled] badge shown, respect as "active"
- [ ] **AI Sales Agent**: Auto-trigger follow-up if AI intent < 70% confidence
- [ ] **Product Catalog**: Include {{product_name}}, {{product_price}} in template
- [ ] **Order Management**: Stop follow-up when order.status = "Paid"
- [ ] **CRM**: Link follow-up to customer record (searchable)
- [ ] **Dashboard/KPI**: Count follow-ups as engagement metric
- [ ] **Audit Log**: Log every follow-up (queue, send, failure, cancel)

---

## Review Questions

1. **Trigger delay range**: Currently 1-24 hours per channel. Should we allow longer (e.g., up to 7 days) for some channels?
2. **Max attempts cap**: Currently max 5 attempts per channel. Should we allow more?
3. **Message template versioning**: If admin changes a message template, does it apply to:
   - **Option A**: All existing abandoned customers (retroactive)
   - **Option B**: Only new abandoned customers from that point forward
   - **Option C**: User chooses (apply now / apply future only)
4. **AI "gave up" trigger**: Should AI-abandoned customers use a different message template than customer-abandoned customers?
5. **Debounce timing**: Is 4 hours (default debounce) too aggressive? Should it be 2 or 6?
6. **Merge limit**: ~~Max 3 follow-ups per merge — is this correct? Or allow unlimited merge?~~ RESOLVED (GAP 18): All follow-ups within the same 5-minute window are merged into 1 message. No truncation.
7. **Spam safeguard**: Should we add a [Stop] button in every follow-up message (opt-out)?
8. **Conversion attribution**: Should we track "order from follow-up" separately in analytics?

---

## Ready for Feature #7: Order Management?

✅ Follow-up Management complete.

**Should I proceed to Feature #7: Order Management** (order status flow, payment links, deposit tracking, idempotency, notifications)?

---

## Locked Decisions

All decisions below are final and locked. They were resolved via gap analysis against the Onebear Master Prototype Specification (locked April 8, 2026). Do not reopen these without explicit stakeholder sign-off.

---

### GAP 17 — Scheduler Refresh Collision

**Decision**: When the 15-minute scheduler timer fires at the same moment as a status-change event (e.g., order paid, customer reply), both triggers are merged into a single refresh cycle. Duplicate refreshes are dropped.

**Implementation rule**: A Redis set stores pending refreshes keyed by `workspace_id`. Before enqueuing a refresh, the system checks if one is already present. If yes, the new trigger is discarded. If no, it is enqueued. The single queued refresh processes all pending follow-ups for that workspace.

**Consequence**: No follow-up can be processed twice in the same cycle. Stop conditions (order paid, customer reply) are guaranteed to be evaluated within the same cycle that would have sent the follow-up, preventing race conditions.

**Affected sections**: Step 2 (Scheduler), Acceptance Criteria — Core Scheduler Logic

---

### GAP 18 — Merge Behavior for Overlapping Follow-ups (3+ at Same Time)

**Decision**: When 3 or more follow-ups are scheduled for the same customer within the same 5-minute window, all of them are merged into exactly 1 message. There is no truncation and no re-queuing of excess follow-ups.

**Merge grouping key**: `customer_id` + scheduled send time (rounded down to the 5-minute bucket).

**Message format**: Content from all queued follow-ups is joined in chronological queue order. The merged message reads: "X, Y, and Z are ready for you." with a single CTA at the bottom.

**What changed from original spec**: The original spec capped merges at 3 (truncating older ones if >3 and re-queuing the remainder). The locked decision removes this cap and re-queuing behavior entirely. All follow-ups in the same window are merged regardless of count.

**Affected sections**: Step 3 (Merge Behavior), Acceptance Criteria — Merge Behavior, Edge Cases — Merge Collision

---

### GAP 19 — Max Retry Behavior After Delivery Failure

**Decision**: When a follow-up message fails to deliver (channel API error, network failure, etc.), the system retries automatically up to 3 times using exponential backoff (1 min, 5 min, 15 min). After 3 failed retries, the system stops all automatic retry attempts and requires human intervention.

**Flags set after 3 retries**:
- `retry_count` = 3
- `manual_review_required` = true
- Follow-up status = "Pending Admin Review"

**Admin responsibility**: The admin dashboard surfaces all records with `manual_review_required = true`. The admin must choose [Retry Now] (to attempt delivery once more manually) or [Cancel] (to abandon this follow-up). The system does not auto-retry after the flag is set, even if the channel recovers.

**Distinction from max attempts**: `max_attempts` (default 2, configurable 1-5 per channel) controls how many follow-up messages are sent to the customer over time. `retry_count` (fixed max 3) controls how many times a single message delivery is reattempted after a channel failure. These are independent counters on each follow-up record.

**Affected sections**: Key User Flows — Disable for Unresponsive Customer, Edge Cases — Message Delivery Fails, Acceptance Criteria — Data Integrity, Configuration Defaults


---

## Prototype Updates (April 2026)

### Settings Moved to Admin Settings Page

**Change**: The Follow-up configuration panel (send window, per-channel templates, delay, max attempts) has been removed from the Follow-up Management page tab bar. It is now exclusively in **Settings → Follow-up** (accessible to Admins only).

**Rationale**: The user confirmed "follow up setting should set by admin in setting" — settings are a separate admin concern from day-to-day follow-up queue management.

**UI Changes**:
- `FollowUpPage.tsx`: Removed the "ตั้งค่า" tab from the status filter bar. Removed `ChannelConfigPanel` rendering. Removed `activeView` state.
- `SettingsPage.tsx`: Added "Follow-up" entry under Messaging group in sidebar. `SectionContent` now renders `<FollowUpSettings />` for `case 'follow-up'`.
- `FollowUpSettings.tsx` (new): Dedicated settings component with global send window (09:00–21:00 Bangkok), out-of-window behavior (next morning / wait / cancel), and per-channel config (LINE, Facebook, Instagram, WhatsApp) — each with toggle, delay (30m–24h), max attempts (1–5), template editor with variable chips, and preview toggle.

### Status Filter Bar Simplified

The Follow-up page now shows only status filter tabs (All / Queued / Sent / Failed / Stopped) with no settings tab. A "สร้าง Follow-up" button remains in the page header.
