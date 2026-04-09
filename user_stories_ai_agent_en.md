# User Story — AI Sales Agent
## Onebear Phase 1

---

# 🟥 Pain

Most online shops receive customer messages around the clock, but human admin teams cannot be available at all times. This results in:

- Customers waiting too long → lost sales opportunities
- Admins repeatedly answering the same questions (price, stock, how to order) — wasted time on low-value tasks
- No automated system to handle Upsell or Cross-sell suggestions
- New shops without a ready sales team still need to serve customers from day one

Onebear solves this with an **AI Sales Agent operating 24/7** — replying in Thai and English, recommending products, closing orders, and sending Payment Links automatically.

---

# 🟩 Business

## 1. Feature: Knowledge Base

### 1.1 Default Knowledge Base

When a shop activates AI for the first time, the system provides a **Default Knowledge Base** immediately — no configuration required. It includes:

- General FAQ templates: how to order, payment methods, shipping policy
- Greeting and shop introduction templates
- Default Fallback message when AI does not know the answer

Shop owners can **edit or delete any Default content** at any time in Settings.

### 1.2 Knowledge Base Management

Super Admin and Manager can add content in 3 ways:

**Method 1 — Manual FAQ Entry**
- Enter Question-Answer pairs directly
- Supports Rich Text (bold, line breaks, emoji)
- Unlimited entries

**Method 2 — Auto-import from Product Catalog**
- When a product is added to Product Catalog → AI automatically pulls product data (name, price, description, variants) into the Knowledge Base
- Deactivated products → AI will not recommend them but can still answer questions about them
- Product updates → AI uses the new data immediately for new conversations; ongoing conversations continue using the previous version until the session ends

**Method 3 — CSV Import**
- Upload a CSV file matching the system's defined template
- Validates data before importing — shows Preview and Errors before confirmation
- Successful import → data is immediately available to AI

### 1.3 Test Mode

- Super Admin, Manager, and Agent/Staff can test AI responses before going live
- Type a simulated question → see exactly how AI would reply
- Test Mode responses are never sent to real customers

---

## 2. Feature: Message Processing

### 2.1 Message Processing Flow

```
Customer message arrives
    → Check AI Credit first
        ├─ Credit = 0 → AI stops immediately
        │   → Show "Credit limit reached" in chat (admin side)
        │   → Route chat to admin to handle manually
        │   → Show alert in Dashboard and Usage/Billing page
        └─ Credit available → continue
    → Spam check (if spam → stop)
    → Debounce 3 seconds (wait for Rapid Fire to settle)
    → AI reads full conversation context
    → Match against Knowledge Base + classify customer intent
        ├─ Product / FAQ question → answer from Knowledge Base
        ├─ Purchase intent detected → start Order Flow
        ├─ General question → conversational reply
        └─ Confidence < 70% → Private Note + hand off to admin
    → Send reply (must be within 5 seconds)
    → Deduct 1 Credit per reply
```

### 2.2 Language Support

- AI replies in the language the customer uses
- Supported languages: **Thai** and **English**
- Mixed Thai-English messages → AI replies primarily in Thai
- Other languages → AI replies in Thai + informs customer "only Thai and English are supported"
- Language undetectable → default to Thai

### 2.3 Rapid Fire Debounce

```typescript
const DEBOUNCE_MS  = 3_000    // wait 3 seconds after last message
const MAX_WAIT_MS  = 30_000   // reply immediately if typing continues > 30 seconds
```

Prevents AI from replying to each message individually, causing confusion. AI batches all messages within the debounce window and replies once.

---

## 3. Feature: Fallback — When AI Does Not Know the Answer

When AI confidence drops below 70% or the question is outside the Knowledge Base:

```
AI cannot answer
    → Record customer's question in a Private Note on that conversation
      e.g. "[AI]: Customer asked about 'return policy' — not found in Knowledge Base"
    → Inform customer: "Let me get our team to help you with that. One moment please."
    → Hand off chat to admin immediately (appears in "Assigned to Me" section)
    → Admin sees the Private Note and knows exactly what needs to be answered
```

