# 5. AI Sales Agent — User Story

**Status**: Ready for Review
**Priority**: 🔴 Critical (Revenue driver)
**Target Users**: Shop owners (auto-responder), AI monitoring admins
**Primary Device**: Auto (24/7 running), Dashboard view (desktop)
**Goal**: Auto-answer questions, close orders without human intervention, handle FAQ intelligently

---

## Feature Overview

**AI Sales Agent** is an intelligent chatbot that:
1. **Receives customer messages** from all channels (LINE, FB, IG, WhatsApp, Lazada)
2. **Understands intent** (asking question? ready to buy? complaint?)
3. **Responds appropriately**:
   - High confidence → Answer directly (knowledge base, product recommendation)
   - Medium confidence → Suggest order flow
   - Low confidence → Hand off to human agent
4. **Closes orders** by guiding customers through order + upsell/cross-sell
5. **Works 24/7** without human intervention

**Key Value**: Always-on customer service. Higher conversion (faster response). Free up staff for complex issues.

---

## User Personas & Goals

### Persona 1: Solo Seller (Primary)
- Cannot be online 24/7
- Wants AI to handle simple questions and close easy orders
- Needs to sleep, eat, run errands
- **Goal**: AI responds while busy, human only for complex cases

### Persona 2: Growing Store (Secondary)
- Team of 3-5 people
- Want to maximize order value with upsells
- Need AI to close orders while staff handle follow-up
- **Goal**: AI closes simple orders, staff handles VIP/complex customers

### Persona 3: AI Monitor (Admin)
- Watches AI performance
- Adjusts confidence thresholds
- Trains AI with rejected cases
- **Goal**: Optimize AI behavior, improve handoff accuracy

---

## Business Value

| Metric | Target | Impact |
|--------|--------|--------|
| **24/7 response time** | Always < 2 sec | Never lose impatient customers |
| **AI closure rate** | > 20% of orders closed by AI | Revenue without staff cost |
| **Handoff accuracy** | > 85% correct (not premature) | Staff happy, customers happy |
| **Knowledge base completeness** | 100% FAQ covered | No handoff needed for simple Q |
| **Upsell adoption** | > 30% of AI orders include upsell | Higher AOV |

---

## AI Message Processing Pipeline

### Step 1: Message Arrival & Context Loading

```
Customer sends: "สนใจสินค้า A มีไหม?"

System:
  1. Receive message webhook
  2. Load customer profile:
     - Name, purchase history, past interactions
     - All past conversations (conversation context)
     - Current segment tag (Hot, VIP, At-risk, etc.)
  3. Load shop knowledge base:
     - Products (with prices, stock, images)
     - FAQ (common questions + answers)
     - Upsell/cross-sell relationships
  4. AI reads all context
     ↓ (proceeds to intent detection)
```

**Rules**:
- ✅ Context = last 5 messages + customer profile
- ✅ If customer has 100+ past messages, load last 20
- ✅ If first time customer, no history
- ✅ Load product catalog in real-time (stock can change)

---

### Step 2: Intent Detection

AI analyzes: "What does customer want?"

```
Input: "สนใจสินค้า A มีไหม?"

AI thinking:
  ✅ Intent: Interested in product
  ✅ Product: A
  ✅ Confidence: 95%
  ✅ Action: Answer product question

vs.

Input: "ยังไม่ได้รับของ"

AI thinking:
  ✅ Intent: Complaint (didn't receive)
  ✅ Confidence: 60%
  ✅ Action: Escalate to human (need context from order)

vs.

Input: "ได้ครับ ขอ 2 ชิ้น"

AI thinking:
  ✅ Intent: Ready to buy
  ✅ Confidence: 90%
  ✅ Action: Start order flow
```

**Confidence Threshold**:
```
Confidence >= 70%  → Respond (take action)
Confidence < 70%   → Escalate (hand to human)
```

