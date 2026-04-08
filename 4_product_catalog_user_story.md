# 4. Product Catalog — User Story

**Status**: Ready for Review
**Priority**: 🟠 High (Enables AI to sell + order creation)
**Target Users**: Shop admins, managers, product managers
**Primary Device**: Desktop (80%), Mobile (20%)
**Goal**: Manage product inventory, enable AI to recommend & sell, track variants & relationships

---

## Feature Overview

**Product Catalog** is where you manage all products your shop sells. Add products once, and AI uses this data to:
- Answer customer questions ("ราคาเท่าไหร่")
- Recommend products ("ลองสินค้านี้ดู")
- Create orders with correct price + stock
- Suggest upsells and cross-sells

**Key Value**: Better AI recommendations = more sales. Real-time stock sync = accurate orders.

---

## User Personas & Goals

### Persona 1: Solo Seller (Primary)
- Has 5-50 products
- Adds products manually (fast form)
- Updates stock manually
- **Goal**: Quick product setup, let AI handle the rest

### Persona 2: Store Manager (Secondary)
- Manages 50-500 products
- Imports via CSV (bulk upload)
- Tracks stock across channels
- **Goal**: Bulk operations, stock management, upsell strategy

### Persona 3: Product Manager (Advanced)
- Complex product variants (colors, sizes)
- A/B testing different variants
- Upsell/cross-sell optimization
- **Goal**: Detailed product relationships, variant testing

---

## Business Value

| Metric | Target | Impact |
|--------|--------|--------|
| **Product accuracy** | 100% correct price in AI | No order errors |
| **Upsell adoption** | > 30% of orders include upsell | Higher AOV |
| **Stock accuracy** | Real-time sync with channels | No overselling |
| **AI confidence** | > 80% product questions answered | Fewer handoffs |
| **Catalog completeness** | 100% products have images | Professional appearance |

---

## Feature Flow

### 1. Adding Products

#### Method A: Manual Add (Single Product)

**UI Flow**:
```
[+ Add Product] button (Top-right)
    ↓
Opens Side Panel or Page:

BASIC INFO (Required):
  [ ] Product Name: [_________________]
  [ ] Category: [Choose: ▼] (Clothing / Beauty / Electronics / etc.)
  [ ] Price: [฿________]

OPTIONAL INFO:
  [ ] Description: [________________]
  [ ] Stock: [________] (If blank = unlimited)
  [ ] Image: [Upload] or [Use URL]
  [ ] Status: [🟢 Active / 🔴 Inactive]

VARIANTS (Optional):
  [ ] Add Variant: [+ Add size/color/option]
  [ ] Size: Small / Medium / Large (Each has own stock)
  [ ] Color: Red / Blue / Green

RELATIONSHIPS (Optional):
  [ ] Upsell to: [Select product...]
  [ ] Cross-sell: [Select product...]

[Save] [Cancel]
```

**Validation**:
- ✅ Name: Required, max 200 chars
- ✅ Price: Required, number only, > 0
- ✅ Category: Required (or create new)
- ✅ Image: Optional but encouraged (show warning if missing)
- ✅ Stock: Optional (if blank = unlimited)

**On Save**:
- ✅ Show toast: "✅ Product added!"
- ✅ New product appears in list immediately (Optimistic UI)
- ✅ If API fails → Roll back + show error

---

#### Method B: Bulk Import (CSV)

**CSV Template Download**:
```
[📥 Import CSV]
  → Shows template download

Template columns:
  Name | Category | Price | Stock | Description | Image URL | Upsell | Cross-sell

Example row:
  "T-Shirt A" | "Clothing" | "199" | "50" | "Blue cotton" | "https://..." | "T-Shirt Premium" | "Shorts B"
```

