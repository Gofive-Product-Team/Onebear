# 🎨 Customer CRM — Figma Design Specification
## Hybrid Design: Mobile Cards + Desktop Table

---

# 📐 Design System Setup

## Colors (Create as Figma Variables)

### Segment Colors
- **🔴 Hot:** `#EF4444` (Red)
- **🟡 At-risk:** `#F59E0B` (Orange)
- **🆕 New:** `#3B82F6` (Blue)
- **⭐ VIP:** `#FBBF24` (Gold)
- **🟢 Loyal:** `#10B981` (Green)
- **🔵 Cold:** `#6B7280` (Grey)
- **🏢 Organization:** `#A855F7` (Purple)

### Neutral Palette
- **White:** `#FFFFFF`
- **Grey 50:** `#F9FAFB`
- **Grey 100:** `#F3F4F6`
- **Grey 200:** `#E5E7EB`
- **Grey 300:** `#D1D5DB`
- **Grey 400:** `#9CA3AF`
- **Grey 500:** `#6B7280`
- **Grey 600:** `#4B5563`
- **Grey 700:** `#374151`
- **Black:** `#0F172A`

### Text Colors
- **Primary:** `#0F172A` (Black)
- **Secondary:** `#475569` (Grey 600)
- **Tertiary:** `#94A3B8` (Grey 400)
- **On Red:** `#FFFFFF` (White)

## Typography (Create as Figma Styles)

| Style | Font | Size | Weight | Line Height |
|-------|------|------|--------|-------------|
| **H1** | Inter | 32px | 700 Bold | 40px (1.25) |
| **H2** | Inter | 24px | 700 Bold | 32px (1.33) |
| **H3** | Inter | 20px | 700 Bold | 28px (1.4) |
| **Body XL** | Inter | 16px | 500 | 24px (1.5) |
| **Body** | Inter | 16px | 400 | 24px (1.5) |
| **Small** | Inter | 14px | 500 | 20px (1.43) |
| **Tiny** | Inter | 12px | 400 | 16px (1.33) |
| **Caption** | Inter | 11px | 500 | 14px (1.27) |

## Spacing (Create as Figma Variables)

- **xs:** 4px
- **sm:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 24px
- **2xl:** 32px
- **3xl:** 48px

## Corner Radius

- **sm:** 4px (buttons, badges, input fields)
- **md:** 8px (cards)
- **full:** 9999px (circles)

---

# 📱 PAGE 1: MOBILE (375px) — Card Grid Layout

## Layout Specs

- **Viewport:** 375px wide (iPhone 12)
- **Grid:** 1 column (full-width cards)
- **Padding:** 16px left/right
- **Card Height:** 140px fixed
- **Card Corner Radius:** 8px
- **Card Spacing (gap):** 12px

---

## Component 1: Segment Navigation Bar

**Position:** Top of page, below search bar (not shown)
**Height:** 56px (including label)

### Structure:
```
┌─────────────────────────────────────┐
│ [🔴 Hot (12)] [🟡 Risk (5)] ...     │ ← Horizontally scrollable
└─────────────────────────────────────┘
```

### Segment Button Specs:
- **Width:** 72px each (variable)
- **Height:** 40px
- **Padding:** 8px
- **Border Radius:** 6px
- **Font:** Small (14px, 500)
- **Background:** Segment color (at 100% opacity)
- **Text Color:** White
- **Active State:** Bold border (2px) in segment color
- **Inactive State:** Same as active but lighter opacity (60%)

### Order (left to right):
1. 🔴 Hot (count)
2. 🟡 At-risk (count)
3. 🆕 New (count)
4. ⭐ VIP (count)
5. 🟢 Loyal (count)
6. 🔵 Cold (count)
7. 🏢 Organization (count)
8. 🔵 All (count) — rightmost

---

## Component 2: Mobile Customer Card (B2C Individual)

**Dimensions:** 343px width × 140px height (fixed)

### Layout (vertical stack inside card):