**Fallback rules:**
- AI never replies when not confident — prevents incorrect information
- Private Note is visible to admins only; customers never see it
- Admin can press "Return to AI" after answering to hand back to AI
- Questions AI frequently cannot answer → surfaced in **Knowledge Base Insights** for the shop owner to add to FAQ

---

## 4. Feature: Order Flow — AI Closes the Sale

### 4.1 Purchase Intent Detection

AI detects purchase intent from conversation context, such as:
- "Can I order now?", "I want this one", "How much? I'll take it"
- Customer repeatedly asking for product details
- Customer asking about shipping or payment methods

### 4.2 Order Flow

```
AI detects purchase intent
    → Recommend 1–3 products
      Phase 1: product name + price + image URL (text link)
      Phase 2: Native Image (depending on Channel API support)
    → Customer selects product
    → Check Upsell (if configured)
        ├─ Upsell available → recommend 1 higher-value product
        │   ├─ Customer interested → swap product in order
        │   └─ Customer declines → continue with original product
    → Customer confirms main product
    → Check Cross-sell (if configured, max 2 items)
        ├─ Cross-sell available → suggest complementary products
        │   ├─ Customer adds → include in same order
        │   └─ Customer declines → continue
    → AI summarizes order: items, quantities, price, total
    → Request customer confirmation
        ├─ Confirmed → create order (tag: source=ai) + send Payment Link
        └─ Changed mind → acknowledge + offer alternatives
```

**Upsell / Cross-sell rules:**
- Upsell is offered **before** customer confirms — if declined, never suggest again in the same conversation
- Cross-sell is offered **only after** main product is confirmed — maximum 2 items per order
- AI does not suggest Upsell priced more than 50% above the main product (configurable in Settings)
- Customer changes mind during order creation → rollback pending order immediately

### 4.3 Order Creation & Payment Link

- AI creates order → saved to Order Management immediately with `source=ai` tag
- Admin receives real-time notification when AI creates an order
- Payment Link generated and sent in the same chat thread immediately
  - Supported: PromptPay, credit/debit card
  - Default expiry: 24 hours (configurable)
- Customer pays successfully → order status updates to Paid automatically + confirmation message sent
- Stock runs out during Upsell flow → AI detects in real-time and offers alternative products immediately

---

## 5. Feature: Automated Follow-up

```
Customer stops responding after showing purchase intent
    → Wait configured delay (default: 2 hours)
    → Check allowed send window (default: 09:00–21:00)
        ├─ Within window → send Follow-up immediately
        └─ Outside window → queue and send at 09:00 next day
    → Send Follow-up message (max 2 attempts per conversation)
    → Stop immediately when:
        - Customer replies
        - Payment received
        - Admin manually stops it
```

- Follow-up messages are friendly and non-pushy
- Default message template ready to use; customizable in Settings

---

## 6. Feature: AI Tone & Persona

Shop owner selects AI tone in Settings:

| Tone | Description | Default |
|---|---|---|
| **Casual** | Friendly, conversational, everyday language | ✅ Default |
| **Formal** | Polite, professional language | — |
| **Cute** | Playful language with emoji | — |

- Tone takes effect immediately for new conversations
- Ongoing conversations continue using the previous tone until the session ends

---

## 7. Feature: AI Label & Profile

**Admin side (Onebear Inbox):**
- All messages sent by AI display an **AI icon** as the profile photo
- Every AI message carries an **"AI" badge** visible to admins
- Admins can immediately distinguish AI messages from human messages

**Customer side (3rd party channels):**
- LINE OA, Facebook, Instagram, WhatsApp → customer always sees the Channel account's profile photo
- Onebear cannot change the profile photo per message — this is a Platform API constraint
- The AI badge and AI icon are never visible to customers under any circumstance