**Rules**:
- ✅ Intent detection uses NLP + keyword matching
- ✅ Support Thai language naturally ("แบบนี้", "ยังเหลือมั้ย")
- ✅ Handle typos and informal language
- ✅ Fallback: If cannot detect intent, ask for clarification once
- ✅ After 2 clarification requests → hand off to human

---

### Step 3: Knowledge Base Lookup

**If intent = "Question"**:
```
Customer: "สินค้า A ราคาเท่าไหร่?"

AI searches knowledge base:
  1. Product search: "A" → Found product
  2. Look up: Price ฿199, Stock 50, Description "Blue cotton"
  3. Generate response:
     "สินค้า A ราคา ฿199 ค่ะ ✨
      มีสต็อก 50 ชิ้น
      ต้องการสั่งไหม? 😊"
  4. Show: [Product image] [Price] [Stock]
     [Buttons: Order Now] [Ask more] [Back]
```

**Search Priority**:
1. Product name match
2. Category match
3. Description keyword
4. FAQ answer
5. Cannot find → Ask customer for clarification

**Rules**:
- ✅ Real-time stock lookup (up-to-date)
- ✅ Real-time price (from product catalog)
- ✅ Show product images if available
- ✅ If out of stock, suggest similar products

---

### Step 4: Order Flow (If Customer Ready to Buy)

```
Customer: "ขอสินค้า A 2 ชิ้น"

AI: Intent = "Buy"
    Confidence: 90%

    Action: START ORDER FLOW

Screen 1: Confirm product & quantity
  AI: "ยืนยัน: สินค้า A x2"
  [✅ ถูกต้อง] [❌ เปลี่ยนใจ]

Screen 2: Upsell (if exists)
  Product A → Upsell to: Product A Premium (฿349, custom price)
  AI: "ลองสินค้า A Premium ดูไหม? คุณภาพดีกว่า 😊"
  [✅ ใช่ 1 ชิ้น] [❌ ไม่ดีค่ะ] [❓ แตกต่างไหน]

  Customer rejects → Skip upsell (don't ask again)
  Customer accepts → Replace item in order

Screen 3: Cross-sell (if exists)
  AI: "อยากเพิ่มสิ่งนี้ไหม?
       👖 Shorts B (฿249)
       🧦 Socks C (฿39)"
  [+ เพิ่มทั้ง 2] [+ เพิ่ม Shorts เท่านั้น] [ไม่ดีค่ะ]

Screen 4: Order Summary
  AI: "สรุป:
       🛒 สินค้า A x2 = ฿398
       👖 Shorts B x1 = ฿249
       🧦 Socks C x1 = ฿39
       ─────────────────
       รวม: ฿686 ✅

       ยืนยันไหม? [✅ ใช่] [❌ ยกเลิก]"

Screen 5: Create Order & Send Payment Link
  ✅ Order created (source: "ai")
  Payment Link sent: "https://pay.onebear.com/..."
  AI: "สั่งสำเร็จค่ะ! 🎉
       ขอนำส่ง 2-3 วัน
       [Link ชำระเงิน] ← Clickable
       ขอบคุณนะค่ะ 💚"
```

**Rules**:
- ✅ Upsell suggested only once per product
- ✅ If rejected, don't suggest upsell again for that session
- ✅ Cross-sell max 2 items (not annoying)
- ✅ After upsell rejection, go to cross-sell (2nd chance to add value)
- ✅ Customer can change mind at any step (easy exit)
- ✅ Order created immediately (source: "ai")
- ✅ Payment Link sent via same channel customer used

---

### Step 5: Language Detection & Response

**Support Thai & English**:

```
Message: "What's the price of product A?"
  → Detect: English
  → Respond in English: "Product A is ฿199. Would you like to order?"

Message: "สินค้า A ราคาเท่าไหร่"
  → Detect: Thai
  → Respond in Thai: "สินค้า A ราคา ฿199 ค่ะ..."

Message: "ราคา A product?"
  → Detect: Mixed (Thai + English)
  → Respond in Thai (majority language)

Message: "Berapa harga?"
  → Detect: Indonesian (not supported)
  → Respond: "รองรับภาษาไทยและอังกฤษเท่านั้นค่ะ 🙏"
```