**Import Flow**:
```
1. Click [📥 Import CSV]
2. Upload file or paste CSV data
3. System validates:
   ✅ All required fields present
   ✅ Prices are valid numbers
   ✅ Categories exist or can be created
   ✅ Products don't duplicate (by name)
4. Show Preview:
   "Ready to import 45 products?
    ☐ 40 new
    ☐ 5 updates to existing
    [Import] [Cancel]"
5. Confirm → Import in background
6. Show progress: "Importing... 15/45 products"
7. Success: "✅ 45 products imported!"
8. Show summary:
   - New: 40
   - Updated: 5
   - Errors: 0
   - [View all] [Download error report]
```

**Rules**:
- ✅ Dry-run before actual import (preview + validate)
- ✅ Show errors clearly (which rows failed + why)
- ✅ Allow partial import (skip failed rows)
- ✅ Create new categories automatically if referenced
- ✅ Existing products updated if name matches

---

### 2. Product List View

**Layout** (Desktop):
```
┌────────────────────────────────────────────────────────────────────────┐
│ 📦 Products                    [+ Add] [📥 Import CSV] [⚙️ Manage]     │
├────────────────────────────────────────────────────────────────────────┤
│ Category: [All ▼]  Search: [________]  [🟢 Active] [🔴 Inactive] [All]│
├────────────────────────────────────────────────────────────────────────┤
│ [☐] Image  Name              Category    Price   Stock   Status  Actions│
├────────────────────────────────────────────────────────────────────────┤
│ [☐] [IMG] T-Shirt A         Clothing   ฿199     50     🟢 Active [•••]│
│     [Edit] [Upsell] [AI Suggest]                                      │
├────────────────────────────────────────────────────────────────────────┤
│ [☐] [IMG] Shoes B           Clothing   ฿999     0      🔴 Out Stock  │
│     [Edit] [Upsell] [AI Suggest]                                      │
├────────────────────────────────────────────────────────────────────────┤
│ [☐] [IMG] Perfume C         Beauty     ฿1,299   15     🟢 Active [•••]│
│     [Edit] [Upsell] [AI Suggest]                                      │
└────────────────────────────────────────────────────────────────────────┘
Total: 127 products | Showing 3 per page
[< Previous] [1] [2] [3] [Next >]
```

**Columns** (Sortable):
- Checkbox (multi-select)
- Image (thumbnail)
- Name
- Category
- Price (sortable)
- Stock (sortable, shows 0 in red)
- Status (Active / Inactive)
- Actions menu (Edit, Duplicate, Deactivate, Delete)

**Filtering**:
- ✅ By category
- ✅ By status (Active / Inactive)
- ✅ Search by name
- ✅ Show out-of-stock first option

---

### 3. Product Details & Variants

**Edit Product**:
```
Product: T-Shirt A
├─ Basic Info
│   Name: T-Shirt A
│   Category: Clothing
│   Price: ฿199
│   Description: [Blue cotton, comfortable]
│   Image: [IMG] [Change]
│   Status: 🟢 Active [Toggle]
│
├─ Variants (Optional)
│   [+ Add Variant]
│   Variant Type: Size
│   ├─ Small (Stock: 10)
│   ├─ Medium (Stock: 20)
│   └─ Large (Stock: 20)
│   [Add another variant type]
│   Variant Type: Color
│   ├─ Blue (Stock: 30)
│   └─ Red (Stock: 20)
│
├─ Relationships
│   Upsell to: [T-Shirt Premium] [Remove]
│   Cross-sell: [Shorts B] [Socks C] [+ Add more]
│
├─ AI Actions
│   [🤖 AI Suggest Upsell] [🤖 AI Suggest Cross-sell]
│
[Save] [Cancel] [Delete]
```

**Variant Logic**:
- ✅ Each variant has own stock counter
- ✅ Total stock = sum of all variants
- ✅ Can have 2 variant types (Size + Color)
- ✅ Each combination tracked separately

**Example**:
```
Product: T-Shirt
├─ Size: Small (Stock: 10) + Color: Blue (Stock: 5)
│   → "Small Blue T-Shirt" has 5 in stock
├─ Size: Small + Color: Red (Stock: 3)
│   → "Small Red T-Shirt" has 3 in stock
└─ Size: Large + Color: Blue (Stock: 10)
    → "Large Blue T-Shirt" has 10 in stock
```