> **Note**: Transparency obligation lies with the shop owner in how they name and represent their Channel account. This is outside Onebear's control.

---

## 8. Feature: Knowledge Base Insights

- System collects all questions AI could not answer (Fallback triggers)
- Displayed in the Knowledge Base page under "Unanswered Questions", sorted by frequency
- Shop owner can tap any item to add it directly to FAQ from this list
- Enables the Knowledge Base to improve continuously using real customer data

---

## 9. Feature: AI Credit & Limit

AI operates **24/7 without interruption** — it stops only when Credit runs out.

### 9.1 Behavior When Credit Runs Out

```
Credit = 0
    → AI stops immediately
    → Incoming customer messages → routed to admin to handle manually
    → "Credit limit reached" message displayed in:
        - Chat view (admin side) next to the AI toggle
        - KPI Snapshot / Dashboard
        - Usage / Billing page
    → Admin must handle chats manually until Credit is topped up
```

### 9.2 Low Credit Warnings

- Credit reaches 20% → yellow warning banner
- Credit reaches 10% → red warning banner + Push Notification
- Notifications delivered via In-app Notification and Email (if configured)

### 9.3 Usage / Billing Page

- **Progress Bar** showing Credit usage visually (full → empty)
- Displays Credits used and Credits remaining
- Shows current plan and other available plans for upgrade
- **"Add Credit"** button — top up without changing plan
- **"Change Plan"** button — upgrade or downgrade
- When Credit = 0 → page highlights prominently with CTA to top up or upgrade immediately

---

## 10. Feature: Slip Verification

> ⚠️ **Critical Rule: Accuracy always comes first — never auto-approve if confidence is below 100%**

### 10.1 Slip Verification Flow

```
Customer sends a slip image in chat
    → Check Blacklist first (before any AI analysis)
        ├─ Found in Blacklist → reject immediately
        │   → Notify customer: "This slip has already been used for a previous payment."
        │   → Notify admin with details of the order the slip was previously used on
        │   → Write Audit Log
        └─ Not in Blacklist → AI analyzes the slip

    AI analysis
        ├─ Confidence = 100% and no suspicious signals detected
        │   → Notify customer: "Slip verified ✅"
        │   → Update order status to Paid automatically
        │   → Record slip Fingerprint in Blacklist
        │   → Write Audit Log
        │
        ├─ Confidence < 100% or suspicious signals found
        │   → Never auto-approve
        │   → Notify customer: "Our team is reviewing your payment. Please hold on."
        │   → Display Slip Review Card in the Activity Timeline of that conversation (admin side only)
        │       ┌─────────────────────────────────────────────┐
        │       │ 🔍 Slip Pending Review                       │
        │       │ [Original slip image — tap to enlarge]       │
        │       │ ⚠️ AI concern: [reason]                      │
        │       │                                              │
        │       │  [✅ Approve]           [❌ Reject]           │
        │       └─────────────────────────────────────────────┘
        │   → Push Notification sent to admin immediately
        │   → Wait for admin to press Approve or Reject
        │       ├─ "Approve" → update order to Paid
        │       │   → record Fingerprint in Blacklist
        │       │   → Audit Log: Approved by [admin name]
        │       │   → send payment confirmation to customer
        │       └─ "Reject" → record Fingerprint in Blacklist
        │           → Audit Log: Rejected by [admin name]
        │           → notify customer that the slip was not accepted
        │
        └─ Cannot read slip (image too blurry / not a slip)
            → Notify customer: "We could not read the slip. Please send a clearer image."
            → Do not update order status
```

### 10.2 Suspicious Signals AI Checks