**Rules**:
- ✅ Detect language automatically (no user selection)
- ✅ Respond in customer's language
- ✅ Mixed language → Use primary language
- ✅ Unsupported language → Thai response only
- ✅ Support Thai natural speech: "ยังมีไหม", "แบบนี้", "ยิ่งใหญ่", etc.

---

### Step 6: Handoff to Human Agent

**When does AI hand off?**

```
Handoff Trigger #1: Confidence < 70%
  Customer: "ยังไม่ได้รับของตั้งแต่เมื่อวาน"
  AI confidence: 30% (complaint, need context)
  → Hand to Agent immediately
  → Agent sees: "[⚠️ AI Handed off] Customer complaint about non-receipt"

Handoff Trigger #2: Customer asked for human
  Customer: "สอบถามคน"
  → Detect intent: "Talk to human"
  → Hand to Agent immediately

Handoff Trigger #3: AI gave up (clarifications failed)
  After 2 "I don't understand" attempts
  → Hand to Agent: "Sorry, let me connect to staff..."

Handoff Trigger #4: Order-related complexity
  Customer: "Can I get custom engraving?"
  → AI: "Custom orders need staff approval"
  → Hand to Agent with context
```

**Handoff Message to Agent**:
```
Customer: Jane Smith (@LINE)
Last message: "Can I customize the product?"
AI assessment: "Custom request - needs human approval"
Confidence: 45% (too low)

[Context: Previous orders, segment, purchase history]
[Take over] [Message Jane: "Connecting to staff..."]
```

**Rules**:
- ✅ AI sends full context to agent (no info loss)
- ✅ Agent can see why AI handed off (reason displayed)
- ✅ Agent can view customer's full history
- ✅ Chat label changes: "🤖 AI" → "👤 Agent X"
- ✅ Agent can return to AI if needed

---

## Knowledge Base Management

**What AI Learns From**:
1. **Product Catalog** (auto-linked)
   - Product names, prices, stock, images, descriptions
   - Upsell/cross-sell relationships
   - Updates automatically when catalog changes

2. **FAQ (Shop-created)**
   ```
   Q: "ส่งฟรีเมื่อไหร่?"
   A: "ส่งฟรีสำหรับออเดอร์ > ฿500 ค่ะ"

   Q: "คืนเงินได้ไหม?"
   A: "ได้ค่ะ ภายใน 7 วัน..."
   ```

3. **Conversations (Learning)**
   - When admin says "No, that's wrong" → AI learns not to say that
   - When customer is satisfied → Positive reinforcement
   - No manual teaching (learning automatic)

**Rules**:
- ✅ AI reads product catalog in real-time (prices can change)
- ✅ FAQ updated by shop admin in Settings
- ✅ AI learns from corrected messages (Feedback loop)
- ✅ No personal data memorization (only business data)

---

## AI Follow-up (Auto-triggered)

**When customer abandons without buying**:

```
Scenario: Customer interested but didn't order
  T=0: Customer: "สนใจสินค้า A"
       AI: "ลองสั่งไหม? [Order] [Ask more]"
  T=30min: No response from customer

T=30min + 2 hours = 2.5 hours later:
  AI sends follow-up: "ยังสนใจ A ไหมค่ะ?
                      ราคา ฿199 | ส่วนลด 10% วันนี้ 🎉
                      [Order now] [Ask more]"

T=next day:
  If still no response:
  AI: "ทีเด็ด! A ขายดีมาก ส่วนลด 15% เหลือ 2 ชิ้นแล้ว
       [Confirm order?]"

T=7 days:
  Stop follow-up (customer lost)
```

**Rules**:
- ✅ Auto-triggered if: Customer interested + no order within 2 hours
- ✅ Follow-up message customizable in Settings
- ✅ Max 2 follow-ups per customer (not spam)
- ✅ Include product name, price, urgency
- ✅ Stop if customer responds or orders