```
┌─────────────────────────────────────────┐
│ [Avatar] Name                 [Tag]    │ ← Row 1 (32px)
│          @instagram | @facebook         │ ← Row 2 (20px)
│                                         │
│ LTV: ฿2,450 | Last: 8 days ago         │ ← Row 3 (20px)
│                                         │
│ [💬 Chat] [📦 Orders] [🔔 Follow-up]   │ ← Row 4 (44px)
└─────────────────────────────────────────┘
```

### Padding: 12px (all sides)

### Row 1 — Header (Display: flex, align: center, justify: space-between)
- **Left side:**
  - Avatar: 32×32px, border-radius 16px (circle)
  - Initials: 14px, 700 weight, white text, centered
  - Name: 15px, 500 weight, black text
- **Right side:**
  - Tag: 50×24px, border-radius 4px
  - Tag text: 10px, 500 weight, white text
  - Tag background: Segment color (Hot/New/VIP/etc.)

### Row 2 — Channels (single line, truncated)
- **Font:** Tiny (12px), Secondary gray
- **Text:** "@instagram @facebook @whatsapp" (up to 3 icons)
- **Overflow:** If 4+ channels, show "+2 more"

### Row 3 — Stats Row
- **Font:** Small (13px), Secondary gray
- **Format:** "LTV: ฿2,450  |  Last: 8 days ago"
- **If At-risk:** Add red dot icon before last stat

### Row 4 — Action Buttons (Display: flex, gap: 8px, grow)
- **3 buttons, equal width (111px each)**
- **Height:** 44px (minimum tap target)
- **Button states:**
  - Default: Grey background (`#F3F4F6`)
  - At-risk "Follow-up": Red background (`#EF4444`), white text
  - Hot "Chat Now": Green background (`#10B981`), white text
- **Border Radius:** 4px
- **Font:** Caption (11px), 500 weight
- **Icon + Label:** "💬 Chat" format

---

## Card States (Mobile)

### Default State
- White background (`#FFFFFF`)
- Grey border (`#E5E7EB`)
- No shadow

### Hover State (not applicable on mobile)
- —

### Active/Pressed State
- Slight opacity change (90%)
- Border highlight

### At-Risk Variant
- Card border: Orange (`#F59E0B`), 2px
- Avatar background: Orange
- Stats row: Shows red dot icon
- Follow-up button: Red background, white text
- Warning text optional (for emphasis)

### Hot Variant
- Card border: Red (`#EF4444`), 2px
- Avatar background: Red
- Chat button: Could be green "Chat Now" (optional)

### New Variant
- Card border: Blue (`#3B82F6`), 1px
- Avatar background: Blue

---

## Card Interaction States

### Swipe Left
- Reveals secondary panel (in prototype)
- Shows: Last message preview, timestamp, additional actions

### Swipe Right
- Marks as "Followed up" (visual feedback)
- Card dims, shows "Snoozed 24h" label
- Card reappears after 24h

### Long Press
- Opens Quick Edit popover (in prototype)
- Options: Edit name, change tag, add note

---

## Mobile Page Layout (Complete)

```
┌─────────────────────────────────────┐
│ 🔍 Search bar                        │ ← Search (not detailed here)
├─────────────────────────────────────┤
│ [Hot (12)] [Risk (5)] [New (8)] ... │ ← Segment nav (horizontal scroll)
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [JD] John Doe        [🔴 Hot]   │ │ ← Card 1
│ │ @instagram | @facebook           │ │
│ │ LTV: ฿2,450 | Last: 8 days      │ │
│ │ [💬] [📦] [🔔]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [JS] Jane Smith    [🟡 At-risk] │ │ ← Card 2
│ │ @whatsapp                        │ │
│ │ LTV: ฿5,800 | Last: 45 days     │ │
│ │ [💬] [📦] [🔴 URGENT]           │ │ ← Red button
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [MJ] Mike J        [🆕 New]     │ │ ← Card 3
│ │ @line | @instagram | @facebook   │ │
│ │ LTV: ฿1,200 | Last: 2 days      │ │
│ │ [💬] [📦] [🔔]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⬇️ Infinite scroll loads more cards  │
└─────────────────────────────────────┘

FLOATING ACTION BUTTON (FAB) in bottom-right:
┌─────┐
│  +  │ ← Add new customer
└─────┘
```

---

# 🖥️ PAGE 2: TABLET (768px) — Hybrid Table/Card View

