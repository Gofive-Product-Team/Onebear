# User Story — CRM Customer Management
## Onebear Phase 1

---

# 🟥 Pain

The existing CRM inherited from Salesbear was designed primarily for **B2B** workflows — built around a Company → Contact → Deal Pipeline structure. This is fundamentally misaligned with Onebear's core user base: **online sellers** who operate in B2C and light B2B contexts through social commerce channels.

**Business impact if left unresolved:**
- Admins must navigate multiple screens to view customer information that should be visible in a single glance
- No automated segmentation means the team misses time-sensitive opportunities with Hot or At-risk customers
- Teams with multiple sales staff cannot assign or track customers in a structured way
- Poor mobile UX slows down admins who primarily work on smartphones
- No support for organizational customers with multiple contacts, causing revenue to be fragmented across unlinked profiles

---

# 🟩 Business

## 1. Feature: Customer Card Grid

The system displays the customer list as a **Card Grid** instead of a table, allowing admins to scan key information at a glance without opening individual profiles.

- **Layout**: Desktop = 3 columns, Tablet = 2 columns, Mobile = 1 column (full-width horizontal card)
- **Default sort**: Most recent activity — customers with the latest interaction appear first
- **Loading state**: Use Skeleton Cards while loading; spinner in the center of the screen is prohibited
- **Infinite scroll**: Additional cards load automatically when the user scrolls to the bottom; no "Load more" button
- **Performance target**: First load < 1.5 seconds (p95)

### 1.1 B2C Card (Individual)

- Circular avatar showing 2-character initials; background color is deterministically generated from the customer's name
- Customer name + channel icons (LINE, Facebook, Instagram, etc.)
- Segment tags — maximum 2 visible, ordered by priority: **Hot > At-risk > VIP > Loyal > Cold > New**
  - Tags assigned by AI carry a small star icon
  - Tags added manually by admins have no star icon
- Last message preview (1 line, truncated with ellipsis)
- Stats: Lifetime Value (LTV), order count, Average Order Value (AOV), date of last purchase
- Orange banner when customer is At-risk: "No purchase for X days"
- **Quick Actions** (bottom of card):
  - "Chat" → opens the customer's Inbox thread
  - "Orders" → opens order history
  - "Follow-up" → button turns red if At-risk; button turns green and reads "Chat Now" if Hot
  - Minimum button tap target: 44×28px for mobile usability

### 1.2 B2B Card (Organization)

- Rounded-square avatar (not circular) showing company initials
- "Organization" badge displayed prominently
- Contact avatar stack: shows up to 3 contacts + "+N" overflow indicator
  - Hovering over the avatar stack (desktop) shows a tooltip with each contact's name
- Total revenue = sum of all paid orders across every contact in the organization, calculated in real-time
- **Quick Actions**:
  - "Chat" → opens Inbox
  - "Contacts" → opens a Bottom Sheet (mobile) or Dropdown (desktop) showing the contact list inline — no page navigation required
  - "Orders" → opens combined order history for the entire organization

---

## 2. Feature: Filter, Search & Sort

### 2.1 Filter Chips

- Single-row filter chips at the top of the page; horizontally scrollable on mobile (no wrapping)
- Options: **All / Hot / VIP / At-risk / New / Cold / Organization**
- Each chip displays a count, e.g. Hot (12)
- Selecting a chip updates the card grid immediately — no Apply button required (single select)
- Multiple filters simultaneously → available through Advanced Filter (dropdown)
- No results for a filter → show Empty State with an explanation and a "Clear filter" button

### 2.2 Search

- Search bar is always at the top; keyboard opens automatically on tap (mobile)
- Searchable fields: name, phone number, email, channel username (LINE/Facebook)
- Real-time results while typing — Debounce 300ms; no Enter key required
- Matching text is highlighted in results
- No results found → display **"+ Add new customer '[search term]'"** button immediately
- Pressing Escape or tapping X clears the search and returns to the full list

### 2.3 Sort

