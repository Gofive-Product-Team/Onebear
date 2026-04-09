# 🎯 Customer Feature — Improved UX/UI for High Volume

> **Version 2.0 — Redesigned for readability and social commerce workflows**
>
> **Key Changes:** Progressive disclosure pattern, segment-first navigation, mobile-optimized card density, adaptive layouts for desktop/tablet/mobile

---

# 🟥 Pain Points (Updated)

The existing customer card design fails at scale (50+ customers visible simultaneously):

### Problems Identified

1. **Information Overload on Card** — Avatar + name + channels + tags + message + 4 stats + 3 buttons = 10+ visual elements competing for attention
   - Users must read every card top-to-bottom instead of scanning
   - No clear visual hierarchy on where to focus
   - Mobile cards become 400px+ tall, forcing excessive scrolling

2. **Stats Take Too Much Space** — LTV, AOV, Order Count, Last Purchase Date are all shown, but users primarily need **(1) LTV and (2) Purchase Recency**
   - Other stats can be revealed on tap

3. **Action Buttons Create Decision Fatigue** — "Chat," "Orders," "Follow-up" on every card
   - Conditional color changes (red for At-risk, green for Hot) are good but add visual complexity
   - On mobile, 3 buttons = limited tap accuracy
   - Most users tap the card first; actions are secondary

4. **Mobile Workflows Ignored** — Card grid 1 column at mobile = cards taller than the viewport
   - Users work on smartphones but can't see full card without scrolling
   - Swipe actions are underdiscoverable

5. **Visual Scanning Broken** — No affordance to scan 50 customers in <10 seconds
   - Segments (Hot/At-risk/New) are tags, not filter-first entry points
   - Users must read individual tags to understand priority

6. **Tablet Layout Awkward** — 2 columns on tablet = wasted space; 3 columns = too cramped
   - No mention of responsive typography scaling

---

# 🟩 Improved Business Requirements

## 1. Feature: Customer Discovery Interface (New Pattern)

### 1.1 Segment-First Navigation (Replace Filter Chips)

**Replace the current filter chip row with a segmented navigation approach:**

```
┌────────────────────────────────────────┐
│ [🔴 Hot (12)]  [🟡 At-risk (5)]  [🆕 New (8)]  [⭐ VIP (3)]  [🔵 All (127)]  [⚙️ More] │
└────────────────────────────────────────┘
```

- **Redesign:** Large, tappable segment buttons instead of small chips
- **Mobile:** Horizontal scroll, no wrapping; each segment button = 60px minimum tap target
- **Desktop:** All major segments visible; overflow into "+ More" dropdown
- **Counts:** Always displayed; update in real-time as activity occurs
- **Visual feedback:** Bold text + color bar underneath the active segment
- **Keyboard nav:** Arrow left/right to switch segments (accessibility)
- **Default:** Show "All" segment on first load (no auto-filter)

**Segments in Priority Order:**
1. **🔴 Hot** — Activity within 48 hours OR Payment Link opened
2. **🟡 At-risk** — VIP/Loyal customers with 30+ days no activity
3. **🆕 New** — Created within 7 days
4. **⭐ VIP** — LTV ≥ configured threshold
5. **🟢 Loyal** — 3+ repeat purchases
6. **🔵 Cold** — 60+ days no activity
7. **🏢 Organization** — B2B customer type
8. **🔵 All** — Default (no filter applied)

**Business Benefit:** Users don't scan 127 customers; they tap "Hot" and see 12. This is a 90% reduction in cognitive load.

---

### 1.2 Search Remains Top-Priority

- Search bar lives above the segment buttons (unchanged)
- Keyboard shortcut: `/` or `Cmd+K` to focus search (add to accessibility)
- Search results still show matching text highlighted
- Search results also respect the current segment filter if applied
  - Example: Search for "John" while in "Hot" segment → shows only Hot customers named John

---

## 2. Feature: Adaptive Customer Card Design

