# 3. CRM (Customer Management) — User Story

**Status**: Ready for Review
**Priority**: 🔴 Critical (Core customer database)
**Target Users**: Shop admins, managers, sales staff
**Primary Device**: Desktop (70%), Mobile (30%)
**Goal**: Unified customer view with computed operational stages, stage-first navigation, table/card switching, and a filter drawer for scope/location/recency controls

---

## Feature Overview

**CRM** is the central customer database. It shows all customers (people who created orders) and leads (prospects), their purchase history, and their operational stage (computed from business state). Admins can see who's currently handling each customer, filter by operational stage, and manage customer info.

**Key Value**: Know your customers. Prioritize urgent ones. Never lose a sale.

---

## User Personas & Goals

### Persona 1: Solo Seller (Primary)
- Wants quick glance: "Who's HOT right now?"
- Manage 20-50 customers
- Mobile-first when checking on-the-go
- **Goal**: See hot customers, filter by segment, quick chat access

### Persona 2: Shop Manager
- Manage team of 3-5 sales staff
- Assign customers to team members
- Monitor who's handling whom
- **Goal**: Team visibility, workload distribution, customer coverage

### Persona 3: Sales Staff
- See only their assigned customers
- Need to know customer history (past orders, preferences)
- **Goal**: Quick customer lookup, order history, response speed

---

## Business Value

| Metric | Target | Impact |
|--------|--------|--------|
| **Customer retention** | > 70% repeat purchase | Recognize returning customers |
| **At-risk recovery** | > 40% re-engaged | Prevent churn with timely follow-up |
| **VIP service** | 90% same-day response | Premium service = premium LTV |
| **Team efficiency** | Fair customer distribution | All staff equally busy |

---

## Feature Overview: Customer List with View Options

### Default View: TABLE

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 👥 Customers                    [📊 Table] [🃏 Card]  [Segment Filter ▼]  │
├────────────────────────────────────────────────────────────────────────────┤
│ Stage: [ทั้งหมด] [รอชำระ] [รอติดตาม] [รออัปเดต] [กำลังดำเนินการ] [ขาดการติดต่อ]│
│ [🔍 Search]  [⚙️ Filter Drawer ▶]                                         │
├────────────────────────────────────────────────────────────────────────────┤
│ [☐] Name           Channel      LTV      Orders Last Purchase  Response   │
├────────────────────────────────────────────────────────────────────────────┤
│ [☑] Jane Smith  🔴 Hot    ฿2,450     5    8 days ago    Agent A (now)  │
│     [Edit] [Chat] [Orders]                                               │
├────────────────────────────────────────────────────────────────────────────┤
│ [ ] John Doe   🟡 At-risk  ฿5,800    12   45 days ago   ⚠️ Unassigned  │
│     [Edit] [Chat] [Orders]                                               │
├────────────────────────────────────────────────────────────────────────────┤
│ [ ] Mike Lee    🆕 New     ฿1,200     2    2 days ago    AI (responding) │
│     [Edit] [Chat] [Orders]                                               │
└────────────────────────────────────────────────────────────────────────────┘
```

**Table Columns**:
| Column | Shows | Sortable | Click |
|--------|-------|----------|-------|
| Checkbox | Select for bulk action | No | Multi-select |
| Name | Customer name + segment tag | Yes | Open profile |
| Channel | @instagram @facebook @line | No | Channel icon |
| LTV | Total lifetime value (฿X,XXX) | Yes | Breakdown |
| Orders | Total order count | Yes | History |
| Last Purchase | Days ago + date | Yes | Recent activity |
| Response | Who's handling now (or AI) | No | Show agent detail |

---

### Alternative View: CARD

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 👥 Customers                    [📊 Table] [🃏 Card]                      │
├────────────────────────────────────────────────────────────────────────────┤
│ Stage: [ทั้งหมด] [รอชำระ] [รอติดตาม] [รออัปเดต] [กำลังดำเนินการ] [ขาดการติดต่อ]│
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│ │ [JD] Jane Smith  ✅ │  │ [JD] John Doe     ⚠️  │  │ [ML] Mike Lee  ⭐ │
│ │ 🔴 Hot               │  │ 🟡 At-risk           │  │ 🆕 New            │
│ │ @instagram @facebook │  │ @whatsapp            │  │ @line             │
│ │                      │  │                      │  │                   │
│ │ LTV: ฿2,450          │  │ LTV: ฿5,800          │  │ LTV: ฿1,200       │
│ │ Orders: 5            │  │ Orders: 12           │  │ Orders: 2         │
│ │ Last: 8 days         │  │ Last: 45 days        │  │ Last: 2 days      │
│ │                      │  │                      │  │                   │
│ │ 👤 Agent A (now)     │  │ ⚠️ Unassigned       │  │ 🤖 AI (now)       │
│ │ [Chat] [Orders]      │  │ [Chat] [Assign]      │  │ [Chat] [Orders]   │
│ └──────────────────────┘  └──────────────────────┘  └──────────────────┘
│ ...more cards (scroll)...
└────────────────────────────────────────────────────────────────────────────┘
```