---

### 4. Upsell & Cross-Sell Relationships

#### Manual Setup:
```
Edit Product: T-Shirt A (฿199)
    ↓
Upsell to: [Select product ▼]
  → Pick: "T-Shirt Premium" (฿399)
  → Why: "Better quality, not too much higher price"
  → [Save]

Cross-sell: [Select products ▼]
  → Pick: "Shorts B" (฿249) + "Socks C" (฿49)
  → Why: "Goes well together"
  → [Save]
```

**Rules**:
- ✅ Upsell = max 3 per product (better/alternative products, AI picks best match)
- ✅ Cross-sell = max 3 per product (complementary items)
- ✅ Bidirectional: Link A→B auto-creates B→A for cross-sells (unless manual override)
- ✅ Price rule: Admin sets per-product `upsell_max_price` cap (AI enforces, no hard 50% rule)
- ✅ Custom pricing: Can offer different price for each relationship (discount or premium)

#### Manual Setup with Custom Pricing:
```
Edit Product: T-Shirt A (฿199)
    ↓
Upsell to: [Select product ▼]
  → Pick: "T-Shirt Premium" (Original price: ฿399)
  → Upsell price: [฿399] ← Can adjust!
    Examples:
    - ฿349 (offer discount on upsell)
    - ฿399 (full price)
    - ฿449 (premium price)
  → [Save]

Cross-sell: [Select products ▼]
  → Pick: "Shorts B" (Original: ฿249)
  → Cross-sell price: [฿249] ← Can adjust!
  → Pick: "Socks C" (Original: ฿49)
  → Cross-sell price: [฿39] ← Offer bundle discount!
  → [Save]
```

#### AI Suggest Upsell/Cross-sell:
```
Button: [🤖 AI Suggest Upsell]
  ↓
AI analyzes:
  - Product name similarity
  - Category relationship
  - Price difference

Shows: "Here are 3 suggested upsells:
  1. T-Shirt Premium (฿399 → suggested: ฿349) - 90% confidence
  2. T-Shirt Deluxe (฿599 → suggested: ฿499) - 75% confidence
  3. Polo Shirt (฿349) - 60% confidence
  [Approve 1] [Approve 2] [Reject All]"

User approves → Relationship created with AI-suggested price
Can edit price afterward if needed
```

**Rules**:
- ✅ Upsell/Cross-sell price optional (default = original product price)
- ✅ Can set custom price per relationship (different prices for different contexts)
- ✅ AI suggests price based on market analysis
- ✅ Manager can accept or adjust AI price
- ✅ User can approve, reject, or ignore (try again later)
- ✅ Approved → auto-linked bidirectional with custom prices
- ✅ AI re-suggests after 7 days if rejected

---

### 5. Stock Management

**Real-time Stock Tracking**:
```
Product: T-Shirt A (Variant: Small Blue)
  Stock in Onebear: 10 units
  Pending orders: 3 units (in checkout)
  Available for order: 7 units

If customer tries to order 10:
  ✅ "Available: 7, but you ordered 10"
  → Auto-suggest: "Order 7 instead?" or "Backorder?"
```

**Pre-order Toggle**:
```
Edit Product: New Release T-Shirt
  ├─ Basic Info
  │   Stock: [-5] ← Negative stock allowed!
  │   ☐ Allow pre-order ✅ (checked)
  │     "Negative stock means pre-orders"
  │   Description: "Available 30 days from now"
  │
  └─ Stock Label: "Pre-order available"
     (Shows on product listing)
```

**Stock Update Methods**:

1. **Manual Update**:
   ```
   Click product → Edit
   Stock: [10] ← change to [5] or [-3] (if pre-order enabled)
   [Save]
   Instant update ✅
   ```

2. **Via Variant Breakdown**:
   ```
   Edit variants:
   Small Blue: [10] → [5]
   Total updates automatically
   ```