### 2.1 Mobile Card (Primary UX — Single Column, Full-Width)

**Problem Solved:** Cards are now SHORT (140px) instead of TALL (400px+)

```
┌─────────────────────────────────────────────────┐
│ [Avatar] John Doe                    [🔴 Hot]  │
│          @instagram | @facebook                 │
│                                                 │
│ LTV: ฿2,450 | Last: 8 days ago                 │
│                                                 │
│ 💬 Chat     📦 Orders     🔔 Follow-up        │
└─────────────────────────────────────────────────┘
```

**Design Rules:**

- **Height:** 140px fixed (compact)
- **Avatar:** 48px circular (2-character initials, deterministic color)
- **Name + Channels:** Single line, truncated with ellipsis if > 3 channels shown
  - Show max 3 channel icons; "+2 more" if additional
- **Segment Tag:** Single tag only (not 2)
  - Ordered by priority: Hot > At-risk > VIP > Loyal > Cold > New
  - AI-assigned tags show small star icon (not visible on mobile; revealed on profile)
- **Stats Row:** Only 2 stats shown
  - **LTV: ฿X,XXX** (primary — shows customer value at a glance)
  - **Last: N days ago** (secondary — recency, key for At-risk detection)
- **Quick Actions:** 3 buttons, spaced evenly
  - Tap target: 44×44px minimum (not 44×28px)
  - Labels always visible (not icon-only)
  - Colors conditional:
    - At-risk: red "Follow-up" button → users see urgency
    - Hot: green "Chat Now" button → encourages immediate action
    - Default: neutral "Chat" / "Orders" / "Follow-up"
- **Last Message Preview:** Removed from card
  - If needed, swipe left on card reveals: "Last message: [preview]" in a secondary panel
- **At-risk Banner:** Moved to a context pill next to the segment tag
  - Instead of a full orange banner, show a small icon + tooltip: "⚠️ No purchase for X days"
  - On hover/long-press reveals tooltip

**Mobile Interactions:**
- **Tap card** → opens full Profile page (unchanged)
- **Long-press card** → reveals Quick Edit popover: edit name, add note, change tag
- **Swipe left** → reveals "Last message," timestamps, and secondary actions
- **Swipe right** → marks card as "Followed up" (snooze 24 hours, card greyed out temporarily)

---

### 2.2 Tablet Card (2–3 Columns)

```
┌──────────────────────────┐  ┌──────────────────────────┐
│ [Avatar] John Doe  [Hot] │  │ [Avatar] Jane Doe [Loyal]│
│ @instagram | @facebook   │  │ @whatsapp                │
│ LTV: ฿2,450             │  │ LTV: ฿5,800              │
│ Last: 8 days ago         │  │ Last: 3 days ago         │
│ Orders: 12 | AOV: ฿200   │  │ Orders: 18 | AOV: ฿320   │
│ 💬 Chat  📦 Orders 🔔 FU │  │ 💬 Chat  📦 Orders 🔔 FU │
└──────────────────────────┘  └──────────────────────────┘
```

**Design Rules:**

- **Height:** 180px fixed (slightly taller than mobile for readability)
- **Avatar + Name + Tag:** Same as mobile
- **Channels:** Show up to 4 icons before "+N more"
- **Stats Row:** Show 4 stats (LTV, Order Count, AOV, Last Purchase Date)
  - Smaller font (14px) than mobile (16px) due to card width
- **Action Buttons:** 3 buttons, still 44×44px minimum
- **Message Preview:** Still removed (too verbose for grid layout)

**Tablet Interactions:**
- **Hover** → card lifts with subtle shadow + opacity change
- **Hover over avatar stack (B2B only)** → tooltip shows contact names
- **Hover over tag** → tooltip explains reason (e.g., "Purchased 5 times in 30 days")
- **Right-click** → Quick Edit popover
- **Tap card** → opens full Profile page

---

### 2.3 Desktop Card (3 Columns, Max Width)

