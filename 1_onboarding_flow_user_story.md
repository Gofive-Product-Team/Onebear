# 1. Onboarding Flow — User Story

**Status**: Updated with feedback + GAP 37–40 locked decisions incorporated
**Priority**: 🔴 Critical (First feature users experience)
**Target Users**: New shop owners, first-time Onebear users
**Primary Device**: Mobile (smartphone)
**Time Target**: < 5 minutes (fast + simple)

---

## Feature Overview

The **Onboarding Flow** is a guided 3-step setup experience that gets new sellers ready to use Onebear in **~5 minutes**. After onboarding, users see their first incoming chat in Inbox immediately.

**Goal**: Get to first chat → AI ready → dashboard active in under 5 minutes.

---

## User Personas & Goals

### Persona 1: Solo Seller (Primary)
- Manages 1 Instagram + 1 Facebook account
- Sells via social media DMs only
- Works on smartphone exclusively
- Limited technical knowledge
- **Goal**: Connect channel → see chat → start selling

### Persona 2: Growing Store Owner (Secondary)
- Manages multiple channels (LINE, Facebook, Instagram)
- Already selling but needs organization
- Works mostly on mobile
- **Goal**: Connect all channels → AI ready → start receiving orders

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **Onboarding completion rate** | > 90% | More users = more revenue |
| **Time to first chat** | < 3 min | Speed = engagement |
| **AI adoption** | 80%+ (default ON) | AI-assisted orders = higher AOV |
| **7-day return rate** | > 70% | Fast success = retention |

---

## 3-Step Feature Flow

### Step 1: Connect Channel (REQUIRED)

**Time**: 2-3 minutes

```
Screen 1: "เลือกช่องทางของคุณ"
    ┌─────────────────────────────────┐
    │ 🔗 เชื่อมต่อช่องทาง             │
    │                                  │
    │ [ 📱 LINE ]  [ 👥 Facebook ]   │
    │ [ 📷 Instagram ] [ 💬 WhatsApp] │
    │ [ 🛍️ Lazada ]                   │
    │                                  │
    │ [ถัดไป] ← disabled until 1+ connected
    └─────────────────────────────────┘

Screen 2: OAuth Login
    → User taps channel → redirects to Platform OAuth
    → "อนุญาตให้ Onebear เข้าถึง [Platform]?"
    → User grants permission → returns to app
    → Show checkmark: "✅ [Channel Name] เชื่อมต่อสำเร็จ"

Screen 3: Verify with Test Message
    → Show: "📬 ส่งข้อความทดสอบให้เรา"
    → User sends 1 test message from that channel's app
    → Message appears in Inbox in real-time
    → "ดี! ขอบคุณ ✅"
    → Option: "เชื่อมต่อช่องทางอื่น?" [เพิ่มเติม] [ถัดไป]
```

**Rules**:
- ✅ At least 1 channel required (cannot skip)
- ✅ Max 5 channels in onboarding
- ✅ Test message must arrive within 60 seconds
- ✅ Channel already connected elsewhere → "ช่องทางนี้ใช้ร้านอื่น"
- ✅ If test message late → Hint: "ลองส่ง DM จากแอปจริง"

---

### Step 2: AI Agent Ready (AUTO-ENABLED + SAMPLE PRODUCT)

**Time**: 30 seconds – 2 minutes (depending on product entry)

```
Screen 1: "🤖 AI ของคุณพร้อม"
    ┌─────────────────────────────────┐
    │ AI จะตอบแชท 24/7 ให้คุณ          │
    │ ✅ เปิดใช้งานอยู่                │
    │                                  │
    │ "เราสร้างสินค้าตัวอย่างให้"      │
    │ 📦 [ของขวัญตัวอย่าง]            │
    │    ฿99 | มีสต็อก 100            │
    │                                  │
    │ "เพิ่มสินค้าจริงได้เลย:"         │
    │ [+ เพิ่มสินค้า] [นำเข้า CSV]    │  ← GAP 40: CSV available here
    │                                  │
    │ "คุณแก้ไขหรือเพิ่มสินค้า          │
    │  ได้ทีหลังใน Settings"           │
    │                                  │
    │                    [ถัดไป]       │  ← GAP 39: Save happens on tap
    └─────────────────────────────────┘

Screen 2: CSV Import Modal (if tapped [นำเข้า CSV])
    ┌─────────────────────────────────┐
    │ นำเข้าสินค้าจากไฟล์              │
    │                                  │
    │ [เลือกไฟล์ .csv]                │
    │                                  │
    │ ดาวน์โหลดตัวอย่าง CSV            │
    │                                  │
    │      [ยกเลิก]  [นำเข้า]         │
    └─────────────────────────────────┘
    → On import success: products listed in Step 2
    → All products committed when user taps [ถัดไป]
```