- "Sort by" dropdown with options:
  - Most recent activity *(Default)*
  - Highest total revenue
  - Most recent order
  - Name A–Z
  - Newest customers
- Changing the sort reorders cards immediately without a page reload

---

## 3. Feature: Adding and Editing Customers

### 3.0 Customer Record Creation Channels

The system creates a Customer Record through **3 channels**:

| Channel | Creation Trigger | Initial State |
|---|---|---|
| **1. Incoming chat (Auto)** | Customer sends their first message via any connected channel | Temporary Contact — not shown in CRM |
| **2. Order created (Trigger)** | An order is created and reaches **Pending Payment** status or beyond | **Confirmed as real customer — card appears in CRM immediately** |
| **3. Manual entry (Admin)** | Admin fills in the add customer form | Appears in CRM immediately |

**Contact → Customer promotion logic:**

```
Customer sends a chat message
    → System creates a temporary Contact (not shown in CRM Card Grid)
    → AI or admin creates an order
        → Order reaches Pending Payment status
            → Contact is promoted to Customer
            → Card appears in CRM immediately
            → Auto-tags applied: "New" + "Hot"
            → First Order Date is recorded
```

**Rules:**
- Contacts without an order at Pending Payment or beyond are **not shown in the CRM Card Grid** — they do not clutter the customer view
- If an order is cancelled before payment → Customer Record is retained but the tag changes to "Cold" immediately
- If the same customer returns to chat without creating a new order → no duplicate Contact is created; the existing record is reused
- Admins can **manually promote a Contact → Customer** without waiting for an order

### 3.1 Add New Customer (Manual)

- "+ Add customer" button is always accessible at the top-right on desktop
- On mobile: **Floating Action Button (FAB)** in the bottom-right corner; smart-hides on scroll down, reappears on scroll up
- Opens as a Bottom Sheet (mobile) or Side Panel (desktop) — never a new page
- Only one required field: **Name**
- Optional fields: phone number, email, channel, Customer Type
  - Customer Type default = Individual
- On save → new card appears in the grid immediately (**Optimistic UI**)
  - If API fails → roll back and show Toast error
- Target time to complete form: < 30 seconds
- Keyboard on mobile must not obscure the field being typed in

### 3.2 Quick Edit from Card

- Long press on card (mobile) or right-click (desktop) → Quick Edit menu
- Quick Edit options: edit name, add note, change tag
- Auto-saves on field blur — no Save button required
- Changes are reflected on the card immediately

### 3.3 Swipe Actions (Mobile)

- Swipe left → reveals "Follow-up" and "Chat" buttons
- Swipe right → marks as "Followed up" (Snooze for 24 hours)
- Each action requires no more than 1 swipe + 1 tap
- Haptic feedback when swipe reaches the trigger point (where device supports it)

---

## 4. Feature: AI Auto Segment & Tagging

### 4.1 Auto-tag Rules

The system recalculates and updates tags automatically every time a new activity event occurs.

| Tag | Condition |
|---|---|
| New | Contact created within the last 7 days |
| Hot | Activity within the last 48 hours, or Payment Link opened |
| VIP | Cumulative LTV ≥ VIP Threshold (default ฿5,000 — configurable by Super Admin in Settings) |
| At-risk | Has purchased before + no activity for more than 30 days |
| Cold | No activity for more than 60 days |
| Loyal | Repeat purchases ≥ 3 consecutive times |
| Organization | CustomerType = Organization |

- A single customer can hold multiple tags simultaneously, e.g. VIP + At-risk
- Maximum 2 tags displayed on a card, ordered by priority
- AI-assigned tags show a star icon; hovering (desktop) reveals a tooltip explaining the reason, e.g. "Purchased 5 times in 30 days"

### 4.2 Manual Tag Editing

- Tap a tag on the card or profile → Popover shows all available tags + text input to create new ones
- Remove a tag by tapping X
- Custom tags created by admins are saved globally and shared across the team
- If an admin removes a tag that AI still considers valid → AI will re-suggest the tag after 7 days