```
┌──────────────────────────────────────────┐
│ [Avatar] John Doe             [🔴 Hot]   │
│ @instagram @facebook @whatsapp  +1       │
│                                          │
│ LTV: ฿2,450 | Ord: 12 | AOV: ฿200       │
│ Last Purchase: Feb 15, 2026 (8 days ago) │
│                                          │
│ Last Message: "When will it ship?"       │
│                                          │
│ 💬 Chat    📦 Orders    🔔 Follow-up    │
└──────────────────────────────────────────┘
```

**Design Rules:**

- **Height:** 200px fixed
- **Avatar:** 56px circular
- **Channels:** Show up to 5 icons; "+N" for overflow
- **Stats Row:** Full row with 4 stats in a readable layout
- **Message Preview:** 1 line, truncated (added back on desktop)
- **Action Buttons:** Full labels, 44×44px+ tap target
- **Segment Tag:** Single tag + optional context icon

**Desktop Interactions:**
- **Hover** → card lifts, subtle shadow, light background color change
- **Hover over tag** → tooltip shows reason (AI-generated explanation)
- **Hover over avatar stack (B2B)** → tooltip shows contact names
- **Right-click** → Quick Edit popover
- **Tap card** → opens full Profile page

---

### 2.4 B2B Card Variant (All Sizes)

**Key Differences from B2C:**

```
┌─────────────────────────────────────────────────┐
│ [Square Logo] Acme Corp 🏢      [⭐ VIP]       │
│ 3 Contacts: [Avatar] [Avatar] [Avatar]          │
│                                                 │
│ Total Revenue: ฿15,200 | Orders: 34            │
│ Last Activity: 2 days ago                       │
│                                                 │
│ 💬 Chat   👥 Contacts   📦 Orders              │
└─────────────────────────────────────────────────┘
```

- **Avatar:** Rounded square (not circular), company initials
- **Contact Stack:** Up to 3 circular avatars below org name
  - Hovering (desktop) shows names
  - Tapping (mobile) opens Contacts inline
- **Stats:** Total Revenue + Order Count (not AOV, since multiple contacts)
- **Quick Actions:**
  - "Chat" → Inbox thread for the organization
  - "Contacts" → Bottom Sheet (mobile) or inline dropdown (desktop) showing all contacts
  - "Orders" → Combined order history for entire org

---

## 3. Feature: Filter, Search & Sort (Improved)

### 3.1 Advanced Filters (Moved Out of Card Grid)

**Current state:** Single-select segments in top navigation
**New addition:** Advanced filter dropdown for power users

- **Icon:** Gear + chevron next to search bar
- **When opened:** Popover showing:
  - Segment checkboxes (multi-select Hot + VIP simultaneously)
  - Custom tag search/select
  - Date range: Last purchase (e.g., Last 7 days, Last 30 days, Custom range)
  - Revenue range: LTV (Min–Max)
  - Channel filter: LINE, Facebook, Instagram, etc.
  - Clear all filters button
- **Apply button:** Bottom of popover
- **Chip display:** Show active filters as dismissible chips below the search bar

**Mobile:** Advanced filters as a Bottom Sheet (full screen)

---

### 3.2 Sort (Unchanged, but Enhanced)

```
[Sort by: Most Recent Activity ▼]
```

- Options remain: Most recent activity, Highest revenue, Most recent order, Name A–Z, Newest customers
- **New option:** "Segment priority" (Hot → At-risk → New → VIP → Cold)
  - Useful when browsing "All" segment
- **Mobile:** Same dropdown, but options display as large buttons for easier tap targets

---

## 4. Feature: Adding and Editing Customers (Mobile-First UX)

### 4.1 Add New Customer (Improved)

**Mobile UX Improvement:**

- **FAB Button:** Bottom-right, always visible; "+" icon
- **Opens:** Bottom Sheet that scrolls independently from the card grid
  - Does NOT push content up (avoids keyboard overlap issue mentioned in original spec)