| Signal | Description |
|---|---|
| Abnormal font | Font size or type does not match the bank's actual template |
| Color discrepancy | Color tone or gradient does not match the template |
| Pixel artifacts | Signs of image editing — hard edges, color discontinuities |
| Invalid reference number format | Transaction number format does not match bank standards |
| Implausible timestamp | Slip time is in the past or future beyond what is possible |
| Amount mismatch | Slip amount does not match the order total |
| Screenshot of a screenshot | Slip appears to be photographed from another screen → immediately Low Confidence |

### 10.3 Slip Blacklist

- Every slip that is Approved (by AI or admin) → **Fingerprint** recorded in Blacklist automatically
  - Fingerprint = Transaction reference number + date + amount + image hash
- Slips manually Rejected by an admin → added to Blacklist automatically
- Blacklist is scoped to the **Workspace** — shared across all channels
- **No deletion** — entries are permanent for security

### 10.4 Immutable Rules

- AI **must never Approve** if Confidence < 100% — no exceptions
- AI **must never tell the customer** whether a slip passed or failed when uncertain — only say "reviewing"
- **Only admins** can Override and Approve when AI is uncertain
- **Every verification** must produce an Audit Log entry: result, Confidence Score, final approver

---

# 🟧 Discussion

| # | Topic | Status | Decision |
|---|---|---|---|
| 1 | **Default Knowledge Base** — set up by shop or by Onebear team? | ✅ Resolved | Onebear provides Default KB; shop customizes as needed |
| 2 | **Fallback behavior** — what does AI do when it cannot answer? | ✅ Resolved | Write Private Note with the unanswered question → hand off to admin immediately |
| 3 | **Supported languages** | ✅ Resolved | Thai + English in Phase 1 |
| 4 | **Confidence Threshold** — default value and who can change it? | ✅ Resolved | Default 70%; Super Admin only |
| 5 | **Stock runs out during Upsell** | ✅ Resolved | AI checks Stock in real-time — if out of stock during flow, offer alternative products immediately |
| 6 | **AI availability** — can shops disable AI at night? | ✅ Resolved | AI runs 24/7 — stops only when Credit = 0; admin handles manually until topped up |
| 7 | **Knowledge Base versioning during active chat** | ✅ Resolved | Active conversations continue with the previous KB version until the session ends |
| 8 | **AI sending product images** | ✅ Resolved | Phase 1: text message with image URL link — universal across all channels. Phase 2: Native Image after per-channel API review |
| 9 | **AI profile photo — PDPA** | ✅ Resolved | Two separate layers — see Note below |

---

> ### 📌 Note: AI Profile & Channel Constraints
>
> **Customer side (3rd party channels):**
> - LINE OA, Facebook, Instagram, WhatsApp → customer always sees the Channel account's profile photo
> - Onebear cannot change the profile photo per message — Platform API constraint
> - Transparency responsibility lies with the shop owner's Channel naming and branding
>
> **Admin side (Onebear Inbox):**
> - AI messages display an AI icon as profile photo + "AI" badge
> - Enables the team to instantly distinguish AI messages from human messages
> - Customers never see the AI icon or badge under any circumstance

---