---

## 5. Feature: AI Churn Alert & Next Best Action

### 5.1 Churn Alert

- AI automatically changes VIP → At-risk when no activity is recorded for more than 30 days
- KPI Snapshot shows an alert: "X VIP customers are at risk of going cold"
- Orange banner on card displays days since last purchase: "No purchase for X days"
- Follow-up button on the card changes to red (Urgent)
- Works out of the box — no configuration required by the admin

### 5.2 Next Best Action

- Cards for Hot and At-risk customers display 1 AI-suggested action
  - Examples: "Send promotion", "Follow up on pending order", "Suggest product X"
- Suggested action is a tappable button — not just informational text
- Tapping it opens a **Chat Draft** pre-filled with AI-prepared message copy
- **User must review and confirm before sending — auto-send is strictly prohibited**
- AI uses data from the current shop only — no cross-shop benchmarking

---

## 6. Feature: Organization Management (B2B)

### 6.1 Creating an Organization and Contacts

- Add customer → select Customer Type = Organization → enter company name
- Unlimited contacts can be added under one organization
- Existing Individual customers can be linked to an organization (Link Existing Contact)
- Removing a contact from an organization → profile remains as an Individual; not deleted from the system
- Organization total revenue = sum of all contact orders, calculated in real-time

### 6.2 AI Organization Suggestion

- AI detects potential matches using: name similarity, shared email domain, matching phone number prefix
- If Confidence ≥ 80% → small banner on profile: "May belong to the same company as [Name]"
- Tapping the banner → Modal: choose to create a new Organization or link to an existing one
- Dismissing the suggestion → banner is permanently hidden for that pair

---

## 7. Feature: Customer Profile Page

Tapping a card opens the full Profile page, organized into **4 tabs**.

### Tab 1 — General Info
- Full profile data + all Custom Fields
- Connected channels
- Pinned Note — **Shared internal note, visible to all team members; never visible to the customer**
  - Maximum 1 pinned note per customer
  - Replacing an existing note requires confirmation (warns that the current note will be overwritten)
- AI Merge Suggestion banner (if applicable)
- For Organization: contact list with add/remove capability

### Tab 2 — Order History
- All orders with their current status
- Summary strip: LTV, AOV, total order count
- "Create new order" button accessible directly from this tab

### Tab 3 — Conversation History
- All channel threads for this customer
- Each message labeled as AI or Admin
- Tapping a thread navigates directly to that Inbox conversation

### Tab 4 — Activity Log
- Chronological timeline: chats, orders, payments, follow-ups, appointments
- Manual notes added by admins
- Filterable by activity type

---

## 8. Feature: Bulk Follow-up

- Admins enter Selection Mode and choose multiple customers via Checkbox on each card
- An Action Bar appears at the bottom of the screen: "Follow up with X customers"
- On confirm → the system generates a separate Follow-up task per customer in the background
  - Each task uses the same message template but is dispatched individually
  - If Follow-up Config is already set → uses the configured channel and timing
  - If no Config exists → Bottom Sheet opens to select channel and message before dispatching
- **No CSV export** — users are intentionally kept within the platform

---

## 9. Feature: Duplicate Detection

- Validation runs in real-time as the admin types — no Save required to trigger it
- **Validation priority order:**
  1. **Tax ID** (juristic person number) — checked first for Organization type
  2. **National ID number** — checked first for Individual type
  3. **Phone number** — fallback if no ID is provided
  4. **Name (Fuzzy Match)** — last-resort fallback
- Match found → Warning Banner appears inline in the form immediately: "A customer with matching details already exists — [Name]"
- Admin options: view the existing profile / continue adding as new (Override)
- If Override is chosen → an audit log entry is created recording which admin added the duplicate and when

---

## 10. Feature: Pinned Note

- Notes are **Shared Internal** — all team members see the same note on every customer profile
- Customers never see these notes under any circumstance
- Displayed prominently at the top of the Profile page
- Displayed as a tooltip icon on the customer card
- Only 1 pinned note allowed per customer — replacing it requires a confirmation prompt