---

## AI Configuration & Monitoring

**Admin Dashboard**:

```
Dashboard: AI Performance
┌──────────────────────────────────────────────────┐
│ 🤖 AI Status: 🟢 ONLINE (Responding)            │
│                                                   │
│ Today's Stats:                                   │
│  Messages: 47                                    │
│  Responses: 42 (89% - good)                      │
│  Orders closed: 5                                │
│  Handoffs: 5 (11%)                               │
│  Avg response time: 0.8 sec                      │
│                                                   │
│ Settings:                                        │
│  Confidence threshold: [70%] ← Adjustable       │
│  Max upsell price increase: [50%] ← Adjustable   │
│  Language: Thai + English                        │
│  Response Tone: [Casual ▼] ← Default            │
│    Options: Formal | Casual | Cute               │
│  Status: [🟢 Enabled]                            │
│                                                   │
│ [View rejected cases] [Edit FAQ] [Training log]  │
└──────────────────────────────────────────────────┘
```

**Tone Behavior by Setting**:

| Tone | Thai Example | English Example |
|------|-------------|-----------------|
| **Formal** | "สินค้า A ราคา ฿199 กรุณายืนยันการสั่งซื้อ" | "Product A is ฿199. Please confirm your order." |
| **Casual** (default) | "สินค้า A ราคา ฿199 นะคะ สั่งได้เลยค่ะ 😊" | "Product A is ฿199! Ready to order? 😊" |
| **Cute** | "หยิบสินค้า A ราคา ฿199 ได้เลยนะคะ~ 🎀💕" | "Product A is ฿199~ Want one? 🎀💕" |

**Rules**:
- Default tone = Casual (set at workspace creation, no action needed by shop owner)
- Tone applies to all AI-generated messages across all channels
- Tone is workspace-level (one setting, all conversations)
- Changing tone takes effect on next message sent (not mid-conversation retroactively)
- Implementation: `workspace_settings.ai_tone` enum (formal | casual | cute), passed to AI prompt template

**Adjustable Settings**:
- Confidence threshold (50%-90%)
- Upsell price cap (10%-100% increase)
- Follow-up timing (1h-24h)
- Follow-up message (custom)
- Enable/disable by channel (LINE only, IG off, etc.)
- Response tone (formal / casual / cute) — **default: casual**

---

## Acceptance Criteria

### Message Processing
- [ ] AI receives all messages from all channels (LINE, FB, IG, WhatsApp, Lazada)
- [ ] Loads customer context (history, profile, segment)
- [ ] Loads product catalog (real-time prices, stock)
- [ ] Response time < 2 seconds
- [ ] Never loses a message (queue if system busy)

### Intent Detection
- [ ] Detects: Question, Order, Complaint, Greeting
- [ ] Confidence % shown in logs
- [ ] Threshold: 70% (configurable)
- [ ] Handles Thai natural language well
- [ ] Handles typos and abbreviations

### Knowledge Base
- [ ] Answers from product catalog (real-time)
- [ ] Answers from FAQ (shop-created)
- [ ] Shows product images (if available)
- [ ] Shows real prices + stock
- [ ] Updates immediately when catalog changes