**Card shows same info as table row, just visual layout**

---

## Core Features

### 1. Operational Stage Navigation

The CRM uses two sets of computed stages — one for the **Leads** tab and one for the **Customers** tab. Stages are derived client-side from existing data fields (no extra API calls).

---

#### 1a. Lead Stages (ผู้สนใจ tab)

Leads are prospective customers who have not yet placed an order. Their stage is computed from `hasAgentReply`, `followupDate`, `followupDone`, and `lastActivityTimestamp`.

| Stage | Thai | Condition | Color |
|-------|------|-----------|-------|
| Awaiting first contact | รอติดต่อครั้งแรก | `hasAgentReply = false` | Amber |
| Follow-up today | ติดต่อในวันนี้ | `followupDate` = today (and agent has replied) | Primary blue |
| Not yet due | ยังไม่ถึงกำหนด | `followupDate` > today | Lavender |
| Not followed up | ยังไม่ได้ติดตามต่อ | Agent replied, no follow-up scheduled, < 30 days inactive | Neutral grey |
| Inactive / unqualified | ไม่ตรงเงื่อนไข | Last activity ≥ 30 days ago | Rose/red |

**Priority order** (evaluation is top-to-bottom, first match wins):
1. `hasAgentReply = false` → รอติดต่อครั้งแรก
2. `followupDate` = today → ติดต่อในวันนี้
3. `followupDate` > today → ยังไม่ถึงกำหนด
4. `lastActivityTimestamp` ≥ 30 days ago → ไม่ตรงเงื่อนไข
5. Fallback → ยังไม่ได้ติดตามต่อ

**KPI cards** above the stage tabs surface counts for:
- รอติดต่อครั้งแรก (total new leads requiring first outreach)
- ติดต่อในวันนี้ (urgent today)
- ไม่ตรงเงื่อนไข (at risk of being lost)

```
Stage tab strip (leads):
  [ทั้งหมด (45)]  [รอติดต่อครั้งแรก (10)]  [ติดต่อในวันนี้ (3)]
  [ยังไม่ถึงกำหนด (8)]  [ยังไม่ได้ติดตามต่อ (12)]  [ไม่ตรงเงื่อนไข (12)]
```

---

#### 1b. Customer Operational Stages (ลูกค้า tab)

Customers are people who have placed at least one order. Their stage is computed from `paymentPending`, `followupDate`, `followupDone`, `lastMessageSender`, and `lastActivityTimestamp`.

| Stage | Thai | Condition | Color |
|-------|------|-----------|-------|
| Awaiting payment | รอชำระ | `paymentPending = true` | Amber |
| Follow-up scheduled | รอติดตาม | `followupDate` > now and not done | Lavender |
| Update needed | รออัปเดต | `followupDate` was due and `followupDone = false` | Info blue |
| In progress | กำลังดำเนินการ | Last message was sent by agent or AI | Primary blue |
| Lost contact | ขาดการติดต่อ | Last activity ≥ 30 days ago | Rose/red |

**Priority order** (evaluation is top-to-bottom, first match wins):
1. `paymentPending = true` → รอชำระ
2. `followupDate` > now → รอติดตาม
3. `followupDate` was past and `followupDone = false` → รออัปเดต
4. `lastMessageSender = 'agent' | 'ai'` → กำลังดำเนินการ
5. `lastActivityTimestamp` ≥ 30 days ago → ขาดการติดต่อ
6. Fallback → กำลังดำเนินการ

```
Stage tab strip (customers):
  [ทั้งหมด (200)]  [รอชำระ (5)]  [รอติดตาม (18)]
  [รออัปเดต (12)]  [กำลังดำเนินการ (148)]  [ขาดการติดต่อ (17)]
```

**Rules (both tabs)**:
- ✅ Stage is computed purely client-side — no backend stage field required
- ✅ Counts update whenever the underlying data changes (TanStack Query cache invalidation)
- ✅ Clicking a stage chip filters the list instantly (no page reload)
- ✅ Default: [ทั้งหมด] selected
- ✅ Search works within the selected stage filter

---

### 2. View Toggle: TABLE vs CARD

**Toggle Button (Top-right)**:
```
[📊 Table] [🃏 Card]
  → Click Table: Show dense table with all columns
  → Click Card: Show 2-3 column grid with compact card design
  → Selection saved to user preferences
```

**When to use Table**:
- Desktop/laptop users
- Need to compare metrics (LTV, orders, response time)
- Sorting/filtering multiple columns
- Bulk actions (select multiple)