**Rules**:
- 🤖 AI ON by default (no toggle, just explain it's active)
- 📦 If user has 0 products → auto-create 1 sample product
  - Name: "[ของขวัญตัวอย่าง]"
  - Category: "General"
  - Price: ฿99
  - Stock: 100 units
- 📦 If user already has products → skip sample, just confirm AI is on
- Sample product can be edited/deleted anytime
- This builds confidence: "AI has something to work with"
- [GAP 39] Products are NOT saved until user taps [ถัดไป] — explicit save only. No auto-save mid-step.
- [GAP 40] CSV import button is visible and active in Step 2. Users can import products via CSV OR add manually.
- [GAP 37] If user skips adding real products (keeps only sample or adds nothing): AI capability is degraded — AI can answer general FAQ but cannot close orders (no pricing, no checkout flow).
  - AI flag state: `can_answer_faq` = true, `can_close_orders` = false
  - This state persists until owner adds at least 1 real product via Settings or Products catalog

---

### Step 3: Dashboard (Done! 🎉)

**Time**: 30 seconds

```
Screen 1: Success
    ┌─────────────────────────────────┐
    │ เรียบร้อย! 🎉                   │
    │                                  │
    │ ร้านคุณพร้อมแล้ว                │
    │                                  │
    │        [เข้าไปใช้งาน]            │
    └─────────────────────────────────┘

Screen 2: Dashboard
    → Show real KPI data:
        - ยอดขายวันนี้: ฿0 (none yet)
        - ออเดอร์รอชำระ: 0
        - แชทที่ยังไม่ตอบ: X
    → Show Inbox with incoming messages
    → Navigation buttons (clear labels)

Screen 3: Inline Tutorial #1 (appears 3 seconds later)
    → Position: Bottom-right corner, small popup
    → Title: "💡 เพิ่มเติมหน่อย"
    → Copy: "อยากตั้งค่าทีมหรือ Payment ไหม?"
    → Buttons: [ไปที่ Settings] [ข้าม]
    → Click [ไปที่ Settings] → Opens with team section highlighted
    → Click [ข้าม] → Popup closes, doesn't show again for this admin
    → Only shown ONCE per admin (tracked in app)
```

**Rules**:
- Dashboard shows REAL data (never fake/sample)
- Inline tutorials appear only on first dashboard visit
- One popup at a time (not annoying)
- Users can dismiss by clicking X or [ข้าม]
- Once dismissed, never shows again for that admin
- Tutorial sequence (spread across visits):
  1. Settings/Team
  2. Payment Configuration
  3. Product Catalog
  4. Follow-up (optional)

---

## Key User Flows

### Happy Path (Solo Seller, ~4 minutes)
```
1. Sign up / Login
2. Onboarding launches automatically
3. Select Instagram → OAuth → Grant → Test message → ✅ [Instagram connected]
4. Click "ถัดไป"
5. See: "AI ของคุณพร้อม" + Sample product
6. Click "ถัดไป"
7. Dashboard loads with real inbox data
8. See tutorial popup: "อยากตั้งค่าทีม?"
9. Click "ข้าม"
10. Done! Ready to respond to customers 🎉
```

### Multi-channel Seller (~5 minutes)
```
1. Connect Facebook → Test → Success
2. "เชื่อมต่อเพิ่มเติม?" → [เพิ่มเติม]
3. Connect Instagram → Test → Success
4. Connect LINE → Test → Success
5. "มีอีกหรือไม่?" → [ถัดไป]
6. AI Ready screen
7. Dashboard
8. Done!
```

### Already Has Products
```
1. Connect channel
2. AI Ready screen shows: "✅ AI พร้อม" (no sample product)
3. Your existing products shown instead
4. Dashboard
5. Done!
```

---

## Acceptance Criteria

### Core Flow
- [ ] User selects channel → OAuth → Returns to app
- [ ] After OAuth, channel shows checkmark ✅
- [ ] Requires minimum 1 channel to proceed
- [ ] At least 1 channel required; [ถัดไป] button disabled until connected
- [ ] Test message sent from actual channel app appears in Inbox < 10 sec
- [ ] AI automatically enabled (no toggle, just shows "✅ เปิดใช้งาน")
- [ ] If 0 products: Sample product auto-created
- [ ] If products exist: Sample NOT created
- [ ] Sample product editable/deletable by user
- [ ] Dashboard loads with REAL data (no fake numbers)
- [ ] First tutorial popup appears 3 seconds after dashboard loads
- [ ] Tutorial dismissible by X or [ข้าม] button
- [ ] Once dismissed, tutorial never shows again

### Mobile UX
- [ ] All screens fit mobile without scrolling
- [ ] Button tap targets: minimum 44×44px
- [ ] Text readable at 16px (no zoom needed)
- [ ] Keyboard doesn't cover input fields
- [ ] OAuth redirect returns correctly

### Timing
- [ ] Step 1: 2-3 minutes
- [ ] Step 2: 30 seconds
- [ ] Step 3: 30 seconds
- [ ] **Total**: < 5 minutes (average user)

### Data & Logic
- [ ] Workspace created with Super Admin role
- [ ] Default timezone: Asia/Bangkok
- [ ] Default language: Thai
- [ ] Audit log: "Workspace created"
- [ ] Audit log: "Channel [X] connected"
- [ ] Sample product created if none exist
- [ ] Tutorial shown only once per admin
- [ ] [GAP 37] AI flags set correctly: `can_answer_faq` = true, `can_close_orders` = false when no real products added
- [ ] [GAP 37] AI flags update to `can_close_orders` = true when first real product is added (post-onboarding)
- [ ] [GAP 38] Onboarding state cleared after 2 hours of inactivity
- [ ] [GAP 38] User returning after state clear is routed to Step 1 with re-auth required
- [ ] [GAP 39] Products entered in Step 2 are committed to DB only when [ถัดไป] is tapped; no partial saves
- [ ] [GAP 40] CSV import modal functional in Step 2; imported products appear in product list before [ถัดไป] is tapped

### Error Handling
- [ ] OAuth fails → "ไม่สามารถเชื่อมต่อ [Platform]" + [ลองอีกครั้ง]
- [ ] Network timeout → "หมดเวลา ลองอีกครั้ง"
- [ ] Channel already in use → "ช่องทางนี้ใช้อยู่ที่ [Shop Name]"
- [ ] Test message doesn't arrive → Hint after 60 sec
- [ ] Browser back during OAuth → No data loss, return to Step 1
- [ ] [GAP 38] User exits mid-onboarding and returns → restart from Step 1, require re-auth; onboarding state cleared after 2 hours inactivity

---

## What Changed (From Your Feedback)

| Item | Before | After | Why |
|------|--------|-------|-----|
| **Time** | 10 min | 5 min | Faster = better user perception |
| **AI Status** | Toggle (user decides) | Always ON | Remove friction, default to enabled |
| **Products** | "Add products" warning | Auto-create sample | Concrete, builds confidence |
| **Checklist** | Persistent banner | Inline tutorials | Less annoying, one popup at a time |
| **UI Language** | More formal | Shorter, casual Thai | More user-friendly |

---

## Post-Onboarding Support

### Inline Tutorials (Examples)
```
Popup 1: "💡 ต้องการตั้งค่าทีมหรือ?"
  Copy: "เชิญเพื่อนช่วยจัดการ"
  Button: [ไปที่ Settings]

Popup 2: "💡 ตั้งค่า Payment ถึงครบ?"
  Copy: "เพื่อให้ลูกค้าชำระง่ายขึ้น"
  Button: [ไปที่ Payment]

Popup 3: "💡 เพิ่มสินค้าเพิ่มเติม?"
  Copy: "ยิ่งมากสินค้า ยิ่งมีโอกาสขาย"
  Button: [ไปที่ Products]
```

### If Incomplete After 24h
- Email reminder: "ยังไม่เสร็จ? ต้องการช่วยเหลือหรือไม่"
- Link to Settings to finish setup

---

## Success Metrics

| Metric | Target | Check |
|--------|--------|---|
| Onboarding completion | > 90% | Weekly |
| Avg time | < 5 min | Weekly |
| Step 1 completion | 95%+ | Daily |
| AI adoption | 80%+ enabled | Weekly |
| Tutorial click rate | > 40% | Weekly |
| 7-day retention | > 70% | Monthly |

---

## Locked Decisions (GAP 37–40)

These decisions are locked in `MASTER_PROTOTYPE_SPECIFICATION.md` under Section 10: Onboarding Flow. They are reflected throughout this document and summarized here for quick reference.

---

### GAP 37: AI Degradation When Products Skipped

**Decision**: AI can answer general FAQ questions but cannot close orders if no real products are added during onboarding.

**Behavior**:
- If user completes onboarding with only the auto-created sample product (or no products at all), AI is set to degraded mode.
- Degraded AI state: `can_answer_faq` = true, `can_close_orders` = false
- AI can handle: "What are your hours?", "Do you ship?", general greeting/FAQ responses
- AI cannot handle: pricing lookups, add-to-cart, checkout, order creation, payment link generation
- This state lifts automatically when owner adds 1+ real product via Settings > Products
- Owner is informed via Popup 3 inline tutorial: "เพิ่มสินค้าเพิ่มเติม?" — prompting them to complete the catalog

**Rationale**: Balanced approach — AI remains useful (FAQ) without creating broken checkout experiences (no real product data).

---

### GAP 38: Resume / Reconnection After Exit

**Decision**: If a user exits mid-onboarding and returns, they start from Step 1 with re-authentication required.

**Behavior**:
- Onboarding session state is cleared after 2 hours of inactivity
- On return (same day or later), user is routed back to Step 1 (Connect Channel)
- Re-auth is required — no partial state is preserved from the prior session
- Any channels connected in the previous session are not re-used; user must reconnect
- No "resume where you left off" prompt is shown

**Rationale**: Clean state machine — avoids dangling OAuth tokens and stale channel permissions from incomplete sessions.

---

### GAP 39: Auto-Save vs Tap-to-Save

**Decision**: Products in Step 2 are saved only when the user explicitly taps [ถัดไป] (Next). No auto-save.

**Behavior**:
- Typing product names, prices, stock quantities in Step 2 does NOT trigger any DB writes
- Importing via CSV in Step 2 stages the data locally (in-screen state) but does NOT commit to DB
- All Step 2 data — manual entries + CSV imports — is committed in a single transaction when [ถัดไป] is tapped
- If user navigates away (browser back, app switch) before tapping [ถัดไป], all Step 2 data is lost
- No save indicator or draft state is shown; UI should make it clear [ถัดไป] = save + continue

**Rationale**: Explicit save avoids partial/corrupted product records. Clean transaction model with a single commit point.

---

### GAP 40: CSV Import Availability

**Decision**: CSV product import is available during onboarding Step 2 (not deferred to post-onboarding only).

**Behavior**:
- Step 2 screen shows two product entry options side-by-side: [+ เพิ่มสินค้า] (manual) and [นำเข้า CSV] (import)
- Tapping [นำเข้า CSV] opens a modal: file picker + download sample CSV template link
- Import validates column headers and data types; errors shown inline before confirming
- Successfully imported products appear in the Step 2 product list
- All imported products follow the same tap-to-save rule (committed when [ถัดไป] is tapped — see GAP 39)
- CSV import supports the same fields as manual entry: name, category, price, stock quantity

**Rationale**: Sellers with existing product lists should not be forced to re-enter them manually. Importing during onboarding means AI is immediately equipped with real products, avoiding AI degradation (GAP 37).

---

## Ready for Feature #2?

✅ Feedback incorporated:
- ✅ Faster (< 5 min)
- ✅ Simple UI + Thai-friendly
- ✅ AI ON by default
- ✅ Sample product auto-created
- ✅ Inline tutorials (not persistent checklist)

✅ GAP decisions locked:
- ✅ GAP 37: AI degradation when products skipped
- ✅ GAP 38: Resume from Step 1 after exit / 2h inactivity clears state
- ✅ GAP 39: Save on tap [ถัดไป] — explicit, no auto-save
- ✅ GAP 40: CSV import available in Step 2

**Should I proceed to Feature #2: Inbox & Chat Management?** 👇