---

# 🟧 Discussion

| # | Topic | Decision |
|---|---|---|
| 1 | **Bulk Action** | ✅ Resolved — Checkbox multi-select + "Follow up X customers" button; backend generates individual Follow-up tasks per customer |
| 2 | **Export CSV** | ✅ Resolved — No export feature; users must work within the platform |
| 3 | **Duplicate Detection** | ✅ Resolved — Real-time inline warning; validate Tax ID / National ID first, then phone, then name (fuzzy) |
| 4 | **Pinned Note Visibility** | ✅ Resolved — Shared across the entire team (internal only; never visible to customers) |
| 5 | **AI Next Best Action** | ✅ Resolved — Uses only the current shop's data; no cross-shop benchmarking |
| 6 | **VIP Threshold Settings** | 📌 To be documented in Settings Page User Story — Super Admin configurable (default ฿5,000), based on paid LTV only, re-calculates all tags immediately on change |

---

# 🟦 Acceptance Criteria

## Feature 1: Customer Card Grid

- [ ] Customer page renders and displays cards within 1.5 seconds (p95)
- [ ] Desktop shows 3 columns; mobile shows 1 full-width column
- [ ] Default sort = Most recent activity
- [ ] Infinite scroll loads more cards automatically; no "Load more" button exists
- [ ] Skeleton Cards display during loading; no center-screen spinner
- [ ] Entire card is tappable to open the Profile page
- [ ] B2C card displays: avatar, name, channel icons, tags, last message, LTV, order count, AOV, last purchase date, Quick Actions
- [ ] B2B card displays: rounded-square logo/initials, Organization badge, avatar stack, total revenue, Quick Actions
- [ ] Avatar stack shows maximum 3 contacts + "+N" for overflow
- [ ] Tooltip shows contact names on avatar stack hover (desktop)
- [ ] Orange At-risk banner shows "No purchase for X days" on applicable cards
- [ ] Follow-up button is red for At-risk customers
- [ ] "Chat Now" button is green for Hot customers
- [ ] Quick Action button minimum tap target is 44×28px

## Feature 2: Filter, Search & Sort

- [ ] Filter chips render: All / Hot / VIP / At-risk / New / Cold / Organization
- [ ] Each chip shows customer count
- [ ] Selecting a chip updates the card grid immediately without an Apply button
- [ ] Filter chips scroll horizontally on mobile without wrapping
- [ ] No results for a filter → Empty State with reason + "Clear filter" button
- [ ] Search is real-time with 300ms debounce; no Enter key required
- [ ] Searchable fields: name, phone, email, channel username
- [ ] Matching text is highlighted in search results
- [ ] No results → "+ Add new customer '[search term]'" button displayed
- [ ] Sort change reorders cards immediately without page reload

## Feature 3: Adding and Editing Customers

- [ ] Temporary Contacts from incoming chats are **not shown** in the CRM Card Grid
- [ ] When an order reaches Pending Payment → Customer card appears in CRM immediately
- [ ] Auto-tags "New" + "Hot" are applied when a Contact is promoted to Customer
- [ ] First Order Date is recorded at time of promotion
- [ ] Order cancelled before payment → Customer Record remains; tag changes to "Cold"
- [ ] Same customer re-engaging without a new order → existing Contact reused; no duplicate created
- [ ] Admin can manually promote a Contact to Customer without an order
- [ ] "+ Add customer" button always accessible on desktop
- [ ] FAB visible on mobile bottom-right; smart-hides on scroll down
- [ ] Form opens as Bottom Sheet (mobile) or Side Panel (desktop)
- [ ] Only "Name" is a required field
- [ ] Customer Type defaults to Individual
- [ ] Save → card appears immediately (Optimistic UI); API failure rolls back + shows Toast error
- [ ] Quick Edit via long press (mobile) or right-click (desktop)
- [ ] Auto-saves on field blur; no Save button needed
- [ ] Swipe left → Follow-up and Chat buttons
- [ ] Swipe right → Snooze 24 hours