### Order Flow
- [ ] Guides through: Confirm → Upsell → Cross-sell → Summary → Payment
- [ ] Upsell suggested once (rejected = don't ask again)
- [ ] Cross-sell max 2 items
- [ ] Can change mind at any step (easy cancel)
- [ ] Creates order with source: "ai"
- [ ] Sends payment link via original channel
- [ ] Order appears in Inbox immediately

### Upsell/Cross-sell
- [ ] Uses product relationships from catalog
- [ ] Respects custom pricing (if set)
- [ ] Suggests based on relevance + confidence
- [ ] Shows product image + price
- [ ] If rejected → don't suggest again

### Language
- [ ] Detects Thai vs English automatically
- [ ] Responds in customer's language
- [ ] Handles mixed Thai-English
- [ ] Unsupported languages → Thai response
- [ ] Natural Thai speech understood

### Handoff
- [ ] Low confidence (<70%) → Handoff immediately
- [ ] Customer asks for human → Handoff immediately
- [ ] Full context passed to agent
- [ ] Agent sees handoff reason
- [ ] Agent can take over or return to AI

### Follow-up (Auto-triggered)
- [ ] Customer interested but no order → Follow-up after 2h
- [ ] Max 2 follow-ups (not spam)
- [ ] Include incentive (discount, urgency)
- [ ] Stop if customer responds or orders

### Configuration
- [ ] Confidence threshold adjustable (50%-90%)
- [ ] Can enable/disable per channel
- [ ] FAQ customizable by admin
- [ ] Follow-up message customizable
- [ ] Tone setting: Formal / Casual / Cute (default: Casual)
- [ ] Tone setting persists at workspace level (not per-conversation)

### Performance Monitoring
- [ ] Dashboard shows today's stats (responses, orders, handoffs)
- [ ] Avg response time displayed
- [ ] Handoff rate visible
- [ ] Can view rejected cases for retraining
- [ ] Log shows which messages AI declined

### Mobile/Desktop
- [ ] Works 24/7 (no device dependency)
- [ ] Admin can monitor on desktop
- [ ] Customers interact via their channels (transparent)

---

## Key User Flows

### Happy Path: AI Closes Order
```
1. Customer (LINE): "สนใจสินค้า A"
2. AI: "ลองสั่งไหม? ราคา ฿199"
3. Customer: "ได้ครับ 2 ชิ้น"
4. AI: (Upsell) "Premium version ฿349 ดีกว่านะ"
5. Customer: "ไม่ดีค่ะ"
6. AI: (Cross-sell) "ลองเพิ่มถุงเท้า ฿39?"
7. Customer: "ได้"
8. AI: "รวม ฿636 [Link ชำระ]"
9. Customer pays
10. Order created ✅ AI closed it!
```

### Handoff: AI Doesn't Know
```
1. Customer: "ยังไม่ได้รับของ"
2. AI: "Wait, let me get staff..."
3. Chat hands off to Agent
4. Agent sees: "Complaint about non-receipt"
5. Agent finds order, provides tracking
6. Problem resolved
```

### Follow-up: Recover Lost Sale
```
1. Customer viewed product
2. Didn't order
3. 2 hours later: AI sends follow-up
4. "A ขายดี ส่วนลด 10% [Order?]"
5. Customer: "ได้"
6. Order created ✅ Recovery!
```

---

## Success Metrics

| Metric | Target | Check Period |
|--------|--------|---|
| **24/7 uptime** | 99%+ | Daily |
| **Response time** | < 2 sec | Real-time |
| **AI closure rate** | > 20% orders | Daily |
| **Handoff accuracy** | > 85% correct | Weekly |
| **Knowledge completeness** | 100% FAQ covered | Weekly |
| **Upsell adoption** | > 30% of AI orders | Weekly |
| **Customer satisfaction** | > 80% happy | Monthly |
| **False positives** | < 5% wrong handoffs | Weekly |

---

## Questions for Review

Before Feature #6, please confirm:

1. ✅ **Confidence threshold: 70%?** Or adjust?
2. ✅ **Upsell once per product per session?** Or always offer?
3. ✅ **Max 2 cross-sell items?** Or 1-3 variable?
4. ✅ **Follow-up auto-trigger after 2 hours?** Or customizable?
5. ✅ **AI learns from rejected cases automatically?** (No manual training?)
6. ✅ **Should AI show "AI is thinking..." during response?** Or instant?

**Ready for Feature #6: Follow-up Management?** 👇

---

## Locked Decisions

This section records all confirmed, locked decisions for the AI Sales Agent feature. These are final and should not be reopened without explicit stakeholder sign-off.

---

### GAP 11: AI Tone Configuration
- **Status**: LOCKED (April 8, 2026)
- **Decision**: Shop owner can configure AI response tone. Three options: Formal, Casual, Cute.
- **Default**: Casual
- **Scope**: Workspace-level setting (one tone applies to all channels and conversations in that workspace)
- **When applied**: Takes effect on next message sent after change. Does not retroactively alter in-progress conversations.
- **Implementation**:
  - `workspace_settings.ai_tone` column, type: enum (`formal` | `casual` | `cute`)
  - Default value at workspace creation: `casual`
  - Value is injected into AI prompt template at message-generation time
  - UI: Dropdown in AI Settings panel, labeled "Response Tone", shows current selection with "(Default)" badge on Casual
- **Rationale**: Thai SME shop owners selling to Thai consumers expect a warm, approachable tone by default. Casual is the natural fit for most shops (fashion, food, lifestyle). Formal serves B2B or professional service shops. Cute serves shops targeting younger audiences (stationery, accessories, K-style). Giving control without overwhelming with options keeps onboarding fast.
- **Tone examples**:

  | Tone | Thai | English |
  |------|------|---------|
  | Formal | "สินค้า A ราคา ฿199 กรุณายืนยันการสั่งซื้อ" | "Product A is ฿199. Please confirm your order." |
  | Casual (default) | "สินค้า A ราคา ฿199 นะคะ สั่งได้เลยค่ะ 😊" | "Product A is ฿199! Ready to order? 😊" |
  | Cute | "หยิบสินค้า A ราคา ฿199 ได้เลยนะคะ~ 🎀💕" | "Product A is ฿199~ Want one? 🎀💕" |

- **Related deployment check**: All three tone configs must be tested before release (see MASTER_PROTOTYPE_SPECIFICATION.md deployment checklist)

---

## Prototype Updates (April 2026)

### AI Sales Agent Configuration Moved to Settings (updated)

Per product review, AI Sales Agent configuration is no longer a standalone page. It is now housed under:
**Settings → Messaging → AI Sales Agent**

This ensures Super Admins and Managers can access AI policy configuration without navigating away from the main Settings area. The standalone "AI Agent" route has been removed.

**UI Sections in Settings > AI Sales Agent:**

**Section 1: Master Toggle + Per-channel Toggles**
- Master switch: "เปิดใช้ AI Sales Agent" (enables/disables globally)
- Per-channel toggles: LINE, Facebook, Instagram, WhatsApp
- Per-channel toggles disabled when master is OFF

**Section 2: Role Policy Table**
- Matrix: rows = Admin / Manager / Agent / Staff
- Columns: AI ตอบแทนแทน | AI สร้างออเดอร์ | AI เจรจาราคา | ต้องอนุมัติก่อน
- Default permissions:
  - Admin: ✓ ✓ ✓ ✗ (full AI power, no approval needed)
  - Manager: ✓ ✓ ✗ ✗ (can use AI, no price negotiation)
  - Agent: ✓ ✗ ✗ ✓ (AI assists but must approve order creation)
  - Staff: same as Agent by default

**Section 3: Handoff Policy**
- Confidence threshold: range slider 50-90% (default 70%)
- Max conversation turns before handoff: number input (default 5)
- Out-of-hours behavior: radio buttons (ตอบอัตโนมัติ / หยุดตอบ / ส่งข้อความแจ้ง)

**Section 4: Discount Policy**
- Enable discount toggle
- Maximum discount %: number input 1-30 (default 10%)
- Manager approval threshold %: input (default 5%) — discounts above this require manager sign-off

**Section 5: Save**
- "บันทึกการตั้งค่า" button with 2-second "✓ บันทึกแล้ว" confirmation flash

### Role Policy Acceptance Criteria (new)
- [ ] Super Admin can view and edit all role policy checkboxes
- [ ] Manager cannot edit Admin row (read-only for their own row and below)
- [ ] Agent row default: AI assists but requires approval before creating order
- [ ] Discount policy enforced in AI order flow (AI cannot exceed max %)
- [ ] Handoff threshold from Settings overrides hardcoded 70% default
