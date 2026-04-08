# 10. Booking & Appointments — User Story

**Status**: Locked decisions incorporated (GAP 20, 26, 27, 28, 29)
**Priority**: 🟡 High (Service scheduling + no-show prevention)
**Target Users**: Customers (booking), Agents (management), Admins (scheduling)
**Primary Device**: Mobile (customer booking), Desktop (admin calendar)
**Time Target**: 3-step booking < 2 min, reminders 24h before

---

## Feature Overview

The **Booking & Appointments** system allows customers to schedule service appointments directly in chat using a 3-step flow. Appointments are tracked in an admin calendar, automatic reminders reduce no-shows, and recurring appointments save time for regular customers.

**Goal**: Customer wants appointment → Book in chat (3 steps) → Confirmed + reminder → Show up → Complete.

---

## User Personas & Goals

### Persona 1: Customer (Booker)
- Wants to schedule a service (haircut, consultation, repair, delivery slot)
- Browsing dates/times in chat is easy
- **Goal**: Pick date → Pick time → Confirm → Done (all in chat, < 2 min)

### Persona 2: Agent (Scheduler)
- Manages bookings for their services
- Needs to see their own booked appointments and assigned team bookings
- Wants to mark no-shows + cancellations
- **Goal**: View personal calendar + assigned team bookings, manage status
- **Calendar visibility (GAP 20)**: Sees own bookings + bookings assigned to their team. Cannot see bookings outside their assignment scope.

### Persona 3: Admin (Calendar Manager)
- Oversees all bookings across all agents/services
- Wants to set availability (hours, days off, vacation)
- Tracks no-show rate and revenue impact
- **Goal**: Dashboard view, resource planning, no-show insights
- **Calendar visibility (GAP 20)**: Configurable — can choose to see all bookings, team-only bookings, or self-only bookings. Default = all bookings.

### Persona 4: Business Owner (Capacity Planner)
- Needs to know: How full are we? Peak hours? Revenue from bookings?
- **Goal**: Capacity insights, peak time analysis, booking revenue

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **Booking conversion** | 70%+ (of customers who start) | Frictionless booking = more confirmed |
| **No-show rate** | <15% (with reminders) | Reminders prevent 40% of no-shows |
| **Booking time** | <2 min per customer | Fast = better user experience |
| **Recurring bookings** | 30%+ of repeat customers | Save time, increase loyalty |
| **Calendar utilization** | 80%+ (slots filled) | Good capacity planning |
| **Booking revenue** | Trackable per agent/service | Know which services drive revenue |

---

## 3-Step In-Chat Booking Flow

### Step 1: Service & Agent Selection

```
Customer in chat:
  "Hi, I want to book a haircut"

System displays:
┌──────────────────────────────────────┐
│ 📅 Book Appointment                  │
│                                      │
│ Select Service:                      │
│                                      │
│ ┌ Haircut (฿300, 45 min)           │
│ │ 💇 Niran (Expert) - 12 reviews    │
│ │ ⭐ 4.8/5 | Next available: Today  │
│ │ OR                                 │
│ │ 💇 Somchai (Senior) - 8 reviews   │
│ │ ⭐ 4.6/5 | Next available: Today  │
│ └ [Select Agent ▼]                 │
│                                      │
│ ┌ Hair Color (฿600, 90 min)        │
│ │ 💅 Noi (Specialist) - 15 reviews │
│ │ ⭐ 4.9/5 | Next available: 2 days│
│ └ [Select]                         │
│                                      │
│ ┌ Treatment (฿450, 60 min)         │
│ │ 💆 Ploy (Certified) - 20 reviews │
│ │ ⭐ 4.7/5 | Next available: Today │
│ └ [Select]                         │
│                                      │
│ ┌ Consultation (Free, 30 min)      │
│ │ 📞 Niran or Somchai available   │
│ │ ⭐ All staff | Next available: Now│
│ └ [Select]                         │
│                                      │
│ [Back]                             │
└──────────────────────────────────────┘

Customer taps: "Haircut - Select Agent ▼"
  Options:
  ☐ Niran (12 reviews, 4.8★, Today)
  ☐ Somchai (8 reviews, 4.6★, Today)
  ☐ Any agent available

Customer selects: "Niran"
System shows: Date/Time selection
```

### Step 2: Date & Time Selection