## Layout Specs

- **Viewport:** 768px wide (iPad)
- **Table Layout:** Single-row table or 2-column card grid
- **Recommendation:** Switch to table view (see page 3)

### Option A: Table View (Recommended)
- 2–3 columns of data visible
- Can show more metrics than mobile
- More natural for tablet landscape orientation

### Option B: 2-Column Card Grid
- 2 cards per row
- 180px height (slightly taller than mobile for readability)
- Same component structure as mobile, but with 4 stats visible

**Recommendation:** Use Table View from Desktop spec (Page 3) — same structure works great on tablet.

---

# 🖥️ PAGE 3: DESKTOP (1280px) — Table View

## Layout Specs

- **Viewport:** 1280px wide (standard desktop)
- **Table Layout:** Full-width data table
- **Padding:** 24px left/right
- **Available width:** 1232px (table width)

---

## Component 1: Filter & Search Bar (Top)

**Height:** 60px (with spacing)

### Structure:
```
┌──────────────────────────────────────────────────────┐
│ [🔍 Search...] [Segment Filter ▼] [⚙️ More Filters] │
└──────────────────────────────────────────────────────┘
```

### Search Bar
- **Width:** 280px
- **Height:** 40px
- **Border Radius:** 6px
- **Border:** 1px grey (`#E5E7EB`)
- **Font:** Body (16px)
- **Placeholder:** "Search customers by name, email, phone..."
- **Icon:** Search icon (left side, 4px padding)

### Segment Filter Dropdown
- **Width:** 160px
- **Height:** 40px
- **Label:** Selected segment name (e.g., "Hot (12)")
- **Dropdown icon:** Right side

### More Filters Button
- **Width:** 40px
- **Height:** 40px
- **Icon:** Gear/settings
- **Tooltip:** "Advanced filters"

---

## Component 2: Data Table

**Structure:**
```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [☐] │ Avatar │ Name          │ Channel        │ LTV      │ Orders │ Last Purchase │ Actions │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ [☑] │ [JD]   │ John Doe      │ @instagram    │ ฿2,450   │ 5      │ 8 days ago    │ [⋮]    │
│     │        │ 🔴 Hot        │ @facebook     │          │        │               │        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ [ ] │ [JS]   │ Jane Smith    │ @whatsapp     │ ฿5,800   │ 12     │ 45 days ago   │ [⋮]    │
│     │        │ 🟡 At-risk ⚠️ │               │          │        │               │        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ [ ] │ [MJ]   │ Mike Johnson  │ @line         │ ฿1,200   │ 2      │ 2 days ago    │ [⋮]    │
│     │        │ 🆕 New        │ @instagram    │          │        │               │        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Table Structure

| Column | Width | Sortable | Content |
|--------|-------|----------|---------|
| **Checkbox** | 40px | No | Multi-select checkbox |
| **Avatar** | 50px | No | 40×40px circle, initials |
| **Name + Tag** | 200px | Yes | Name (16px), Tag below (12px) |
| **Channel** | 150px | Yes | Icons + labels (@instagram, @whatsapp) |
| **LTV** | 120px | Yes | Currency format (฿X,XXX) |
| **Orders** | 80px | Yes | Order count (numeric) |
| **Last Purchase** | 150px | Yes | Date + relative time ("8 days ago") |
| **Actions** | 80px | No | 3-dot menu |

**Total Width:** ~830px content + padding

### Row Height: 80px (40px name + 40px tag/details)

### Row States:

**Default:**
- Background: White
- Border-bottom: 1px grey (`#E5E7EB`)

**Hover:**
- Background: Light grey (`#F9FAFB`)
- Slight shadow
- Actions menu visible (not hidden)

**Selected (Checkbox):**
- Background: Light blue/highlight
- Checkbox: Checked (blue checkmark)

**At-risk Row:**
- Left border: 2px orange (`#F59E0B`)
- Tag shown in red/orange

### Cell Styling:

**Name Cell:**
- Primary text: 16px, 500 weight, black
- Tag below: 12px, 400 weight
- Tag background: Segment color
- Tag text: White
- Tag padding: 4px 8px