3. **Bulk Import (CSV)**:
   ```
   Update via CSV re-import
   Name, Stock, PreOrder
   T-Shirt A, 5, no
   New Release Shirt, -10, yes
   → Updates instantly
   ```

**Rules**:
- ✅ Stock can be 0 (out of stock)
- ✅ Stock can be NEGATIVE if "Allow pre-order" checked ✅
- ✅ If "Allow pre-order" unchecked → stock cannot go below 0
- ✅ Out-of-stock products still visible (marked 🔴)
- ✅ Pre-order products show "Pre-order available" label
- ✅ AI can recommend but shows "Pre-order, ships 30 days"
- ✅ No automatic stock deduction (manual or 3rd-party sync)

---

### 6. Product Status: Active vs Inactive vs Delete

**Active Status** 🟢:
- ✅ Shown in AI recommendations
- ✅ Can be ordered
- ✅ Visible in product list

**Inactive Status** 🔴:
- ✅ Hidden from AI recommendations
- ✅ Cannot be ordered (but show "Currently unavailable")
- ✅ Still visible in product list with 🔴 badge
- ✅ Can be reactivated anytime

**Delete**:
- ❌ Permanent removal (careful!)
- ❌ Data loss
- ✅ Show warning: "Delete 'T-Shirt A'? This cannot be undone."
- ✅ Better: Use Inactive instead of Delete

**Rules**:
- ✅ Default: Deactivate, don't delete
- ✅ Deactivated products keep their history
- ✅ Can reactivate without losing relationships

---

## Acceptance Criteria

### Add Product (Manual)
- [ ] Form has: Name, Category, Price (required)
- [ ] Optional fields: Description, Stock, Image, Status
- [ ] Name validation: max 200 chars
- [ ] Price validation: number > 0
- [ ] Category: dropdown with existing + "Create new"
- [ ] Image: upload or URL
- [ ] Stock: number only or blank (unlimited)
- [ ] Status toggle: Active / Inactive
- [ ] Save button enabled (never disabled)
- [ ] On save: Toast "✅ Product added" + appears in list immediately
- [ ] Cancel returns to list without saving

### Import CSV
- [ ] CSV template downloadable
- [ ] Columns supported: Name | Category | Price | Stock | Description | Image URL | Upsell 1-3 | Cross-sell 1-3
- [ ] Drag-drop or click to upload
- [ ] Show dry-run preview before import (validates all rows)
- [ ] Display errors clearly (which rows, why)
- [ ] Allow partial import (skip invalid rows, import valid ones)
- [ ] Auto-create missing categories
- [ ] Link upsells/cross-sells by product name (case-insensitive)
- [ ] Skip relationship if product not found (no error, just skip link)
- [ ] Import progress shown in real-time
- [ ] Success summary: Created / Updated / Skipped
- [ ] Error report downloadable with details

### Product List
- [ ] Display all columns: Image, Name, Category, Price, Stock, Status
- [ ] Sortable: Name, Price, Stock
- [ ] Filterable: Category, Status, Active/Inactive
- [ ] Search by product name
- [ ] Thumbnail images display
- [ ] Out-of-stock shown in red (Stock: 0)
- [ ] Inactive products show 🔴 badge
- [ ] Pagination or lazy-load
- [ ] Checkbox multi-select
- [ ] Actions menu: Edit, Duplicate, Deactivate, Delete

### Variants
- [ ] Add up to 2 variant types
- [ ] Each variant has own stock
- [ ] Total stock = sum of variants
- [ ] Each combination displayed
- [ ] Can edit variant names/stock
- [ ] Can delete variant (move stock elsewhere)