```
System displays:
┌──────────────────────────────────────┐
│ 📅 Select Date & Time                │
│                                      │
│ Service: Haircut (45 min)            │
│ Agent: Niran ⭐ 4.8/5               │
│                                      │
│ Week of April 7                      │
│                                      │
│ Mon 7   [12 slots] ✅               │
│ Tue 8   [10 slots] ✅               │
│ Wed 9   [FULLY BOOKED] ❌           │
│ Thu 10  [8 slots] ✅                │
│ Fri 11  [14 slots] ✅               │
│ Sat 12  [16 slots] ✅               │
│ Sun 13  [Closed] ⛔                 │
│                                      │
│ [◀ Previous Week] [Next Week ▶]     │
│                                      │
│ Selected: Mon 7                      │
│ Available times:                     │
│ ┌─────────────────────────────────┐ │
│ │ 09:00 ✅  │ 09:30 ✅ │ 10:00 ✅ │ │
│ │ 10:30 ✅  │ 11:00 ✅ │ 11:30 ✅ │ │
│ │ 13:00 ✅  │ 13:30 ✅ │ 14:00 ✅ │ │
│ │ 14:30 ✅  │ 15:00 ⏳ │ 15:30 ⏳ │ │
│ └─────────────────────────────────┘ │
│ ✅ = Available | ⏳ = Limited spots  │
│                                      │
│ [◀ Back] [Next ▶]                   │
└──────────────────────────────────────┘

Customer taps: "10:00 ✅"
System shows: Confirmation
```

### Step 3: Confirmation & Payment (Optional)

```
System displays:
┌──────────────────────────────────────┐
│ ✅ Confirm Booking                   │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Service: Haircut               │  │
│ │ Agent: Niran ⭐ 4.8/5          │  │
│ │ 📅 Monday, April 7, 2026       │  │
│ │ 🕙 10:00 AM - 10:45 AM         │  │
│ │    (Bangkok Time, GMT+7)        │  │
│ │ ⏱️ 45 minutes                   │  │
│ │ 💰 ฿300                        │  │
│ │ 📍 Bangkok Hair Shop           │  │
│ │    33 Rama 4 Rd, Bangkok       │  │
│ └────────────────────────────────┘  │
│                                      │
│ Payment Mode:                        │
│ ○ Pay now (฿300)                   │
│ ○ Pay at shop                       │
│ ● Deposit only (฿100)               │
│                                      │
│ Add to calendar:                     │
│ ☑ Google Calendar                   │
│ ☑ Apple Calendar                    │
│ ☑ WhatsApp reminder                 │
│                                      │
│ [◀ Back] [Confirm Booking]          │
└──────────────────────────────────────┘

Customer taps: [Confirm Booking]
System sends: Confirmation message + iCal attachment + agent contact
```

---

## Customer Booking UI (Mobile First)

### Header & Entry Point

```
Chat Screen (Before Booking):
┌────────────────────────────────┐
│ Niran                      14:30│
├────────────────────────────────┤
│                                │
│ Hi! Need a haircut?            │
│ We have availability this week │
│                                │
│ [📅 Book Appointment] ← Button │
│ [View Prices]                  │
│ [See Our Team]                 │
│                                │
└────────────────────────────────┘
```

### Full Booking Flow UI (4 Screens)

```
SCREEN 1: Service Selection (Mobile)
┌────────────────────────────────┐
│ ◀ Back         Book with Us   ✕│
├────────────────────────────────┤
│ 📅 What would you like?        │
│                                │
│ ┌────────────────────────────┐ │
│ │ 💇 HAIRCUT ฿300 • 45 min  │ │
│ │ Agent: ◉ Niran ⭐4.8     │ │
│ │        ○ Somchai ⭐4.6    │ │
│ │        ○ Any available    │ │
│ │ [Next]                     │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 💅 HAIR COLOR ฿600 • 90min│ │
│ │ Agent: ◉ Noi ⭐4.9       │ │
│ │ [Select]                   │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 💆 TREATMENT ฿450 • 60min │ │
│ │ Agent: ◉ Ploy ⭐4.7      │ │
│ │ [Select]                   │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘

SCREEN 2: Date & Time Selection
┌────────────────────────────────┐
│ ◀ Back      Select Time      ✕ │
│                                │
│ Haircut • Niran • ฿300         │
│                                │
│ Week: Mon 7  Tue 8  Wed 9     │
│       Thu 10 Fri 11 Sat 12    │
│                                │
│ Monday, April 7 - 12 slots    │
│                                │
│ ✅ 09:00    ✅ 10:00           │
│ ✅ 09:30    ✅ 10:30           │
│ ✅ 11:00    ✅ 11:30           │
│ ✅ 13:00    ✅ 13:30           │
│ ✅ 14:00    ⏳ 14:30           │
│                                │
│ [◀ Back] [Next ▶]              │
└────────────────────────────────┘

SCREEN 3: Confirm Booking
┌────────────────────────────────┐
│ ◀ Back     Confirm Booking   ✕ │
│                                │
│ Haircut with Niran            │
│ ⭐ 4.8/5 (12 reviews)          │
│                                │
│ 📅 Monday, April 7, 2026       │
│ 🕙 10:00 AM - 10:45 AM         │
│    (Bangkok Time, GMT+7)        │
│ 💰 ฿300                        │
│                                │
│ Payment:                       │
│ ○ Pay Now (฿300)              │
│ ○ Pay at Shop                  │
│ ◉ Deposit (฿100)              │
│                                │
│ Calendar:                      │
│ ☑ Google Calendar              │
│ ☑ Apple Calendar               │
│ ☑ WhatsApp reminder            │
│                                │
│ [◀ Back] [Book Now]            │
└────────────────────────────────┘

SCREEN 4: Success Confirmation
┌────────────────────────────────┐
│                             ✕ │
│         ✅ BOOKED!             │
│                                │
│ Haircut with Niran            │
│ Monday, April 7 at 10:00 AM   │
│ (Bangkok Time, GMT+7)         │
│                                │
│ Confirmation:                  │
│ 📱 Chat message                │
│ 📧 Email sent                  │
│ 📍 Google Calendar added       │
│                                │
│ 📞 Niran: 081-234-5678         │
│ 📍 Bangkok Hair Shop           │
│ [Get Directions]               │
│                                │
│ [Add to Calendar] [Share]      │
│ [Book Another]                 │
└────────────────────────────────┘
```