- **Form Fields:**
  - **Required:** Name only
  - **Optional:** Phone, Email, Channel (@username), Customer Type (Individual / Organization)
- **Field Validation:**
  - Real-time duplicate detection as mentioned in original spec
  - Suggestion banner: "John Smith already exists — view profile or add as new"
- **Smart Defaults:**
  - Channel field pre-fills if email domain matches (e.g., john@instagram.com → suggest Instagram)
  - Customer Type defaults to Individual; toggle to Organization
- **Save State:**
  - "Save" button is always enabled (never greyed out)
  - Tapping Save → card appears immediately in grid (Optimistic UI)
  - If API fails → Toast error + form stays open for retry
  - On success → Bottom Sheet closes; card highlights with a subtle pulse animation

**Desktop UX:**
- Side Panel instead of Bottom Sheet
- Same form fields and validation
- Same save behavior

---

### 4.2 Quick Edit from Card (Enhanced for Mobile)

- **Mobile:** Long-press card → Quick Edit popover showing:
  - Edit name (text input)
  - Edit segment tag (dropdownor chip selection)
  - Add/edit pinned note (text area, 2 lines max)
- **Desktop:** Right-click card → same Quick Edit popover
- **Auto-save:** Changes saved as user leaves each field (no explicit Save button)
- **Feedback:** Brief Toast: "Updated" on save

---

### 4.3 Swipe Actions (Mobile — Improved Discoverability)

**Problem with original:** Users don't know swipe actions exist (low discoverability)

**Solution:** Visual affordance

```
[Customer Card with slight left margin]
← Swipe indicator (subtle grey arrow fades in on first load)
```

- **First load only:** Small left-pointing arrow appears at the left edge of the card and fades out after 3 seconds (or on first swipe)
- **Swipe left:** Reveals secondary info panel with:
  - Last message preview
  - Timestamps (created, last activity, last purchase)
  - "Follow-up" button
  - "View profile" link
- **Swipe right:** Marks as "Followed up" (dims card, shows "Snoozed 24h" label, reappears after 24h or manual un-snooze)

---

## 5. Feature: AI Auto Segment & Tagging (Cleaner Display)

### 5.1 Tag Display (Single Tag on Card, Full Tags on Profile)

**On Card:** Show only the **highest-priority tag**
- Ordered: Hot > At-risk > VIP > Loyal > Organization > Cold > New
- Example: If a customer is both VIP and At-risk, show "At-risk" (higher urgency)

**On Profile:** Show all applicable tags in a pill-style list
- Tap a pill → reveals reason why the tag was assigned
- AI-generated reason shows in tooltip: "Purchased 5 times in the last 30 days"

**Hover Behavior (Desktop):**
- Hover tag on card → Shows a concise tooltip with the reason
- Example: "🔴 Hot — Activity 2 hours ago"

---

### 5.2 Tag Icons (Visual Consistency)

Each segment/tag gets a consistent icon + color:
- 🔴 Hot — Red, icon: flame or lightning bolt
- 🟡 At-risk — Orange/yellow, icon: warning triangle
- 🆕 New — Blue, icon: star or sparkle
- ⭐ VIP — Gold, icon: star
- 🟢 Loyal — Green, icon: heart or repeat arrow
- 🔵 Cold — Grey/blue, icon: snowflake
- 🏢 Organization — Purple, icon: building

---

## 6. Feature: AI Churn Alert & Next Best Action (Card-Level)

### 6.1 Churn Alert — Simplified

**Instead of a full orange banner, use a context icon:**

```
┌─────────────────────────────────────────────────┐
│ [Avatar] John Doe              [🔴 Hot] ⚠️      │
│          @instagram | @facebook                 │
│                                                 │
│ LTV: ฿2,450 | Last: 45 days ago 🔴             │
└─────────────────────────────────────────────────┘
```