### Upsell & Cross-sell
- [ ] Manual link: select from dropdown (max 3 upsells, max 3 cross-sells)
- [ ] Bidirectional link created (for cross-sells)
- [ ] Can set custom price for upsell/cross-sell (optional)
- [ ] Default price = original product price (if not customized)
- [ ] AI Suggest button available
- [ ] Show AI confidence % on suggestions
- [ ] AI suggests price based on market analysis
- [ ] Can approve, reject, or adjust AI price
- [ ] Can approve/reject each suggestion
- [ ] Approved links visible immediately with custom prices
- [ ] Can edit custom prices after creating relationship
- [ ] Can edit sort_order (drag-to-reorder for AI preference ranking)
- [ ] Can remove links anytime
- [ ] Cannot exceed max 3 upsells or 3 cross-sells (validation error)

### Stock Management
- [ ] Manual stock edit on product page
- [ ] Stock updates immediately
- [ ] "Allow pre-order" checkbox available
- [ ] If pre-order checked → stock CAN go negative (-5, -10, etc.)
- [ ] If pre-order unchecked → stock cannot go below 0
- [ ] Out-of-stock products still visible
- [ ] Pre-order products show "Pre-order available" label
- [ ] Variant stock tracked separately
- [ ] Total stock calculated correctly
- [ ] CSV import supports pre-order flag (PreOrder column: yes/no)

### Status & Deletion
- [ ] Toggle Active/Inactive (no warning)
- [ ] Inactive products hidden from AI
- [ ] Delete shows warning: "Cannot undo"
- [ ] Can reactivate inactive product
- [ ] Product history preserved after deactivation

### Mobile UX
- [ ] List readable without zoom
- [ ] [+ Add] button accessible
- [ ] Search/filter on mobile
- [ ] Edit form mobile-friendly
- [ ] Image upload works on mobile

### Search & Filter
- [ ] Search by product name (real-time)
- [ ] Filter by category dropdown
- [ ] Filter by status (Active/Inactive/All)
- [ ] Show "No products" if filters result empty
- [ ] Clear filters button

---

## Key User Flows

### Happy Path: Add First Product
```
1. Click [+ Add Product]
2. Name: "T-Shirt A"
3. Category: "Clothing"
4. Price: "199"
5. Stock: "50"
6. Image: Upload
7. Click [Save]
8. ✅ Appears in list
9. AI can now recommend it
```

### Import 100 Products
```
1. Click [📥 Import CSV]
2. Download template
3. Fill in 100 rows (in Excel)
4. Upload CSV
5. Preview: "100 products ready?"
6. Click [Import]
7. Progress: "Importing... 50/100"
8. Success: "✅ 100 imported!"
```

### Set Up Upsell
```
1. Edit "T-Shirt A" (฿199)
2. Upsell to: Select "T-Shirt Premium" (฿399)
3. AI confidence: 90%
4. Save
5. When customer orders T-Shirt A, AI suggests Premium
```