> ### 📌 Note for Settings Page User Story
>
> **All AI Sales Agent settings that must appear on the Settings page:**
>
> | Category | Setting | Default | Who can change |
> |---|---|---|---|
> | **On/Off** | Enable / disable AI Agent (global) | Off (before Onboarding) | Super Admin, Manager |
> | **On/Off** | Enable / disable AI per channel | Follows global | Super Admin, Manager |
> | **Language** | Primary language AI replies in | Thai | Super Admin, Manager |
> | **Tone** | AI persona (Casual / Formal / Cute) | Casual | Super Admin, Manager |
> | **Confidence** | Confidence threshold before handoff | 70% | Super Admin only |
> | **Knowledge Base** | Add / edit / delete FAQ | Default ready | Super Admin, Manager |
> | **Knowledge Base** | CSV import | — | Super Admin, Manager |
> | **Knowledge Base** | Test Mode | — | Super Admin, Manager, Agent |
> | **Upsell** | Enable / disable Upsell | On | Super Admin, Manager |
> | **Upsell** | Price cap (max % above main product price) | 50% | Super Admin, Manager |
> | **Cross-sell** | Enable / disable Cross-sell | On | Super Admin, Manager |
> | **Cross-sell** | Max Cross-sell items per order | 2 | Super Admin, Manager |
> | **Follow-up** | Enable / disable automated Follow-up | Off | Super Admin, Manager |
> | **Follow-up** | Delay before first Follow-up | 2 hours | Super Admin, Manager |
> | **Follow-up** | Allowed send window | 09:00–21:00 | Super Admin, Manager |
> | **Follow-up** | Max attempts per conversation | 2 | Super Admin, Manager |
> | **Follow-up** | Follow-up message templates | Default template | Super Admin, Manager |
> | **Payment Link** | Payment Link expiry duration | 24 hours | Super Admin, Manager |
> | **AI Profile** | Display name shown on admin side | "AI" | Super Admin |
> | **Credit & Billing** | Credit usage progress bar | — | Super Admin |
> | **Credit & Billing** | Low credit alerts (20% / 10%) | On | Super Admin |
> | **Credit & Billing** | Add Credit button | — | Super Admin |
> | **Credit & Billing** | Change Plan button | — | Super Admin |

---

# 🟦 Acceptance Criteria

## Feature 1: Knowledge Base

- [ ] New shop has Default Knowledge Base available immediately — no setup required
- [ ] Default KB includes general FAQ templates, greeting template, and Fallback message
- [ ] Super Admin and Manager can add FAQ manually with no limit on entries
- [ ] AI automatically pulls product data from Product Catalog into Knowledge Base
- [ ] Deactivated products → AI does not recommend them but can still answer questions about them
- [ ] Product updates → AI uses new data immediately for new conversations only
- [ ] CSV import: validates + shows Preview and Errors before confirmation
- [ ] Test Mode: simulates AI responses without sending anything to real customers
- [ ] Test Mode accessible by Super Admin, Manager, and Agent/Staff

## Feature 2: Message Processing

- [ ] AI replies within 5 seconds
- [ ] AI supports Thai and English
- [ ] Mixed Thai-English messages → AI replies primarily in Thai
- [ ] Other languages → AI replies in Thai + informs customer of language limitation
- [ ] Rapid Fire Debounce: AI waits 3 seconds after last message before replying
- [ ] If typing continues > 30 seconds → AI replies immediately without waiting further

## Feature 3: Fallback

- [ ] AI does not reply when Confidence < 70%
- [ ] Before handing off, AI writes a Private Note recording the unanswered question
- [ ] Private Note is visible to admins only — customers never see it
- [ ] AI informs customer: "Let me get our team to help. One moment please."
- [ ] Handed-off chat appears in admin's "Assigned to Me" section
- [ ] Admin can press "Return to AI" after resolving to hand back
- [ ] Frequently unanswered questions appear in Knowledge Base Insights sorted by frequency

## Feature 4: Order Flow

- [ ] AI detects purchase intent from conversation context
- [ ] AI recommends 1–3 products with name, price, and image URL (Phase 1 — text link, not native image)
- [ ] Native Image deferred to Phase 2 pending per-channel API review
- [ ] Upsell offered before confirmation — if declined, not suggested again in same conversation
- [ ] Cross-sell offered only after main product is confirmed — maximum 2 items
- [ ] AI does not suggest Upsell priced more than 50% above the main product
- [ ] Customer changes mind during order creation → pending order rolled back immediately
- [ ] AI always requests customer confirmation before creating an order
- [ ] Orders created by AI are tagged `source=ai`
- [ ] Admin receives real-time notification when AI creates an order
- [ ] Payment Link sent in the same chat thread immediately after order creation
- [ ] Payment Link default expiry: 24 hours
- [ ] Customer pays → order status updates to Paid automatically + confirmation message sent
- [ ] Stock runs out during flow → AI immediately offers alternative products