- **Icon:** Small red dot (🔴) next to the "Last purchase" stat when At-risk
- **Tooltip (mobile: long-press):** "No purchase for 45 days"
- **Follow-up button:** Changes to red "Follow-up" button with icon
- **Card sorting:** When "At-risk" segment is active, At-risk cards appear first by default

---

### 6.2 Next Best Action (Moved to Profile, shown as Floating Card)

**Original issue:** Putting Next Best Action on card = more visual noise

**Improved approach:**
- Action **not shown on card grid**
- Action appears in the Profile page as a **floating contextual card** at the top:
  ```
  ┌────────────────────────────────────┐
  │ 💡 Next Best Action                │
  │ Send a "We miss you" promo message │
  │ [Draft Message]  [Dismiss]         │
  └────────────────────────────────────┘
  ```
- Tapping "Draft Message" → opens Chat with pre-filled template
- User must review + confirm before sending (no auto-send)
- Dismissing → removes the card for this session (reappears on next visit or if conditions change)

**Benefit:** Keeps card grid clean; users see action only when they dive deep into a customer profile.

---

## 7. Feature: Organization Management (B2B — Unchanged)

No UX changes from original spec. Organizations follow the same segment-first approach as individuals.

---

## 8. Feature: Customer Profile Page (Improved)

### Tab 1 — General Info
- Pinned Note at the top (unchanged)
- Profile data + custom fields
- Connected channels
- AI Merge Suggestion banner (if applicable)
- **For Organization:** Inline contact list with add/remove
- **New:** Quick Stats bar showing LTV, order count, last activity date, customer tier

### Tab 2 — Order History
- Summary stats: LTV, AOV, total order count
- All orders with current status
- "Create new order" button (unchanged)
- **New:** Quick filter: Last 7/30/90 days, All time

### Tab 3 — Conversation History
- All channel threads with timestamps
- Each message labeled: AI or Admin
- Tap thread → navigates to Inbox

### Tab 4 — Activity Log
- Chronological timeline (unchanged)
- Filterable by activity type

---

## 9. Feature: Bulk Follow-up (Mobile-First)

### Mobile UX

- Swipe right on card → reveals checkbox
- Select multiple cards → floating Action Bar appears at bottom:
  ```
  ┌────────────────────────────────────────────┐
  │ ✓ 5 selected               [Follow up]    │
  └────────────────────────────────────────────┘
  ```
- Tap "Follow up" → Bottom Sheet opens with:
  - Message template selector (if saved templates exist)
  - Channel dropdown (LINE, Facebook, Instagram, etc.)
  - Optional time picker: "Send now" or "Schedule for 2pm"
  - Send button
- Sending → brief Toast: "Follow-up sent to 5 customers"
- Background job generates individual Follow-up tasks per customer

### Desktop UX
- Checkbox appears on card hover
- Select multiple cards → fixed Action Bar at bottom (same as mobile)

---

## 10. Feature: Duplicate Detection (Unchanged)

Real-time validation while typing; inline warning banner with options to view existing profile or override.

---

## 11. Feature: Pinned Note (Unchanged)

Shared across the team; never visible to customers; displays at top of Profile page.

---

# 🟧 Updated Design Patterns

| Pattern | Before | After | Benefit |
|---------|--------|-------|---------|
| **Filter UI** | Small chips in a row | Large segment buttons | Easier tap targets, clearer visual hierarchy |
| **Card Height** | 400px (mobile) | 140px (mobile) | Users see 5+ cards without scrolling |
| **Stats Display** | 4 stats on every card | 2 stats on card, rest on profile | Reduced visual clutter |
| **Tag Display** | Max 2 tags per card | 1 tag per card | Single visual anchor per customer |
| **Message Preview** | On every card | Swipe to reveal (mobile) | Cleaner card design |
| **Actions** | 3 buttons on card | Smart contextual placement | Reduced decision fatigue |
| **Mobile Interaction** | Swipe undiscoverable | Visual affordance (arrow) | Higher swipe adoption |
| **Churn Alert** | Full orange banner | Context icon + red button | Subtle but urgent |
| **Next Best Action** | On card | On Profile page | Card grid stays clean |
| **Add Customer** | Side panel blocks content | Bottom Sheet (mobile) | Keyboard doesn't obscure form |