**Action Menu (3-dot):**
- Icon: More vertical (⋮)
- On hover: Visible, highlight background
- On click: Popover with options (Chat, Orders, Follow-up, Edit, Delete)

---

## Component 3: Empty State (Desktop)

**When no customers:**
```
┌──────────────────────────────────────────┐
│                                          │
│         📭 No Customers Found            │
│                                          │
│       Add your first customer to get    │
│        started managing relationships    │
│                                          │
│         [+ Add New Customer]             │
│                                          │
└──────────────────────────────────────────┘
```

---

## Desktop Page Layout (Complete)

```
┌────────────────────────────────────────────────────────────────┐
│ [🔍 Search...] [Segment: Hot (12) ▼] [⚙️ More]               │
├────────────────────────────────────────────────────────────────┤
│ [☐] │ Avatar │ Name    │ Channel  │ LTV    │ Orders │ Last │ Actions │
├────────────────────────────────────────────────────────────────┤
│ [☑] │ [JD]   │ John    │ @ig, @fb │ ฿2,450 │ 5      │ 8d   │ [⋮]    │
│     │        │ 🔴 Hot  │          │        │        │      │        │
├────────────────────────────────────────────────────────────────┤
│ [ ] │ [JS]   │ Jane    │ @wa      │ ฿5,800 │ 12     │ 45d  │ [⋮]    │
│     │        │ 🟡 Risk │          │        │        │      │        │
├────────────────────────────────────────────────────────────────┤
│ [ ] │ [MJ]   │ Mike    │ @line    │ ฿1,200 │ 2      │ 2d   │ [⋮]    │
│     │        │ 🆕 New  │          │        │        │      │        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📊 Showing 3 of 127 customers | ⬇️ Scroll for more           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

FAB: Bottom-right corner (soft shadow)
┌─────┐
│  +  │ Add New Customer
└─────┘
```

---

# 🎬 PAGE 4: Components Library

Create Figma components for reusability:

## Mobile Components

1. **MobileCustomerCard**
   - Variants: Default, Hot, AtRisk, New, VIP, Loyal, Cold
   - States: Default, Hover, Active, Disabled
   - Interactive: Swipe reveal, quick edit popover

2. **SegmentButton**
   - Variants: Hot, AtRisk, New, VIP, Loyal, Cold, All
   - States: Active, Inactive, Hover

3. **ActionButton**
   - Variants: Primary (Chat), Secondary (Orders), Urgent (Follow-up)
   - States: Default, Hover, Active, Disabled

## Desktop Components

1. **TableRow**
   - Variants: Default, AtRisk, Selected
   - States: Hover, Active

2. **TableHeader**
   - Sortable column headers with arrow indicators

3. **ActionMenu**
   - 3-dot dropdown menu with options

4. **FilterChip**
   - Removable filter tag

5. **StatusBadge**
   - Segment tag/badge (reusable across all pages)

---

# 🎨 PAGE 5: Interactive Prototype

## Flows to Prototype

### Mobile Flows

1. **Segment Filtering**
   - Tap "Hot" segment → cards filter
   - Tap "All" segment → show all customers

2. **Card Interactions**
   - Tap card → navigate to Profile page
   - Long press → Quick Edit popover
   - Swipe left → reveal last message + timestamps
   - Swipe right → mark as followed up

3. **Add Customer (FAB)**
   - Tap + button → Bottom Sheet slides up
   - Form: Name (required), Phone, Email, Channel, Type
   - Tap Save → sheet closes, card appears in grid

4. **Bulk Follow-up (In Selection Mode)**
   - Swipe right to reveal checkboxes
   - Select multiple cards
   - Floating Action Bar appears: "Follow up with 3 customers"
   - Tap → Bottom Sheet: select message template + send

### Desktop Flows

1. **Table Sorting**
   - Click column header → sort ascending/descending
   - Icon changes: ↑ ascending, ↓ descending

2. **Row Hover Actions**
   - Hover row → background changes
   - 3-dot menu appears
   - Click menu → popover: Chat, Orders, Edit, Delete

3. **Row Selection**
   - Click checkbox → row highlights
   - Action Bar appears: "Follow up with X customers"