### Agent Info Card (Detail View)

```
Click Agent Name → See Full Profile:
┌────────────────────────────────┐
│ ◀ Back                       ✕ │
│                                │
│ 💇 NIRAN                       │
│ Expert Hair Stylist            │
│ ⭐ 4.8/5 (12 verified reviews) │
│                                │
│ About:                         │
│ "Specialized in modern cuts    │
│  and color. 8 years exp."      │
│                                │
│ Services:                      │
│ • Haircut - ฿300 (45 min)      │
│ • Hair Color - ฿600 (90 min)   │
│ • Treatment - ฿450 (60 min)    │
│                                │
│ Availability:                  │
│ Mon-Fri: 9am-6pm               │
│ Sat: 10am-5pm                  │
│ Next available: Today 10:00 AM │
│                                │
│ Recent Reviews:                │
│ ⭐⭐⭐⭐⭐ "Best cut ever!"      │
│ - Aom, 2 days ago              │
│                                │
│ [Book with Niran]              │
└────────────────────────────────┘
```

---

## Booking Confirmation & Reminders

### Confirmation Message

```
Immediate (after Step 3):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Booking Confirmed!

Service: Haircut
Date: Monday, April 7
Time: 10:00 AM - 10:45 AM (Bangkok Time, GMT+7)
Price: ฿300 (deposit ฿100 paid)

📍 Bangkok Hair Shop
📱 0812-345-6789
🗺️ [Get Directions]

📎 [Add to Google Calendar]
📎 [Add to Apple Calendar]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reminder 1 (24h before):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Reminder: Your haircut is tomorrow!

Monday, April 7 at 10:00 AM (Bangkok Time, GMT+7)
Bangkok Hair Shop

[Confirm] [Reschedule] [Cancel]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reminder 2 (1h before - optional):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Your haircut is in 1 hour!

Leaving soon? Tap [On My Way]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### No-Show Handling

```
Scenario 1: Customer doesn't show up
  - Time: 10:00 AM (appointment time)
  - Wait: 15 minutes
  - 10:15 AM: Mark as NO-SHOW (admin/agent action)
  - Chat message: "We missed you! Please reschedule."
  - Blacklist trigger: Track no-shows (3+ = warn customer)

Scenario 2: Customer arrives late
  - 10:15 AM: Customer arrives
  - Agent marks: LATE (+ time buffer)
  - Service starts: 10:15 AM instead of 10:00 AM

Scenario 3: Customer cancels
  - Policy is shop-owner-defined (GAP 29 — configurable, not hardcoded)
  - Default option A: Full refund always (no penalty)
  - Default option B: No refund within 24 hours of appointment
  - Default option C: Custom rule set by shop owner (e.g., 50% fee within 24h, full refund before 24h)
  - The active cancellation policy text is shown to customer before they confirm cancellation
  - Chat message: "Your haircut on Mon 7 has been cancelled."

Scenario 4: Shop cancels
  - Reason: "Staff emergency" / "Shop closure"
  - Automatic reschedule offer: Show alternative times
  - Refund: Full refund to customer
```

---

## Recurring Appointments

### Setup (Customer)

```
Customer booking:
  Service: Weekly haircut

System asks:
  ☐ One-time booking
  ☑ Recurring appointment

Frequency options:
  ☐ Weekly (every Monday at 10:00 AM)
  ☐ Bi-weekly
  ☐ Monthly
  ☐ Custom

End Condition (GAP 27 — choose exactly one):
  ◉ End by date:  [April 7, 2027]
  ○ End after:    [10] occurrences
  ○ Ongoing (until cancelled)

  Note: End date and occurrence count are mutually exclusive (XOR).
  The system will enforce exactly one end condition per series.