---

# 🟦 Updated Acceptance Criteria

## Feature 1: Segment-First Navigation

- [ ] Segment buttons visible: Hot, At-risk, New, VIP, Loyal, Cold, Organization, All
- [ ] Each segment button shows real-time count
- [ ] Tapping segment updates card grid immediately without Apply button
- [ ] Mobile: Segments scroll horizontally without wrapping
- [ ] Desktop: All major segments visible; overflow into "+ More" dropdown
- [ ] Active segment has bold text + color bar underneath
- [ ] Keyboard nav: Arrow left/right switches segments (accessibility)
- [ ] Counts update in real-time as activity occurs

## Feature 2: Mobile Card (140px)

- [ ] Card height is 140px fixed
- [ ] Avatar 48px circular with initials
- [ ] Name + channels (max 3) on single line, truncated
- [ ] Single segment tag (highest priority shown)
- [ ] Stats row: LTV + Last purchase date only
- [ ] 3 action buttons (44×44px minimum)
- [ ] At-risk context shown as icon + red button
- [ ] Tap card → opens Profile page
- [ ] Long-press card → Quick Edit popover
- [ ] Visual affordance (swipe indicator) shown on first load
- [ ] Swipe left → reveals last message + timestamps + secondary actions
- [ ] Swipe right → marks as Followed up (snoozed 24h)

## Feature 3: Tablet Card (180px)

- [ ] Card height 180px fixed
- [ ] Shows 4 stats (LTV, order count, AOV, last purchase)
- [ ] Hover → card lifts with subtle shadow
- [ ] Hover over tag → tooltip explains reason
- [ ] 2–3 column layout (configurable or responsive)

## Feature 4: Desktop Card (200px)

- [ ] Card height 200px fixed
- [ ] Avatar 56px circular
- [ ] Channels (max 5) displayed
- [ ] Full 4 stats visible
- [ ] Last message preview shown
- [ ] 3 action buttons with full labels
- [ ] Hover → card lifts with light background color change
- [ ] 3-column layout fixed

## Feature 5: B2B Card Variant

- [ ] Avatar is rounded square (not circular)
- [ ] Organization badge displayed
- [ ] Contact stack shows up to 3 avatars
- [ ] Hover/tap avatar stack → shows contact names
- [ ] Stats: Total revenue + order count (not AOV)
- [ ] "Contacts" button opens Bottom Sheet (mobile) or dropdown (desktop)
- [ ] No duplicate cards when an organization has multiple contacts

## Feature 6: Advanced Filters

- [ ] Advanced filter dropdown accessible from top bar
- [ ] Options: Segment checkboxes, custom tag search, date range, revenue range, channel filter
- [ ] Active filters shown as dismissible chips below search bar
- [ ] Mobile: Advanced filters as full-screen Bottom Sheet

## Feature 7: Add New Customer (Improved)

- [ ] Mobile: FAB button (+) in bottom-right corner
- [ ] Opens Bottom Sheet (not Side Panel on mobile)
- [ ] Bottom Sheet scrolls independently; doesn't push content up
- [ ] Form fields: Name (required), Phone, Email, Channel, Customer Type
- [ ] Real-time duplicate detection while typing
- [ ] Save button always enabled
- [ ] On save → card appears immediately (Optimistic UI)
- [ ] API failure → Toast error + form stays open
- [ ] Desktop: Side Panel instead of Bottom Sheet

## Feature 8: Quick Edit (Enhanced)

- [ ] Mobile: Long-press card → popover with edit name, tag, note
- [ ] Desktop: Right-click card → same popover
- [ ] Auto-save on field blur (no Save button)
- [ ] Toast confirmation: "Updated"