**When to use Card**:
- Mobile users
- Quick scanning (visual, colorful)
- Single-column layout (thumb-scrollable)
- See segment tags at a glance

**Rules**:
- ✅ View preference saved per user (localStorage or user settings)
- ✅ Default: Table view
- ✅ Mobile responsive: Auto-switch to Card if screen < 768px
- ✅ Both views show same data, just layout differs

---

### 3. Current Handler: "Who's Responding Right Now?"

**Critical Information**: Every customer shows current handler

```
Response Column (in Table):
  Jane Smith
    👤 Agent A (now)      ← Current handler
    Status: Chatting in Inbox right now

  John Doe
    ⚠️ Unassigned        ← No one handling
    Status: Needs assignment

  Mike Lee
    🤖 AI (responding)    ← AI is answering
    Status: AI confidence: High

  Sarah Brown
    ⏳ Agent B (offline)  ← Assigned but offline
    Status: Will handle when online
```

**Card View**:
```
┌──────────────────────────┐
│ [JD] Jane Smith      ✅  │
│ 🔴 Hot                   │
│ LTV: ฿2,450              │
│ Orders: 5                │
│                          │
│ 👤 Agent A (now)         │
│ [Chat] [Orders]          │
└──────────────────────────┘
```

**Rules**:
- ✅ Show current handler always
- ✅ If AI responding: Show "🤖 AI (responding)"
- ✅ If agent offline: Show "⏳ Agent X (offline)"
- ✅ If unassigned: Show "⚠️ Unassigned"
- ✅ Click on handler name → See agent details / reassign
- ✅ Update in real-time (if agent takes over, show immediately)

---

### 4. Customer Status & Operational Stage Badge

**Operational stage badge** shown on every row/card — computed from the rules in Section 1b:

| Stage | Badge color | Dot color |
|-------|-------------|-----------|
| รอชำระ | Amber bg | Amber dot |
| รอติดตาม | Lavender bg | Lavender dot |
| รออัปเดต | Info blue bg | Info dot |
| กำลังดำเนินการ | Primary-alpha bg | Primary dot |
| ขาดการติดต่อ | Rose bg | Rose dot |

**Rules**:
- ✅ Exactly 1 stage badge shown per row/card (computed, not editable)
- ✅ Stage badge updates automatically when data changes (follow-up marked done, payment cleared, etc.)
- ✅ AI-assigned tags (if any) still show small ⭐ icon alongside the stage badge
- ✅ Hover stage badge → tooltip shows why this stage was assigned (stage computation rule)

**Legacy segment tags** (Hot, VIP, At-risk, Cold) are still accessible in the customer profile detail view for backward compatibility with existing tag data, but are no longer the primary navigation axis on the list view.

---

### 4a. Organization B2B Avatar Stack (GAP 16 — Locked)

**When a customer is of type "Organization" (B2B), the card and profile show a stacked avatar group representing the associated contacts.**

```
Card View (B2B):
┌──────────────────────────┐
│ [🏢] ABC Corp        ✅  │
│ 🏢 Org                   │
│ Contacts:                │
│  [A] [B] [C] +5 more     │  ← Max 3 avatars shown, then "+N more" badge
│ LTV: ฿15,000             │
│ Orders: 20               │
│ [Chat] [Orders]          │
└──────────────────────────┘
```

**Rules**:
- ✅ Show first 3 contact avatars only (regardless of total count)
- ✅ If total contacts > 3: show "+N more" badge where N = (total - 3)
- ✅ Example: 8 contacts → show 3 avatars + "+5 more" badge
- ✅ Example: 2 contacts → show 2 avatars only (no badge)
- ✅ Example: 3 contacts → show 3 avatars only (no badge)
- ✅ Clicking "+N more" badge → opens full contact list in profile
- ✅ Avatar shows initials if no photo
- ✅ Tooltip on hover → show contact name

---

### 5. Customer Actions

**From Table/Card, user can:**

| Action | Accessible | What Happens |
|--------|-----------|---|
| **[Chat]** | All roles | Open Inbox thread with this customer |
| **[Orders]** | All roles | Show order history for this customer |
| **[Edit]** | Manager+ | Open customer profile for editing |
| **[Assign]** | Manager+ | Reassign to different agent |
| **[Bulk Follow-up]** | Manager+ | Select multiple, send follow-up to all |
| **[Delete Note]** | All roles | Delete pinned note (if exists) |
| **[Merge]** | Super Admin | Merge duplicate customers (see deduplication rules below) |

**Rules**:
- ✅ Agent/Staff: Can only see/chat with assigned customers
- ✅ Manager: Can see all customers, reassign, bulk action
- ✅ Super Admin: Full access including merge operations

---

### 5a. Customer Deduplication & Merge (GAP 12 + GAP 13 — Locked)

**Deduplication Identifier by Customer Type**:

| Customer Type | Primary Identifier | Used For |
|---|---|---|
| Business | TaxID (เลขประจำตัวผู้เสียภาษี) | Matching business-type contacts |
| Individual | ID Card number (เลขบัตรประชาชน) | Matching individual-type contacts |

**How Duplicates Are Detected**:
```
Step 1: Match by customer type (business vs individual)
Step 2: Match on primary identifier (TaxID or ID Card)
Step 3: Phone number match (secondary signal)
  → Normalize to 10-digit format
  → Extract prefix (first 3 digits: 081, 091, 062, etc.)
  → All Thai prefixes weighted equally (no prefix prioritization)
  → Match on prefix + last 7 digits
Step 4: If match found → surface as duplicate candidate
```

**Phone Normalization Rules**:
- ✅ Strip all spaces, dashes, and country codes (+66)
- ✅ Convert +66 format to 0XX format (e.g., +66812345678 → 0812345678)
- ✅ All 10-digit Thai prefixes treated with equal weight
- ✅ Match requires both prefix match AND last-7-digit match

**Merge Workflow** (Super Admin only):
```
1. System flags two customer records as potential duplicate
2. Banner appears: "Possible duplicate found: [Customer A] and [Customer B]"
3. Admin opens side-by-side comparison drawer
4. Admin reviews identifier mismatch (TaxID or ID Card)
5. Warning shown: "Merging is permanent and cannot be undone. All order history will be combined."
6. Admin confirms merge
7. Result: Newer contact retains all orders from both records. Older contact archived (not deleted).
```

**Rules**:
- ✅ Merge is irreversible — confirmed by explicit admin action
- ✅ Both records' order history preserved and merged under surviving contact
- ✅ Archived contact remains in audit trail (not deleted)
- ✅ Merge action only available to Super Admin role

---

### 6. Sorting

**Sort options are controlled via the Filter Drawer** (see Section 8). The drawer exposes:
```
เรียงตามข้อมูล:
  [สร้างล่าสุด]  [ติดต่อล่าสุด] (default)  [สั่งซื้อล่าสุด]
```

The selected sort is applied when "กรองผลลัพธ์" is tapped.

**Rules**:
- ✅ Reorder applied immediately on drawer confirm (no page reload)
- ✅ Default sort: ติดต่อล่าสุด (most recent activity)
- ✅ In Table: Click column header to sort (LTV, Orders, Date, etc.) — overrides drawer sort
- ✅ Sort selection remembered as part of drawer filters state

---

### 7. Search

**Search Bar** (Always visible):
```
[🔍 Search by name, phone, email, @username]
  → Type "Jane" → Filter to Jane + John + Jane2, etc.
  → Type "0812345" → Find by phone
  → Real-time (no Enter key needed)
  → Highlights matching text
  → No results → Show: "[+ Add new customer 'Jane']"
```

**Rules**:
- ✅ Search within current segment filter
- ✅ Debounce 300ms (responsive, not laggy)
- ✅ Escape or X clears search
- ✅ Matching text highlighted

---

### 8. Filter Drawer (ตัวกรอง)

**Trigger**: Funnel icon button (⚙️) next to the search bar. Pressing it slides in a right-side drawer panel. The button shows an active state (primary-colored) and a badge count when any non-default filter is active.

**Drawer Layout**:
```
┌─────────────────────────────────────────────┐
│ ตัวกรอง  [2]                             [✕]│
├─────────────────────────────────────────────┤
│ ขอบเขต                                      │
│  [ ฉัน ] [ ทีม ] [ ภายในบริษัท ]           │
├─────────────────────────────────────────────┤
│ ตำแหน่งที่ตั้งลูกค้า        ภายใน 3 km      │
│  ─●──────────────────────                  │
│  0 km  2.5  5  7.5  10 km                  │
├─────────────────────────────────────────────┤
│ การติดตามลูกค้า                             │
│  [ทั้งหมด] [> 3 วัน] [> 7 วัน] [> 14 วัน] │
│  [> 30 วัน] [> 90 วัน] [ไม่มีการติดตาม]   │
├─────────────────────────────────────────────┤
│ เรียงตามข้อมูล                              │
│  [สร้างล่าสุด] [ติดต่อล่าสุด] [สั่งซื้อล่าสุด]│
└─────────────────────────────────────────────┤
│  [รีเซ็ตทั้งหมด]    [กรองผลลัพธ์  2 รายการ]│
└─────────────────────────────────────────────┘
```

**Filter Dimensions**:

| Dimension | Options | Default | Behavior |
|-----------|---------|---------|----------|
| **ขอบเขต** (scope) | ฉัน / ทีม / ภายในบริษัท | ฉัน | Shows customers for self / team / whole company |
| **ตำแหน่ง** (distance) | Slider 0–10 km (step 0.5) | 0 (no filter) | Filter customers within N km of user's GPS location |
| **การติดตาม** (follow-up recency) | ทั้งหมด / > 3 วัน / > 7 วัน / > 14 วัน / > 30 วัน / > 90 วัน / ไม่มีการติดตาม | ทั้งหมด | Filter by days since last follow-up |
| **เรียงตาม** (sort) | สร้างล่าสุด / ติดต่อล่าสุด / สั่งซื้อล่าสุด | ติดต่อล่าสุด | Ordering of results |

**Active Filter Count Badge**:
- Counts how many dimensions have non-default values
- Shown on both the drawer header (e.g., "ตัวกรอง [2]") and the trigger button
- รีเซ็ตทั้งหมด is disabled (greyed out) when count = 0

**Distance Slider**:
- Range: 0 km (no filter) to 10 km
- While dragging: floating bubble above the thumb shows current value (e.g., "3 km")
- Value 0 = "no distance filter applied" (thumb at leftmost position, inactive state)
- Requires browser Geolocation API permission; if denied, slider is shown but filtering uses a fallback

**Backdrop**: Tapping the dark overlay (outside the drawer) closes the drawer without applying changes.

**Rules**:
- ✅ Drawer state is local (resets to last applied values when re-opened)
- ✅ Changes only take effect when "กรองผลลัพธ์" is tapped
- ✅ "รีเซ็ตทั้งหมด" resets all 4 dimensions to their defaults immediately within the drawer
- ✅ Filter is applied client-side where possible (scope/sort); distance filter requires server re-query with lat/lon params

---

## Custom Fields (GAP 14 + GAP 15 — Locked)

Custom fields allow workspace admins to extend customer profiles with business-specific data (e.g., "VIP Tier", "Preferred Delivery Day", "Internal Rating").

### Custom Field Scope

- **Workspace-global**: Every custom field created applies to ALL customers in the workspace.
- Supported field types: text, number, date, dropdown, checkbox
- Fields are optional by default unless explicitly marked required

### Custom Fields: Card vs Profile Display (GAP 15)

```
Card View (condensed):
┌──────────────────────────┐
│ [JD] Jane Smith      ✅  │
│ 🔴 Hot                   │
│ LTV: ฿2,450              │
│ Orders: 5                │
│ VIP Tier: Gold      ←── custom field (show_on_card = true)
│ Rating: ★★★★☆       ←── custom field (show_on_card = true)
│ [Chat] [Orders]          │
└──────────────────────────┘

Profile View (full list):
  All custom fields visible regardless of show_on_card flag.
```

**Rules**:
- ✅ Max 2-3 custom fields shown on card (controlled by `show_on_card` flag per field)
- ✅ Admin configures which fields appear on card via Custom Field settings
- ✅ Full list of custom fields always visible in customer profile
- ✅ Card shows label + value only (compact, no edit inline)
- ✅ Profile shows label + value + edit control

### Custom Field Deletion (GAP 14)

When a workspace admin deletes a custom field:

```
Warning dialog shown:
  "Deleting 'VIP Tier' will hide this field from all customer profiles.
   Existing values are retained in the audit trail but will not be visible.
   This action cannot be undone."

  [Cancel]  [Delete Field]
```

**Deletion Behavior**:
- ✅ Custom field values are soft-deleted (NOT permanently removed)
- ✅ Deleted field and its values retain a `deleted_at` timestamp
- ✅ UI does not display deleted custom fields to any user
- ✅ Audit trail preserves all historical values for compliance/reporting
- ✅ Re-creating a field with the same name does NOT restore old values (new field = clean slate)

**Rules Summary**:
- ✅ Deleting a field hides it from all views immediately
- ✅ Data is never permanently erased — only hidden
- ✅ Super Admin and Manager can manage custom fields
- ✅ Deletion requires explicit confirmation with consequence warning

---

## Customer Profile (Detail View)

**When user clicks customer name, open profile**:

```
┌────────────────────────────────────────────────────────────────┐
│ Jane Smith  🔴 Hot  ← [Back]                [Edit] [Assign]  │
├────────────────────────────────────────────────────────────────┤
│ Assigned to: 👤 Agent A                                        │
│ Status: Chatting in Inbox right now                            │
│ Last activity: 2 hours ago (message received)                  │
├────────────────────────────────────────────────────────────────┤
│ 📊 Stats:                                                      │
│   LTV: ฿2,450  |  AOV: ฿490  |  Orders: 5  |  Last purchase: 8 days ago │
├────────────────────────────────────────────────────────────────┤
│ Channels: @instagram @facebook                                 │
├────────────────────────────────────────────────────────────────┤
│ Custom Fields:                                                 │
│   VIP Tier:         Gold                                       │
│   Preferred Day:    Saturday                                   │
│   Internal Rating:  ★★★★☆                                      │
│   [+ all workspace custom fields listed here]                  │
├────────────────────────────────────────────────────────────────┤
│ Tabs:                                                          │
│  [General] [Order History] [Conversations] [Activity Log]      │
└────────────────────────────────────────────────────────────────┘
```