Confirmation:
  "Your haircut is scheduled every Monday at 10:00 AM
   Starting April 7, 2026
   Ending after 10 occurrences (last: June 16, 2026)"

  — OR —

  "Your haircut is scheduled every Monday at 10:00 AM
   Starting April 7, 2026
   Ending by April 7, 2027"
```

### Auto-Booking (System)

```
System automation:
  - Every recurring appointment date: Auto-create next booking
  - Confirmation sent 7 days before first instance
  - Reminders: 24h before each occurrence
  - Track attendance: Which recurring bookings are kept vs no-shows
  - Easy cancel: One-click cancel entire series (not just next one)

Example:
  Mon 7: Weekly haircut → Confirmed + reminder
  Mon 14: Auto-created (reminder sent 24h before)
  Mon 21: Auto-created (reminder sent 24h before)
  ... continues until cancelled
```

---

## Admin Calendar View

### Calendar Visibility Rules (GAP 20 — Locked)

Role-based calendar visibility is enforced at the data layer, not just the UI.

```
ROLE: Admin / Manager
  Default visibility: All bookings (across all agents and teams)
  Configurable: Yes — Admin can switch between:
    ◉ All bookings (shop-wide)
    ○ Team-only bookings (only agents in Admin's team)
    ○ Self-only bookings (own appointments only)
  Setting lives in: Settings → Calendar → Visibility Preference

ROLE: Agent / Staff
  Default visibility: Own bookings + assigned team bookings
  Configurable: No — fixed by system
  Cannot see: Bookings outside their assignment scope
  Enforcement: Server-side filter on all calendar queries
```

### Customer Booking Page vs. Internal Calendar (GAP 20)

These are two separate components with different purposes:

```
INTERNAL CALENDAR (Admin/Agent):
  - Full CRUD access (create, edit, cancel, mark no-show)
  - Shows all customer details, payment status
  - Role-based visibility (see rules above)
  - Desktop-first, dense information layout
  - Lives inside the Onebear admin dashboard

CUSTOMER BOOKING PAGE (Public-Facing):
  - Separate URL / separate component
  - Customer-facing UX with clean, simple design
  - Shows only available slots (no sensitive data)
  - Mobile-first design
  - Accessible without login (customer uses their own booking link)
  - No visibility into other customers' bookings
```

### Calendar Dashboard

```
Desktop Calendar View (Admin — All Bookings Visibility):
┌──────────────────────────────────────┐
│ 📅 Appointment Calendar              │
│ [Visibility: All Bookings ▼]         │
│                                       │
│ April 2026                           │
│ Mon  Tue  Wed  Thu  Fri  Sat  Sun   │
│  7    8    9   10   11   12   13    │
│
│ Slot View (Agent: "Niran"):          │
│ 09:00 | [Free]      | [Free]         │
│ 09:30 | [Free]      | [Free]         │
│ 10:00 | ✅ Haircut  | [Free]         │
│       | Cust: Aom   |                │
│ 10:30 | [Free]      | [Free]         │
│ 11:00 | ✅ Color    | [Free]         │
│       | Cust: Noi   |                │
│ 11:30 | [Free]      | [Free]         │
│ 13:00 | ✅ Haircut  | ✅ Haircut    │
│       | Cust: Can   | Cust: Som      │
│ 13:30 | [Free]      | [Free]         │
│ 14:00 | [Free]      | [Free]         │
│ ...                                  │
│                                       │
│ Filters:                             │
│ [All Agents ▼] [All Services ▼]     │
│ [Week View] [Month View] [Agenda]   │
│                                       │
│ Actions on click:                    │
│ [Confirm] [No-Show] [Reschedule]    │
│ [Cancel] [Add Note]                 │
└──────────────────────────────────────┘

Desktop Calendar View (Agent — Own + Assigned Team Only):
┌──────────────────────────────────────┐
│ 📅 My Appointments                   │
│ Showing: My bookings + Team bookings │
│ (read-only indicator for team scope) │
│                                       │
│ [same grid structure as admin]       │
│                                       │
│ Note: Bookings outside assignment    │
│ scope are hidden — not grayed out    │
└──────────────────────────────────────┘

Color coding:
  🟩 Green = Confirmed
  🟨 Yellow = Pending confirmation
  🔴 Red = No-show
  ⚪ Gray = Cancelled
  ⬜ White = Available slot
  🔁 Recurring badge = Recurring series instance
```

### Agent Assignment

```
System supports:
  - Single agent per service (Niran does haircuts)
  - Multiple agents per service (Niran & Somchai both do haircuts)
  - Auto-assign: Assign to least-booked agent
  - Manual assign: Agent chooses preferred customer

Scenario: Haircut service available with 2 agents
  - Show both in calendar
  - Customer can choose agent
  - Or system auto-assigns to less-booked agent
```

---

## Configuration & Settings

### Admin Setup

```
⚙️ Booking Settings

SERVICES:
  [+ Add Service]

  Service 1: Haircut
    Duration: [45] minutes
    Price: [฿300]
    Agent: [Niran ▼]
    Buffer time: [15] min (between bookings)
    Max bookings/day: [8]
    Description: "Professional haircut"

  Service 2: Hair Color
    Duration: [90] minutes
    Price: [฿600]
    Agent: [Somchai ▼]
    Buffer time: [15] min
    Max bookings/day: [4]

AVAILABILITY:
  Agent: [Niran ▼]

  Mon-Fri: [09:00] to [18:00]
  Sat:     [10:00] to [17:00]
  Sun:     [Closed]

  Days off:
    [April 13-15] (vacation)
    [Thai New Year holidays]

REMINDERS:
  First reminder: [24] hours before
  Second reminder: [1] hour before
  Reminder method: [Chat message ▼]

RECURRING (GAP 27 — both end condition types supported):
  Allow recurring bookings: [Toggle] ✅
  End condition options shown to customer:
    ◉ End by date (customer picks date)
    ○ End after N occurrences (customer picks count)
    ○ Ongoing (until manually cancelled)
  Note: End date and occurrence count are mutually exclusive (XOR).
        System enforces one active end condition per series.
  Max recurring duration: [12] months
  Max occurrence count: [52] (weekly for 1 year)

PAYMENTS:
  Require deposit: [Toggle] ✅
  Deposit amount: [30] % of service price
  Allow full prepay: [Toggle] ✅

CANCELLATION POLICY (GAP 29 — Shop owner decides):
  Policy type: [Full refund always ▼]
  Options available:
    ◉ Full refund always (no penalty regardless of timing)
    ○ No refund within 24h of appointment
    ○ Custom rule:
        - Refund if cancelled before: [24] hours
        - Fee if cancelled within window: [50] %
        - Same-day cancellation: [No refund]
  Policy text shown to customer before confirming cancel: [Yes ▼]
  Emergency cancellation override: [Admin approval required ▼]

RECURRING CLEANUP:
  Recurring series auto-cleanup: [After series ends + 90 days]
```

---

## Acceptance Criteria

### Booking Flow (3 Steps)
- [ ] Customer can initiate booking from chat menu ([📅 Book Appointment] button)
- [ ] Step 1: Service selection shows available services (name, price, duration)
- [ ] Step 1: Each service shows assigned agents (with ratings, reviews, availability)
- [ ] Step 1: Customer can select specific agent or choose "Any available"
- [ ] Step 1: Agents sorted by availability (next available time shown)
- [ ] Step 2: Date/time selection shows available slots (with capacity indicators)
- [ ] Step 2: Unavailable days/times clearly marked (Fully Booked, Closed, etc.)
- [ ] Step 2: Shows selected service, agent, price prominently
- [ ] Step 3: Confirmation shows all details (service, agent, date, time, price, location)
- [ ] Step 3: Agent info card shows: photo, rating, reviews, contact, bio
- [ ] Step 3: Customer can select payment mode (pay now, pay later, deposit only)
- [ ] Step 3: Option to add to Google/Apple Calendar (iCal export)
- [ ] Step 3: Option to set as recurring (weekly, bi-weekly, monthly)
- [ ] Booking can be cancelled mid-flow ([Cancel] button)
- [ ] Completion message sent with confirmation details + calendar link + agent contact
- [ ] Entire flow < 2 minutes (smooth + fast)
- [ ] Mobile UI: Touch targets 44x44px, clear navigation, scrollable lists

### Reminders & Notifications
- [ ] First reminder: 24 hours before appointment
- [ ] Second reminder: 1 hour before appointment (optional)
- [ ] Reminder includes: Service, date, time, location, phone, directions link
- [ ] Customer can [Confirm] / [Reschedule] / [Cancel] from reminder message
- [ ] Admin notified of cancellations (to free up slot for others)
- [ ] SMS/WhatsApp reminders configurable per shop (not just chat)

### No-Show Handling
- [ ] Admin/Agent can mark appointment as NO-SHOW (after 15 min wait)
- [ ] No-show tracked in customer profile (for pattern detection)
- [ ] Customer receives message: "We missed you. Please reschedule."
- [ ] 3+ no-shows: Customer flagged / blacklisted (optional)
- [ ] Late arrivals: Can still be checked in (time logged)
- [ ] Cancellations: Refund calculated (full minus fee if <24h)

### Recurring Appointments
- [ ] Customer can set recurring frequency (weekly, bi-weekly, monthly)
- [ ] Customer can set end date OR number of occurrences (not both — GAP 27 XOR rule)
- [ ] End condition selector shows: "End by date" / "End after N occurrences" / "Ongoing" — only one can be active
- [ ] Each recurring instance gets own iCal event
- [ ] Reminders sent for each instance
- [ ] Easy cancel entire series (not just next one)
- [ ] Modify individual instance (reschedule one occurrence)
- [ ] Can convert one-time to recurring (or vice versa)
- [ ] Recurring badge visible in admin calendar (distinguish from one-time bookings)

### Calendar (Admin/Agent View)
- [ ] Admin/Manager calendar: Default shows all bookings; configurable to team-only or self-only (GAP 20)
- [ ] Agent/Staff calendar: Shows only own bookings + assigned team bookings — not configurable (GAP 20)
- [ ] Customer booking page: Separate public-facing component, clean UX, mobile-first (GAP 20)
- [ ] Calendar visibility rules enforced server-side, not just UI-filtered
- [ ] Week view + Month view + Agenda view available
- [ ] Click appointment → See customer details, service, time, payment status
- [ ] Actions available: [Confirm] [No-Show] [Reschedule] [Cancel] [Add Note]
- [ ] Filter by agent, service, date range
- [ ] Color coding: Confirmed (green), Pending (yellow), No-show (red), Cancelled (gray), Recurring (badge)
- [ ] Drag-to-reschedule (optional, drag booking to new time)
- [ ] Show availability: Free slots clearly visible

### Availability Management
- [ ] Admin can set business hours (open/close times per day)
- [ ] Admin can mark days off (vacation, holiday, emergency close)
- [ ] Buffer time between bookings configurable (e.g., 15 min cleanup)
- [ ] Max bookings per day per service configurable
- [ ] Availability applied to all future bookings
- [ ] Existing bookings not affected by future availability changes

### Integration Features
- [ ] iCal file export (works with Google Calendar, Apple Calendar, Outlook)
- [ ] Google Calendar sync (optional two-way sync)
- [ ] WhatsApp/LINE reminders (in addition to chat)
- [ ] Payment integration: Booking invoice, deposit payment link
- [ ] CRM integration: Booking linked to customer record
- [ ] Dashboard/KPI: Booking revenue, no-show rate, capacity utilization

### Data & Reporting
- [ ] Booking revenue tracked separately (per service, per agent)
- [ ] No-show rate calculated (no-shows / total bookings)
- [ ] Capacity utilization: % of slots filled
- [ ] Customer booking history visible (past + future bookings)
- [ ] Audit log: All booking changes (create, reschedule, cancel, no-show)

### Mobile UX
- [ ] Booking flow works on mobile (responsive design)
- [ ] Calendar view mobile-friendly (scrollable, readable)
- [ ] Touch-friendly buttons (min 44x44px)
- [ ] iCal export works on mobile (opens in default calendar app)

---

## Edge Cases

### Double-Booking Prevention (GAP 26 — Locked: First-Come-First-Serve)
```
Rule: First customer to submit the confirmation wins the slot.
      Second customer sees an "unavailable" message immediately.

Implementation details:
  - Slot lock applied at CONFIRM time (not when browsing or selecting)
  - Pessimistic locking on the time_slot table row at confirm step
  - Race condition resolved by database transaction order
  - Second customer flow:
      → "Sorry, this slot was just taken."
      → System immediately shows next 3 available alternatives
      → Customer can pick an alternative without restarting the full flow
  - No "slot reservation" during browsing — slot is never locked mid-flow
  - Browsing customers may see a slot as available, but confirmation
    is the atomic point of truth
```

### Timezone Handling (GAP 28 — Locked: Explicit Display with Timezone Label)
```
Rule: Times are always displayed with an explicit timezone label.
      Example: "6:00 PM Bangkok Time (GMT+7)"

Display rules:
  - Customer-facing UI: Shows the customer's selected timezone with label
    e.g., "10:00 AM Bangkok Time (GMT+7)"
  - If customer is in a different timezone, show both:
    e.g., "10:00 AM Bangkok Time (GMT+7) / 3:00 AM London Time (GMT+0)"
  - Admin/internal calendar: Always shows in shop timezone (Bangkok, GMT+7)
  - Confirmation message: Shows with timezone label (never bare time)
  - Reminder messages: Shows with timezone label
  - iCal export: Stored in shop timezone; device calendar handles local conversion

Data model:
  - booking.customer_timezone (stores customer's timezone at booking time)
  - booking.appointment_time (stored in UTC in database)
  - UI converts UTC → display timezone + label at render time

Thai customer context:
  - Default display timezone: Asia/Bangkok (GMT+7)
  - Most Thai SME customers are in Bangkok timezone
  - Timezone label always shown to prevent ambiguity
```

### Recurring Series Modifications
```
Problem: Customer books monthly haircut, wants to cancel June only

Solution:
  Option 1: Cancel single instance (June unbooked, July+ continue)
  Option 2: Reschedule single instance (June moved to June 15)
  Option 3: Cancel entire series from June onwards
  Option 4: Pause series (resume later)
```

### Payment & Deposit Logic
```
Problem: Deposit = ฿100, customer prepays full ฿300

Solution:
  - Accept full payment (>= deposit requirement)
  - Show confirmation: "You prepaid full amount (฿300)"
  - No outstanding balance after service
  - If customer cancels: Refund calculated from deposit/prepay amounts
```

### Service with No Available Slots
```
Problem: All slots booked, customer wants to book

Solution:
  - Show message: "Fully booked this week"
  - Offer: "Next available: April 14 at 10:00 AM"
  - Or: "Join waitlist" (notify if slot opens)
  - Calendar shows next 2-4 weeks with availability
```

### Deleted Agent
```
Problem: Agent leaves, has recurring bookings scheduled

Solution:
  - Reassign to another agent
  - Notify customers: "Your stylist changed to Somchai"
  - Keep appointment time (only agent changes)
  - Or: Cancel series + offer reschedule
```

---

## Integration Checklist

- [ ] **Order Management**: Booking service can create an order (e.g., deposit payment)
- [ ] **Payment**: Booking deposit payment linked to Payso payment gateway
- [ ] **CRM**: Booking linked to customer record, visible in customer profile
- [ ] **Inbox Chat**: Booking flow starts from chat, confirmation in chat
- [ ] **Follow-up Management**: Auto-follow-up after no-show or cancellation
- [ ] **Dashboard/KPI**: Booking revenue, no-show rate, capacity metrics
- [ ] **Notifications**: Reminders via chat, SMS, WhatsApp, email
- [ ] **Audit Log**: All booking actions logged (create, reschedule, cancel)

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Booking completion rate** | 70%+ | Completed bookings / initiated |
| **Booking time** | <2 min | From start to confirmation |
| **No-show rate** | <15% (with reminders) | No-shows / total bookings |
| **Reminder effectiveness** | 40%+ no-show reduction | No-show rate (with reminder) vs (without) |
| **Recurring adoption** | 30%+ of bookings | Recurring / total bookings |
| **Customer satisfaction** | 4.5+/5 | Survey feedback on booking experience |
| **Capacity utilization** | 80%+ | Booked slots / available slots |
| **Calendar adoption** | 90%+ of customers | Customers who sync to calendar |

---

## Configuration Defaults

| Setting | Default | Why | Range |
|---------|---------|-----|-------|
| **Service duration** | 45 min | Typical service length | 15-180 min |
| **Buffer time** | 15 min | Cleanup/buffer between customers | 0-30 min |
| **First reminder** | 24 hours | Enough notice, not too early | 1-72 hours |
| **Second reminder** | 1 hour | Final nudge before arrival | 15-120 min |
| **Deposit %** | 30% | Reasonable upfront | 10-50% |
| **Cancellation policy** | Full refund always | Shop owner configures (GAP 29) | Full refund / No refund within 24h / Custom rule |
| **Cancellation window** | 24 hours | Applies only when using "Custom rule" policy | 2-48 hours |
| **Cancellation fee** | 50% | Applies only when using "Custom rule" policy | 0-100% |
| **No-show threshold** | 3 | Before flagging customer | 1-5 |
| **Recurring max duration** | 12 months | Prevent indefinite bookings | 3-24 months |

---

## Review Questions

1. **Agent selection required**: Should customer ALWAYS choose agent, or allow "Any available" default?
2. **Agent ratings display**: Should we show ratings + review count in service selection, or full reviews only on agent detail card?
3. **Agent photo**: Should we display agent photo in Step 1, or only in Step 3 confirmation + detail card?
4. **Drag-to-reschedule**: Should admin be able to drag appointments to new times in calendar, or only use [Reschedule] button?
5. **Waitlist feature**: Should we implement a waitlist for fully-booked services?
6. **Cancellation refunds**: Should refund be instant (automatic), or require admin approval?
7. **No-show policy**: At 3 no-shows, should we auto-blacklist or just flag for admin review?
8. **Mobile calendar**: Should mobile also have full calendar view, or just booking history list?

---

---

## Locked Decisions

All decisions below are locked and approved as of April 8, 2026.
Source of truth: `MASTER_PROTOTYPE_SPECIFICATION.md`

---

### GAP 26: Double-Booking Prevention
**Decision**: First-come-first-serve. First customer to submit confirmation wins the slot. Second customer receives an "unavailable" message and is shown the next 3 available alternatives.

**Implementation notes**:
- Slot lock is applied at CONFIRM step, not during browsing
- Pessimistic locking on `time_slot` table row at transaction commit
- No slot reservation during browsing — browsing is non-binding
- Race condition resolved at database level (transaction order = winner)
- Impacted UI: Step 2 time slot selection, Step 3 confirm button, error state when slot taken

---

### GAP 27: Recurring Appointment End Condition
**Decision**: Both date-based AND count-based end conditions are supported. The shop owner (and customer during setup) chooses one — these are mutually exclusive (XOR). A recurring series can end by a specific date, after a set number of occurrences, or be ongoing until manually cancelled.

**Implementation notes**:
- `recurring_booking.end_date` XOR `recurring_booking.max_occurrences` — only one is set per series
- Recurrence engine checks whichever condition is active and stops generating new instances when reached
- If "ongoing" is chosen, neither field is set; series continues until explicit cancellation
- Customer-facing UI enforces the XOR: selecting "end by date" clears "end after N" field, and vice versa
- Confirmation message must state the active end condition clearly

**End condition options**:

| Option | Field Set | Behavior |
|--------|-----------|----------|
| End by date | `end_date = YYYY-MM-DD` | No new instances created after this date |
| End after N occurrences | `max_occurrences = N` | Engine stops after Nth instance is created |
| Ongoing | Neither field set | Series continues until customer or admin cancels |

---

### GAP 28: Timezone for Bookings
**Decision**: Explicit display. Times are always shown with a timezone label. Example: "10:00 AM Bangkok Time (GMT+7)". The system stores appointment times in UTC internally and converts to display timezone at render time. Customer's timezone is stored at booking time.

**Implementation notes**:
- `booking.customer_timezone` — stores the timezone the customer used when booking
- `booking.appointment_time` — stored in UTC in the database
- All customer-facing messages, reminders, and confirmation screens show: `{time} {timezone name} ({UTC offset})`
- Admin/internal calendar displays in shop timezone (Asia/Bangkok, GMT+7) by default
- iCal file uses shop timezone; the device calendar app handles local conversion for the customer
- If customer timezone differs from shop timezone, show both times in confirmation

**Display format rule**:
```
Correct:   10:00 AM Bangkok Time (GMT+7)
Incorrect: 10:00 AM  (bare time, no timezone label — never allowed)
```

---

### GAP 29: Cancellation Policy
**Decision**: Shop owner decides. Cancellation policy is configurable per workspace — it is not hardcoded in the system. Three policy modes are available.

**Policy options**:

| Policy Mode | Behavior | Refund on Cancellation |
|-------------|----------|------------------------|
| Full refund always | Customer can cancel anytime | 100% refund, no questions |
| No refund within 24h | Refund only if >24h before appointment | 0% if <24h, 100% if >24h |
| Custom rule | Admin sets window + fee percentage | Configurable (e.g., 50% fee within 24h, 0% same-day) |

**Implementation notes**:
- `workspace_settings.cancellation_policy` enum: `full_refund` | `no_refund_within_24h` | `custom`
- `workspace_settings.cancellation_window_hours` — applies when policy = `custom`
- `workspace_settings.cancellation_fee_percent` — applies when policy = `custom`
- Active policy text is shown to the customer before they confirm cancellation (not hidden)
- Emergency cancellation overrides require admin approval
- Default at workspace creation: `full_refund` (most permissive, shop can tighten later)

---

### GAP 20 (Expanded): Booking Calendar Visibility + Customer Booking Page Scope
**Decision**: Calendar visibility is role-based and enforced at the server level. The customer booking page is a separate public-facing component from the internal admin calendar.

**Role visibility rules**:

| Role | Default Calendar Visibility | Configurable? |
|------|-----------------------------|---------------|
| Admin | All bookings (shop-wide) | Yes — can switch to team-only or self-only |
| Manager | All bookings (shop-wide) | Yes — can switch to team-only or self-only |
| Agent | Own bookings + assigned team bookings | No — fixed |
| Staff | Own bookings + assigned team bookings | No — fixed |

**Two separate components**:

| Component | Audience | Access | Design Priority |
|-----------|----------|--------|-----------------|
| Internal Calendar | Admin, Manager, Agent, Staff | Login required | Desktop-first, dense, full CRUD |
| Customer Booking Page | Customers | Public (via booking link) | Mobile-first, clean UX, read/book only |

**Implementation notes**:
- Calendar visibility filter applied server-side on all booking query endpoints
- Agent/Staff: `WHERE agent_id = :current_user OR team_id IN (:assigned_teams)`
- Admin/Manager configurable visibility stored in `user_calendar_settings.visibility_mode`
- Customer booking page is a separate frontend route (e.g., `/book/:shop_id`) with no auth requirement
- Customer page never exposes other customers' booking data
- Recurring badge displayed in internal calendar to distinguish series instances from one-time bookings

---

## Ready for Feature #11: AI Data Analyst?

✅ Booking & Appointments complete. All 4 gap decisions (GAP 26–29) + GAP 20 expanded scope incorporated.

**Should I proceed to Feature #11: AI Data Analyst** (daily insights, suggested actions, weekly/monthly reports, PDF export)?