4. **Search & Filter**
   - Type in search → table updates in real-time
   - Click filter dropdown → segment changes
   - Click ⚙️ → Advanced filter popover opens

5. **Responsive Behavior**
   - Resize window from 1280px → 768px
   - Table transitions to card grid (or stays table, your choice)
   - Resize to 375px → table collapses to mobile card view

---

# ✅ Implementation Checklist

## Figma Setup
- [ ] Create design system page with all colors, typography, spacing
- [ ] Create variables for all colors and spacing
- [ ] Create text styles for typography
- [ ] Create mobile card component (main + variants)
- [ ] Create segment button component
- [ ] Create action button component
- [ ] Create desktop table row component
- [ ] Create status badge/tag component

## Mobile Page (375px)
- [ ] Search bar at top
- [ ] Segment button row (horizontally scrollable)
- [ ] 3–4 sample customer cards with different states
- [ ] At-risk card variant (orange border, red button)
- [ ] Hot card variant (red border)
- [ ] New card variant (blue border)
- [ ] FAB button (+) in bottom-right
- [ ] Empty state (no customers)
- [ ] Loading state (skeleton cards)

## Desktop Page (1280px)
- [ ] Search + filter bar at top
- [ ] Full data table with 6+ columns
- [ ] 5–10 sample rows showing different states
- [ ] Row hover states
- [ ] At-risk row variant (left orange border)
- [ ] Selected row state (checkbox checked, highlight)
- [ ] Empty state
- [ ] Loading state (skeleton rows)
- [ ] Responsive: Show how table adapts

## Tablet Page (768px)
- [ ] Option A: Table with 3–4 visible columns
- [ ] Option B: 2-column card grid
- [ ] Search + filter bar

## Component Library Page
- [ ] All components exported as Figma components
- [ ] Each component has variants (states, sizes, themes)
- [ ] Main + detail views documented

## Interactive Prototype
- [ ] Mobile segment filtering flow
- [ ] Mobile card tap → Profile page
- [ ] Mobile add customer FAB → Bottom Sheet
- [ ] Desktop column sorting
- [ ] Desktop row hover → actions menu
- [ ] Responsive transition: Desktop → Tablet → Mobile

---

# 🚀 Build Instructions

### Step 1: Create Base Frames
1. New file or use existing Onebear file
2. Create 4 pages: Design System, Mobile, Desktop, Tablet
3. Mobile frame: 375×812px (iPhone 12)
4. Desktop frame: 1280×800px (standard viewport)
5. Tablet frame: 768×1024px

### Step 2: Design System (Page 1)
- Set up color swatches
- Create typography styles
- Document spacing tokens
- Create component library frames

### Step 3: Mobile Cards (Page 2)
- Create main card frame (343×140px)
- Add all cell content (avatar, name, tag, stats, buttons)
- Duplicate card 3× times for variants
- Create "Hot," "AtRisk," "New" variants
- Group cards into a scrollable frame
- Add segment buttons at top
- Add FAB at bottom-right

### Step 4: Desktop Table (Page 3)
- Create table frame (1232×auto)
- Build header row with column labels
- Build data row (80px height)
- Duplicate row 8+ times with different data
- Create "At-risk" row variant
- Add search + filter bar at top
- Add empty/loading states

### Step 5: Tablet (Page 4)
- Copy desktop table OR
- Create 2-column card grid (same as mobile, but wider)

### Step 6: Create Components
- Select card frame → Create component
- Set up variants: Status (Hot, AtRisk, New, VIP, Cold, Loyal)
- Do same for buttons, tags, rows
- Create main components in library page

### Step 7: Build Prototype
- Go to Prototype tab
- Connect flows: Card tap → Profile page
- Connect: FAB tap → Add Customer flow
- Connect: Table row hover → Actions menu
- Connect: Segment button tap → Filter cards
- Test interactions

---

# 📚 Resources

- **Figma Plugins:** Figma Variables, Auto Layout, Tokens Studio
- **Icon Library:** Heroicons, Lucide (SVG imports)
- **Color Reference:** https://tailwindcss.com/docs/customizing-colors
- **Typography:** Use Inter (free, Google Fonts)

---

**Next Step:** Open Figma, follow the checklist above, and build it out. Happy designing! 🎨