### Deactivate Out-of-Stock
```
1. Edit "Shoes B" (Stock: 0)
2. Status: Toggle to 🔴 Inactive
3. Save
4. Shoes B hidden from AI
5. Still visible in catalog as "🔴 Currently unavailable"
6. Can reactivate later
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|---|
| **Product with 0 stock** | Show "🔴 Out of stock" but still visible |
| **Variant stock = 0** | That variant unavailable, others still orderable |
| **Pre-order product with -10 stock** | Show "Pre-order available" label, allow ordering |
| **Toggle pre-order OFF on negative stock product** | Show warning "Stock is negative, enable pre-order or reset" |
| **CSV has unknown category** | Auto-create category with default settings |
| **Duplicate product in CSV** | Use existing product, update data |
| **Custom upsell price < 50% original** | Allow with no warning (discount is ok) |
| **Custom upsell price exceeds upsell_max_price cap** | Show warning, disable Add button until adjusted |
| **Upsell to same product** | Show warning "Cannot upsell to itself" |
| **Delete product with past orders** | Order history preserved, product marked deleted |
| **Reactivate inactive product** | All relationships restored with custom prices |
| **AI suggests product that was deleted** | Skip in recommendations |
| **Image upload fails** | Show warning, allow product without image |
| **Very long product name (500+ chars)** | Truncate at 200 chars |

---

## Integration with Other Features

| Feature | Integration | Impact |
|---------|---|---|
| **AI Sales Agent** | AI reads catalog to recommend | Must be complete & accurate |
| **Inbox & Chat** | "What's the price of T-Shirt?" → AI checks catalog | Real-time pricing |
| **Order Management** | Order uses product price + stock from catalog | No manual pricing errors |
| **CRM** | Product history shown in customer profile | Track what they bought |
| **Upsell/Cross-sell** | AI uses relationships to suggest | Higher AOV |

---

## Success Metrics

| Metric | Target | Check Period |
|--------|--------|---|
| **Catalog completeness** | 100% products have images | Weekly |
| **Upsell setup rate** | > 50% of products have upsell | Monthly |
| **Stock accuracy** | Real-time, no overselling | Ongoing |
| **AI confidence** | > 85% product questions answered | Weekly |
| **CSV import adoption** | > 60% of new products via import | Monthly |
| **Out-of-stock handling** | < 2% of orders oversold | Weekly |

---

## Confirmed Specifications

✅ **All features reviewed and locked in. Matches Product Catalog Spec v1.0**

**Clarifications Applied:**

1. ✅ **Custom pricing for upsell/cross-sell** — YES, custom_price field added to relations tables
   - Managers can discount upsells (e.g., ฿399 → offer at ฿349)
   - Can bundle cross-sells at discount rates

2. ✅ **Pre-order behavior** — Implicit (negative stock allowed)
   - NO separate `allow_pre_order` flag
   - Admin enters negative stock directly (e.g., -5, -10)
   - AI shows "Pre-order available" for negative stock products

3. ✅ **CSV import with full column support** — YES
   - Columns: Name | Category | Price | Stock | Description | Image URL | Upsell 1-3 | Cross-sell 1-3
   - Supports importing relationships by product name
   - Dry-run preview before import
   - Partial import (skip invalid rows, import valid ones)

4. ✅ **Max upsells per product** — 3 (not 1)
   - Allows flexibility for AI to pick best match
   - Admin sets sort_order for preference ranking
   - AI scoring algorithm picks best based on context

5. ✅ **Max cross-sells per product** — 3 (confirmed)
   - Consistent with upsells limit
   - At most 2 offered per order by AI

6. ✅ **Product deactivation** — YES, keep history
   - Deactivate instead of delete
   - Reactivate anytime without losing relationships
   - Custom prices preserved

---

## Implementation Notes

**Spec Document Location:**
- Main spec: `product-catalog-designer/spec_product_catalog_complete.md`
- Clarification updates: `SPEC_UPDATES_CLARIFICATIONS.md`

**Key Tables in Database:**
- `products` (with upsell_max_price)
- `product_variants`
- `product_images`
- `product_upsells` (with custom_price field) — MAX 3 per product
- `product_cross_sells` (with custom_price field) — MAX 3 per product
- `ai_product_relation_suggestions`

**API Endpoints Summary:**
- CRUD products, images, variants
- Create/update/delete upsells & cross-sells with custom pricing
- Bulk import: `POST /products/import` with CSV validation & dry-run
- AI suggestions: approve/reject with permanent rejection memory

**UI/UX Ready For:**
- ✅ Product list (table with sorting/filtering)
- ✅ Product detail form (basic info, variants, upsells, cross-sells)
- ✅ Image gallery (multi-upload with reordering)
- ✅ CSV import modal (preview → import → results)
- ✅ Agent/Staff read-only access

---

## Ready for Development

**Status:** ✅ **SPECIFICATION COMPLETE & LOCKED**

This feature is ready to assign to backend and frontend teams. All ambiguities resolved. Spec includes:
- 6 database tables with constraints
- 20+ API endpoints with error codes
- AI selection algorithm (4-factor scoring)
- Role-based access control
- Edge case handling

**Next Step:** Assign to development team. Expected timeline: 2-3 weeks (backend + frontend)