## Feature 9: Swipe Actions (Mobile — Discoverable)

- [ ] First load: Visual affordance (left-pointing arrow) appears and fades after 3s
- [ ] Swipe left → reveals: last message, timestamps, Follow-up button, View profile link
- [ ] Swipe right → marks as Followed up; card dims with "Snoozed 24h" label

## Feature 10: AI Auto Segment (Single Tag Display)

- [ ] Card shows only highest-priority tag (Hot > At-risk > VIP > Loyal > Cold > New > Organization)
- [ ] Profile page shows all applicable tags in pill-style list
- [ ] Hover tag on card → tooltip shows reason (e.g., "Purchased 5 times in 30 days")
- [ ] Tags have consistent icons + colors

## Feature 11: Churn Alert (Simplified)

- [ ] At-risk context shown as icon (🔴) next to last purchase date
- [ ] Follow-up button turns red on At-risk cards
- [ ] Long-press icon → tooltip explains inactivity period
- [ ] At-risk segment sorting: At-risk customers appear first

## Feature 12: Next Best Action (Moved to Profile)

- [ ] Action **not shown on card grid**
- [ ] Appears in Profile page as floating contextual card
- [ ] Tap "Draft Message" → Chat with pre-filled template
- [ ] Dismiss button removes card for session
- [ ] No auto-send under any circumstance

## Feature 13: Bulk Follow-up (Mobile-First)

- [ ] Mobile: Swipe right on card → reveals checkbox
- [ ] Select multiple cards → floating Action Bar at bottom
- [ ] Tap "Follow up" → Bottom Sheet with message + channel + schedule options
- [ ] Sending → Toast: "Follow-up sent to X customers"
- [ ] Desktop: Checkbox on card hover; same flow as mobile

## Feature 14: Organization Management (B2B)

- [ ] B2B cards have rounded-square avatar
- [ ] Contact stack shows up to 3 avatars
- [ ] "Contacts" button opens inline list (Bottom Sheet mobile, dropdown desktop)
- [ ] Total revenue calculated in real-time
- [ ] Removing contact converts them to Individual (not deleted)

## Feature 15: Customer Profile Page

- [ ] Tab 1 — General Info: Pinned Note at top, Quick Stats bar showing LTV/orders/tier
- [ ] Tab 2 — Order History: Summary stats + "Create order" button + date filter
- [ ] Tab 3 — Conversation History: All threads labeled AI/Admin
- [ ] Tab 4 — Activity Log: Filterable by activity type
- [ ] Next Best Action card displayed (only on Profile, not on card grid)

## Performance & Accessibility

- [ ] Card grid renders < 1.5s on first load (p95)
- [ ] Filter/sort response < 300ms
- [ ] All interactive elements have ARIA labels (accessibility)
- [ ] Mobile cards optimized for thumb-reach (44px minimum tap targets)
- [ ] Keyboard navigation: `/` or `Cmd+K` to search, Arrow keys to switch segments
- [ ] Keyboard accessible controls: Tab, Enter, Escape, Arrow keys all work as expected

## Definition of Done

- [ ] Figma designs complete: Mobile (375px), Tablet (768px), Desktop (1280px)
- [ ] All states: Default, Loading (Skeleton Cards), Empty, Error, Hover, Active, Disabled, At-risk, Hot
- [ ] All card variants: B2C Individual, B2B Organization
- [ ] Responsive typography: Scales appropriately across breakpoints
- [ ] Interactive prototypes showing: Swipe actions, Quick Edit, Segment switching, Bulk follow-up
- [ ] Accessibility audit: WCAG 2.1 AA color contrast, ARIA labels, keyboard navigation
- [ ] User testing: 5 users on mobile (primary workflow) before handoff to dev

---

# 🎯 Social Commerce Considerations

As a **social listener**, here's what makes this design resonate with **online sellers:**

1. **Mobile-First by Default** — Sellers manage shops on smartphones during lunch breaks, evenings, weekends. Not at a desk.