## Feature 5: Automated Follow-up

- [ ] AI sends Follow-up after default 2-hour delay when customer stops responding
- [ ] Sent only within 09:00–21:00 — outside window queues until next morning
- [ ] Maximum 2 Follow-up attempts per conversation
- [ ] Stops immediately when customer replies, payment received, or admin manually stops

## Feature 6: AI Label & Profile

- [ ] AI messages on admin side show AI icon as profile photo
- [ ] AI messages display "AI" badge visible to admins
- [ ] Customers never see the AI badge or AI icon under any circumstance
- [ ] Channel profile photo (LINE, Facebook, etc.) is outside Onebear's control — documented as Platform API constraint

## Feature 7: Knowledge Base Insights

- [ ] All Fallback questions are recorded and displayed in Knowledge Base page
- [ ] Sorted by frequency — most asked questions appear first
- [ ] Tap any item to add directly to FAQ from the Insights list

## Feature 8: AI Credit & Limit

- [ ] AI runs 24/7 — stops only when Credit = 0
- [ ] Credit = 0 → AI stops immediately; incoming chats routed to admin
- [ ] "Credit limit reached" displayed in chat view (admin side)
- [ ] Dashboard and KPI Snapshot show alert when Credit = 0
- [ ] Yellow warning banner when Credit reaches 20%
- [ ] Red warning banner + Push Notification when Credit reaches 10%
- [ ] Usage / Billing page shows Credit progress bar visually
- [ ] Displays Credits used and Credits remaining
- [ ] Shows current plan and available upgrade plans
- [ ] "Add Credit" button tops up without changing plan
- [ ] "Change Plan" button allows upgrade or downgrade
- [ ] When Credit = 0 → Billing page highlights prominently with CTA

## Feature 9: Slip Verification

- [ ] Blacklist is checked before any AI analysis — always first
- [ ] Slip found in Blacklist → reject immediately + notify customer + notify admin + write log
- [ ] AI analyzes: font, color, pixel artifacts, reference number format, timestamp, amount, screenshot-of-screenshot
- [ ] Confidence = 100% → auto-approve + update Paid + record Fingerprint in Blacklist + Audit Log
- [ ] Confidence < 100% → never auto-approve; notify customer "reviewing" + show Slip Review Card to admin
- [ ] Slip Review Card appears in Activity Timeline of that conversation (admin side only)
- [ ] Slip Review Card contains: original slip image (tap to enlarge), AI concern details, "Approve" and "Reject" buttons
- [ ] Push Notification sent to admin immediately when a slip is pending review
- [ ] "Approve" → Paid + Fingerprint in Blacklist + Audit Log + confirmation message to customer
- [ ] "Reject" → Fingerprint in Blacklist + Audit Log + notify customer slip was not accepted
- [ ] Slip Review Card is visible to admins only — customers never see it
- [ ] Cannot read slip → ask customer to resend a clearer image; do not update order status
- [ ] AI never tells customer pass/fail result when Confidence < 100%
- [ ] Only admins can Override and Approve
- [ ] Slips manually rejected by admin → added to Blacklist automatically
- [ ] Blacklist is Workspace-scoped — shared across all channels
- [ ] Blacklist entries are permanent — no deletion
- [ ] Every verification produces an Audit Log entry: result, Confidence Score, final approver

## Definition of Done

- [ ] Figma designs complete for all states: Default, Loading, Empty, Error, Mobile, Desktop
- [ ] Test Mode works without sending real messages
- [ ] Slip Review Card renders correctly in Activity Timeline on both desktop and mobile
- [ ] Unit tests cover: Fallback logic, Order Flow, Upsell/Cross-sell rules, Slip Verification flow, Credit limit behavior
- [ ] All Audit Log entries verified as immutable (no delete API)
- [ ] Tested with 3 real users before handoff to dev