## Feature 4: AI Auto Segment

- [ ] Tags recalculate automatically on every new activity event
- [ ] AI-assigned tags show a star icon
- [ ] Admin-assigned tags show no star icon
- [ ] Hovering a tag (desktop) shows tooltip explaining the reason
- [ ] Tags editable via Popover on card or profile
- [ ] Custom tags are saved globally and shared across the team
- [ ] AI re-suggests a tag after 7 days if admin removed it and the condition still applies

## Feature 5: AI Churn Alert & Next Best Action

- [ ] AI promotes VIP → At-risk automatically after 30 days of no activity
- [ ] KPI Snapshot displays "X VIP customers at risk of going cold"
- [ ] At-risk card shows orange banner with days since last purchase
- [ ] Follow-up button is red on At-risk cards
- [ ] Suggested Action is displayed on Hot and At-risk cards
- [ ] Tapping Suggested Action opens a pre-filled Chat Draft
- [ ] User must confirm before sending — no auto-send under any circumstance
- [ ] AI uses current shop data only; no cross-shop data

## Feature 6: Organization Management

- [ ] Organization can be created by setting Customer Type = Organization
- [ ] Unlimited contacts can be added under one organization
- [ ] Existing Individual customers can be linked to an organization
- [ ] Removing a contact from an organization converts them back to Individual; not deleted
- [ ] Organization total revenue recalculates in real-time from all contacts' paid orders
- [ ] AI suggests organization grouping when Confidence ≥ 80%
- [ ] Dismissing a suggestion permanently hides it for that pair

## Feature 7: Customer Profile Page

- [ ] Profile page has 4 tabs: General Info, Order History, Conversation History, Activity Log
- [ ] Pinned Note displayed at top of General Info tab
- [ ] "Create new order" button accessible from Order History tab
- [ ] Conversation threads labeled as AI or Admin
- [ ] Tapping a thread navigates to the Inbox conversation
- [ ] Activity Log is filterable by activity type

## Feature 8: Bulk Follow-up

- [ ] Checkbox appears on each card when in Selection Mode
- [ ] Action Bar appears at bottom with "Follow up with X customers" when ≥ 1 customer is selected
- [ ] Confirming generates a separate Follow-up task per customer in the background
- [ ] If no Follow-up Config exists → Bottom Sheet opens to select channel + message before dispatch
- [ ] No CSV export button exists anywhere in the CRM

## Feature 9: Duplicate Detection

- [ ] Validation runs in real-time while typing — no Save required
- [ ] Validation order: Tax ID / National ID → phone number → name (fuzzy)
- [ ] Match found → Warning Banner appears inline in the form immediately
- [ ] Admin can view the existing profile or override and continue adding
- [ ] Override action is recorded in Audit Log (admin identity + timestamp)

## Feature 10: Pinned Note

- [ ] Note is shared across the entire team — all admins see the same note
- [ ] Customers never see pinned notes under any circumstance
- [ ] Note displayed prominently at the top of the Profile page
- [ ] Note displayed as tooltip icon on the customer card
- [ ] Maximum 1 pinned note per customer
- [ ] Replacing an existing note requires a confirmation prompt

## Error States & Edge Cases

- [ ] No customers exist → Empty State with illustration + "Add your first customer" button
- [ ] No avatar image → 2-character initials on a deterministically colored background
- [ ] Customer has no orders → display "No orders yet" instead of a monetary value
- [ ] Page load fails → Error Toast + Retry button

## Definition of Done

- [ ] Figma designs complete for all states: Default, Loading, Empty, Error, Mobile, Desktop
- [ ] Responsive at Mobile 375px and Desktop 1280px
- [ ] All interactive elements have ARIA labels (accessibility)
- [ ] Performance: First Load < 1.5s, Filter/Sort response < 300ms
- [ ] Tested with 3 real users before handoff to dev