2. **Segment-First Entry** — Sellers care about urgency:
   - "Who's Hot right now?" (immediate chat opportunities)
   - "Who's At-risk?" (save revenue before churn)
   - Filter to these, not to the full customer list.

3. **Minimal Scrolling** — Short cards (140px) mean users see 5–6 customers at once on mobile. Scrolling = task abandonment.

4. **Swipe Interactions** — Instagram/TikTok users are trained to swipe. Swipe-to-action feels natural.

5. **Visual Feedback** — Colors (red for urgency, green for opportunity) are intuitive. Icons + colors reduce reading load.

6. **Inline Actions** — "Chat Now" button on the card = faster response time to Hot customers. Less friction = more conversations.

7. **Notifications on Demand** — Segment buttons show counts (e.g., "Hot (12)"). Users check this regularly without needing push notifications.

8. **Respect for Time** — Clean card design respects that online sellers are **busy and distracted**. No cognitive overload.

---

# 📊 Metrics to Track

Post-launch, measure these to validate the improvements:

- **Time-to-action:** Average time from customer list → Chat message sent
  - Target: < 30 seconds for Hot customers
- **Segment engagement:** % of users who filter by Hot/At-risk daily
  - Target: > 70% of active admins
- **Swipe adoption:** % of mobile users using swipe actions (track with analytics)
  - Target: > 40% after 2 weeks
- **Mobile time-on-page:** Average session duration on mobile (should decrease with better UX)
  - Target: < 8 minutes for typical task
- **Error recovery:** % of duplicate detection catches before save
  - Target: > 95%
- **Card load time:** P95 for rendering 50+ cards
  - Target: < 800ms

---

# 🎓 Implementation Notes for Designers & Developers

## Figma Handoff

- Create a component library:
  - `CustomerCard/Mobile`
  - `CustomerCard/Tablet`
  - `CustomerCard/Desktop`
  - `CustomerCard/B2C` & `CustomerCard/B2B`
  - `SegmentButton` (active, inactive, count states)
  - `QuickEditPopover`
  - `AdvancedFilterDropdown`
  - `ActionBar` (bulk follow-up)

- Use Figma variables for:
  - Colors (segment colors: red, orange, yellow, green, blue, grey, gold)
  - Typography scales (mobile vs tablet vs desktop font sizes)
  - Spacing scale (44px touch target, 16px padding, etc.)
  - Icon library (linked to Heroicons or Lucide)

## Code Implementation

- **Responsive Cards:** Use CSS Grid with auto-fit; media queries for card height adjustments
- **Swipe Detection:** Consider Hammer.js or native pointer events for swipe
- **Segment Buttons:** Keyboard-accessible; Arrow keys to navigate
- **Infinite Scroll:** Observe last card in viewport; fetch next batch when 80% visible
- **Animation:** Subtle card lift on hover (transform: translateY(-4px) + box-shadow)
- **Mobile Optimizations:**
  - Touch targets ≥ 44×44px
  - Avoid hover states (use active/focus instead)
  - Minimize layout shift (reserve space for loading skeletons)

---

# 🚀 Rollout Strategy

1. **Phase 1 (Weeks 1–2):** Deploy Segment-First Navigation (filter improvement only)
   - Gather feedback on segment names and ordering
   - Monitor engagement metrics

2. **Phase 2 (Weeks 3–4):** Deploy New Card Design (140px mobile, 180px tablet)
   - A/B test against old card design for 1 week
   - Track time-to-action, swipe adoption, error rates

3. **Phase 3 (Week 5):** Deploy Advanced Filters + Bulk Actions
   - Gather power-user feedback

4. **Phase 4 (Week 6):** Deploy AI Next Best Action on Profile page
   - Monitor adoption and confirmation rates (no auto-send validation)

---

**End of Improved User Story**

This redesign prioritizes **mobile-first usability**, **scanning efficiency**, and **social commerce workflows** while maintaining all business requirements from the original spec.