**Key Info at Top**:
- ✅ Current handler (who's responding now)
- ✅ Status (Chatting / Offline / AI handling)
- ✅ Last activity timestamp

**Custom Fields in Profile**:
- ✅ All workspace custom fields displayed (regardless of show_on_card setting)
- ✅ Deleted fields (soft-deleted) are hidden — not shown even in profile
- ✅ Editable inline when user has Manager+ permission
- ✅ For Organization type: show B2B contact list with avatar stack (first 3 + "+N more")

---

## Acceptance Criteria

### View Toggle
- [ ] Table and Card view toggle buttons visible
- [ ] Default view: Table
- [ ] Mobile < 768px auto-switches to Card
- [ ] View preference saved per user
- [ ] Both views show same data

### Lead Stage Navigation
- [ ] 5 lead stage tabs visible with counts
- [ ] KPI bar shows รอติดต่อครั้งแรก / ติดต่อในวันนี้ / ไม่ตรงเงื่อนไข counts
- [ ] Stage computed client-side (no separate API call)
- [ ] Clicking a stage chip filters the table instantly
- [ ] Default: [ทั้งหมด] selected
- [ ] "แปลงเป็นลูกค้า" button converts lead to customer

### Customer Operational Stage Navigation
- [ ] 5 operational stage tabs visible with counts
- [ ] Stage computed client-side from paymentPending / followupDate / lastMessageSender
- [ ] Clicking a stage chip filters the list instantly
- [ ] Default: [ทั้งหมด] selected
- [ ] Stage badge shown on every row and card

### Filter Drawer
- [ ] Funnel button in top bar opens right-side slide-in drawer
- [ ] Backdrop click closes drawer without applying changes
- [ ] Scope switcher: ฉัน / ทีม / ภายในบริษัท (single-select segment control)
- [ ] Distance slider: 0–10 km, floating value bubble visible while dragging
- [ ] Follow-up recency chips: single-select, ทั้งหมด as default
- [ ] Sort chips: single-select, ติดต่อล่าสุด as default
- [ ] Active filter count badge shown on drawer header and trigger button
- [ ] รีเซ็ตทั้งหมด disabled (greyed) when no active filters; resets all on click
- [ ] กรองผลลัพธ์ applies filters and closes drawer
- [ ] Trigger button shows active/highlighted state when any filter is non-default

### Table View
- [ ] 7 columns: Name | Channel | LTV | Orders | Last Purchase | Response | Actions
- [ ] Sortable: Name, LTV, Orders, Last Purchase
- [ ] Checkbox for bulk select
- [ ] Row height optimized for readability
- [ ] Hover row → show quick actions

### Card View
- [ ] 2-3 column grid responsive
- [ ] Shows: Avatar | Name | Tag | LTV | Orders | Last Purchase | Handler
- [ ] Touch-friendly spacing
- [ ] Scrollable vertically
- [ ] Mobile: 1 column, 100% width

### Current Handler Display
- [ ] Show agent name if assigned
- [ ] Show "🤖 AI" if AI responding
- [ ] Show "⏳ Offline" if agent offline
- [ ] Show "⚠️ Unassigned" if not assigned
- [ ] Update in real-time (no refresh needed)
- [ ] Click handler → see options

### Segment Tags
- [ ] Show 1 tag on list (highest priority)
- [ ] Show all tags on profile
- [ ] Auto-calculate based on activity
- [ ] Update immediately
- [ ] Hover tag → tooltip shows reason

### Search & Filter
- [ ] Search by name, phone, email, channel username
- [ ] Real-time results (debounce 300ms)
- [ ] Works within selected segment
- [ ] Clear button (X) visible
- [ ] Matching text highlighted
- [ ] "No results" shows add option

### Sorting
- [ ] 5 sort options available
- [ ] Default: Most recent activity
- [ ] Sort applies immediately
- [ ] Show sort direction (↑/↓)
- [ ] Works in both Table and Card view

### Customer Actions
- [ ] [Chat] → Opens Inbox thread
- [ ] [Orders] → Shows order history
- [ ] [Edit] → Opens profile (Manager+)
- [ ] [Assign] → Reassign (Manager+)
- [ ] [Bulk Follow-up] → Multi-select (Manager+)

### Deduplication & Merge (GAP 12 + GAP 13)
- [ ] TaxID used as primary identifier for Business-type customers
- [ ] ID Card number used as primary identifier for Individual-type customers
- [ ] Phone numbers normalized to 10-digit format (strip +66, spaces, dashes)
- [ ] All Thai prefixes weighted equally in phone matching
- [ ] Duplicate candidate flagged when type + identifier match
- [ ] Merge restricted to Super Admin role only
- [ ] Merge shows irreversible warning before confirmation
- [ ] Archived (not deleted) contact retained in audit trail after merge
- [ ] Merged record retains all order history from both contacts

### Custom Fields (GAP 14 + GAP 15)
- [ ] Custom fields are workspace-global (apply to all customers)
- [ ] Supported types: text, number, date, dropdown, checkbox
- [ ] Max 2-3 custom fields shown on card (controlled by show_on_card flag)
- [ ] Full list of custom fields visible in customer profile
- [ ] Deleted custom field values are soft-deleted (deleted_at timestamp)
- [ ] Soft-deleted fields hidden from all UI views
- [ ] Deletion warning shown before field is removed
- [ ] Audit trail preserves deleted field values

### Organization B2B Avatar Stack (GAP 16)
- [ ] B2B card shows contact avatars stacked
- [ ] Maximum 3 avatars shown on card
- [ ] If total contacts > 3: show "+N more" badge (N = total - 3)
- [ ] Clicking "+N more" opens full contact list in profile
- [ ] Tooltip on avatar hover shows contact name

### Permissions
- [ ] Agent: See only assigned customers
- [ ] Manager: See all, reassign, bulk actions
- [ ] Super Admin: Full access
- [ ] Staff cannot edit or reassign

### Mobile UX
- [ ] Readable without pinch-zoom
- [ ] Buttons 44×44px minimum
- [ ] Card layout scrollable (no overflow)
- [ ] Search/filter accessible
- [ ] Segment buttons scrollable horizontally

---

## Key User Flows

### Happy Path: Manager Checks Hot Customers
```
1. Open CRM
2. Tap [🔴 Hot (12)]
3. See 12 Hot customers
4. Tap Jane Smith
5. See: "👤 Agent A (now) is handling this"
6. Click [Chat] → Open Inbox conversation
7. See message history
8. Reply or assign to different agent
9. Back to customer list
```

### Sales Staff Views Their Customers
```
1. Open CRM
2. Default shows only "My Customers" filter (auto-set for Staff)
3. See cards: [Agent X is handling] (all are themselves)
4. Click customer → See order history
5. Click [Chat] → Go to Inbox
6. Respond to customer
```

### Reassign Customer
```
1. Manager sees unassigned At-risk customer
2. Click [Assign]
3. Popup: [Select agent...]
4. Choose Agent B
5. Save → Customer reassigned
6. John now shows: "👤 Agent B" as handler
```

### Stage-Based Prioritization
```
1. Sales staff arrives at CRM, Customers tab
2. Default: [ทั้งหมด] with operational stage counts visible
3. "I need to check who needs follow-up"
4. Click [รออัปเดต (12)]
5. See only 12 customers whose follow-up deadline has passed
6. Open filter drawer → set Follow-up recency to "> 7 วัน"
7. List narrows to customers who haven't been followed up in 7+ days
8. Tap กรองผลลัพธ์ → list updated
9. Contact highest-priority customers from the top
```

### Lead Stage Workflow
```
1. Sales staff opens Leads tab
2. KPI bar shows: รอติดต่อครั้งแรก (10) | ติดต่อในวันนี้ (3) | ไม่ตรงเงื่อนไข (12)
3. Click [ติดต่อในวันนี้ (3)]
4. See 3 leads with follow-up due today
5. Click first lead → open detail → start chat or call
6. After successful sale → click [แปลงเป็นลูกค้า]
7. Lead promoted to Customers tab
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|---|
| **Customer assigned to offline agent** | Show "⏳ Agent X (offline)" in Response column |
| **AI takes over during chat** | Response column updates to "🤖 AI (responding)" |
| **Agent reassigned while chatting** | Instant update, new agent sees chat |
| **Customer with 0 orders** | Still shows in "New" segment if created < 7 days |
| **Bulk select then assign** | All selected customers reassigned to new agent |
| **Search returns 100+ results** | Paginate or lazy-load (show 50, scroll for more) |
| **Mobile: screen rotates** | Maintain current view (Table/Card) |
| **Handler clicks customer** | Open their chat instantly |
| **Phone stored as +66 format** | Normalize to 0XX format before matching |
| **Two customers same phone, different type** | Only flag as duplicate if type (business/individual) also matches |
| **Admin merges then tries to view old contact** | Old contact archived — accessible in audit trail only, not main list |
| **Custom field deleted mid-session** | Field disappears from UI immediately; existing values retained in audit |
| **B2B org with exactly 3 contacts** | Show 3 avatars, no "+N more" badge needed |
| **B2B org with 1 contact** | Show 1 avatar only, no stack, no badge |
| **Custom field show_on_card = true but card is full** | Show up to 2-3 fields max; admin controls which 2-3 are selected |

---

## Success Metrics

| Metric | Target | Check Period |
|--------|--------|---|
| **Stage adoption** | > 80% filtering by operational stage | Weekly |
| **Handler clarity** | 100% customers show current handler | Ongoing |
| **View preference** | 60% Table / 40% Card split | Monthly |
| **Search usage** | > 50% of admins search weekly | Monthly |
| **Stage accuracy** | > 95% computed stages match expected | Daily |
| **At-risk engagement** | > 40% contacted within 24h | Weekly |

---

## Differences from Inbox

| Feature | Inbox | CRM |
|---------|-------|-----|
| **View** | Chat messages list | Customer list |
| **Shows** | Active conversations | All customers (who placed orders) |
| **Sorting** | By recency | By LTV, orders, activity, name |
| **Filtering** | By assigned/unread | By operational stage (computed) + filter drawer |
| **Action** | Reply to message | View history, reassign, bulk follow-up |
| **Primary task** | "What messages need reply?" | "Who should we prioritize?" |

---

## Questions for Review

Before Feature #4, please confirm:

1. ✅ **Default view: Table?** Or prefer Card?
2. ✅ **Show handler in every row/card?** Or separate detail view?
3. ✅ **Segment counts auto-update?** Or refresh on page load?
4. ✅ **Mobile auto-switch to Card view at 768px?**
5. ✅ **Should At-risk segment show count of days inactive?** (e.g., "At-risk (8 @ 30+ days)")

**Ready for Feature #4: Product Catalog?** 👇

---

## Locked Decisions

> These decisions are final. They were locked in `MASTER_PROTOTYPE_SPECIFICATION.md` (April 8, 2026) and must not be revisited without explicit stakeholder sign-off. Implementation teams must follow these rules exactly.

---

### GAP 12 — Customer Deduplication: Identifier by Type

**Decision**: Use TaxID for business-type customers and ID Card number for individual-type customers as the primary deduplication identifier.

**Logic**:
- Match requires: same customer type AND same primary identifier
- Merge preserves both records' full order history under the surviving (newer) contact
- Archived contact is retained in audit trail — never permanently deleted
- Merge workflow is irreversible; explicit admin confirmation required with clear warning

**Implementation note**: Duplicate detection matches on `(customer_type, identifier)` tuple. Merge workflow archives older contact and reassigns all related orders to surviving contact.

---

### GAP 13 — Duplicate Detection: Phone Number Matching

**Decision**: Normalize all phone numbers to 10-digit Thai format. Match on prefix (first 3 digits) + last 7 digits. All Thai prefixes weighted equally.

**Logic**:
- Strip spaces, dashes, country code (+66 prefix → 0XX)
- No prefix weighting — 081 and 062 are treated identically
- Match requires exact prefix group + exact last 7 digits

**Implementation note**: Phone normalization runs before any comparison. Store normalized form alongside original.

---

### GAP 14 — Custom Fields: Deletion Impact

**Decision**: Deleting a custom field soft-deletes all associated values. Values are retained in the audit trail with a `deleted_at` timestamp. The field and its values are hidden from all UI views immediately.

**Logic**:
- Soft-delete only — no permanent data removal
- UI filters out any field with `deleted_at` set
- Deleted field values accessible via audit trail (for compliance/export)
- Re-creating a field with the same name starts fresh — does NOT restore prior values

**Implementation note**: Custom field value table has `deleted_at` column. All queries to display custom fields must filter `WHERE deleted_at IS NULL`.

---

### GAP 15 — Custom Fields: Card vs Profile Display

**Decision**: Show a maximum of 2-3 custom fields on the customer card. The full list of custom fields is always shown in the customer profile.

**Logic**:
- Each custom field has a `show_on_card` boolean flag (configurable by admin)
- Card renders only fields with `show_on_card = true`, capped at 2-3
- Profile renders all active (non-deleted) custom fields regardless of `show_on_card`
- Workspace admin controls which fields appear on card via Custom Field settings UI

**Implementation note**: `show_on_card` flag lives on the custom field definition record (not per-customer). Query for card: `WHERE show_on_card = TRUE AND deleted_at IS NULL LIMIT 3`.

---

### GAP 16 — Organization B2B Avatar Stack

**Decision**: Display the first 3 contact avatars on B2B organization cards. If total contacts exceed 3, show a "+N more" badge where N = (total contacts - 3).

**Logic**:
- Always render at most 3 avatars
- Badge formula: N = total_contacts - 3 (only shown when total > 3)
- Clicking "+N more" opens full contact list in the organization profile
- Avatar shows initials if no profile photo
- Hover tooltip shows the contact's name

**Implementation note**: UI fetches first 3 contacts from the organization's contact list. Total count from a separate lightweight count query. Badge renders only when count > 3.

---

**Decisions locked by**: MASTER_PROTOTYPE_SPECIFICATION.md
**Date locked**: April 8, 2026
**Locked by**: Product team gap resolution session
