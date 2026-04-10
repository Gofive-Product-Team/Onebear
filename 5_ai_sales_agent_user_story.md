# 5. AI Sales Agent — User Story

**Status**: Locked — All critical gap decisions incorporated (April 8, 2026)
**Priority**: Critical (Revenue driver — 24/7 automated sales)
**Target Users**: Shop owners (auto-responder enabled), Managers (monitoring & configuration), Agents (handoff recipients)
**Primary Device**: Auto (24/7 background process), Dashboard view (desktop monitoring)
**Time Target**: <2 seconds AI response, <500ms handoff trigger, <3 seconds order creation

---

## Feature Overview

**AI Sales Agent** is an intelligent automated sales agent that:
1. Receives customer messages from all channels (LINE, Facebook, Instagram, WhatsApp, Lazada, Shopee)
2. Evaluates 4 eligibility checks before engaging
3. Classifies intent with a confidence score (0–100%)
4. Responds at ≥70% confidence; hands off to human agent below 70%
5. Guides customers through a structured order flow: product confirmation → upsell (once) → cross-sell (max 2) → summary → payment link
6. Sends follow-up messages after customer abandonment (2 hours post-silence, max 2 attempts)
7. Operates 24/7 without human intervention unless a handoff trigger fires

**Key Value**: Always-on customer service. Faster response = higher conversion. Staff freed for complex issues only.

---

## User Personas & Goals

### Persona 1: Solo Seller (Primary)
- Cannot be online 24/7 (sleeps, runs errands, manages delivery)
- Wants AI to handle standard questions and close routine orders without waking them up
- **Goal**: AI closes orders while they sleep; they see completed orders in the morning

### Persona 2: Growing Store (3–5 staff)
- Wants upsell automation to raise average order value
- Needs AI to handle simultaneous conversations that staff cannot manage
- **Goal**: AI handles tier-1 conversations; staff handles VIP and complaints

### Persona 3: AI Monitor (Manager/Admin)
- Checks AI performance dashboard daily
- Adjusts confidence threshold if handoff rate is too high or too low
- Reviews missed-intent cases for FAQ improvement
- **Goal**: Tune AI behavior week-over-week; ensure no lost sales from premature handoffs

---

## Business Value

| Metric | Target | Measurement Period |
|--------|--------|--------------------|
| **Response time** | <2 seconds (p95) | Real-time |
| **AI closure rate** | >20% of all orders closed by AI | Daily |
| **Handoff accuracy** | >85% of handoffs are correct (not premature) | Weekly |
| **Knowledge base coverage** | 100% of active FAQ topics covered | Weekly |
| **Upsell adoption rate** | >30% of AI-closed orders include upsell or cross-sell item | Weekly |
| **Follow-up recovery rate** | >15% of follow-up messages convert to order | Weekly |
| **False positive handoff rate** | <5% (AI hands off unnecessarily) | Weekly |
| **System uptime** | 99.5% monthly | Monthly |

---

## AI as Full Sales Employee — End-to-End Journey

This section documents the complete customer journey the AI owns from first contact to completed payment. The AI operates as a single employee capable of running the entire sales cycle without human intervention unless a handoff trigger fires.

### Complete Flow: 10-Step Customer Journey

```
STEP 1: Greeting (T+0ms to T+500ms)
─────────────────────────────────────────────────────────────────
Trigger: New room opens (first inbound message detected)
AI sends greeting within 500ms of room creation.

Thai greeting (Casual tone):
  "สวัสดีค่ะ! ยินดีต้อนรับสู่ [ShopName] มีอะไรให้ช่วยไหมคะ 😊"

English greeting (when first message is fully English):
  "Hello! Welcome to [ShopName]. How can I help you today? 😊"

[ShopName] sourced from: workspace_settings.shop_name field
If shop_name is empty: fallback to "ร้านของเรา" (Thai) / "our store" (English)
Greeting sent as first AI message; triggers no order flow.
```

```
STEP 2: Intent Classification — Product Inquiry (T+0ms to T+2000ms)
─────────────────────────────────────────────────────────────────
Customer sends product question. Full pipeline runs (see AI Message Processing Pipeline).

If intent = QUESTION at confidence ≥70%:
  AI searches knowledge base (see Knowledge Base Lookup)
  Returns product card with: product name, price, stock, image thumbnail (if available)
  Maximum 3 products shown if query is ambiguous

Product card format (Casual tone, Thai):
  "📦 [Product Name]
   ราคา: ฿[Price]
   สต็อก: [Stock] ชิ้น
   [View image] ← if product has image
   
   สนใจสั่งไหมคะ? 😊
   [🛒 สั่งเลย] [❓ ถามเพิ่มเติม] [👀 ดูสินค้าอื่น]"

If 3 products returned (ambiguous query):
  Show all 3 as a numbered list, each with name + price + stock
  No product image shown in multi-product list (space constraint)
```

```
STEP 3: Order Initiation (buy intent ≥70%)
─────────────────────────────────────────────────────────────────
Customer expresses buy intent (explicit "สั่ง", "ซื้อ", "เอา", "buy", or clicks [🛒 สั่งเลย])

Pre-conditions AI checks before entering order flow:
  Stock check: product.stock > 0 (if 0: AI says "สินค้าหมดชั่วคราว", suggests alternative)
  Session check: no active order in progress for this room (if in-progress: AI resumes from last stage)

AI enters order flow at Stage 1 (see Order Flow section for full stage detail).
Order draft created in Redis (not MongoDB — see GAP-AI-02).
```

```
STEP 4: Upsell (once per product per session)
─────────────────────────────────────────────────────────────────
Fires immediately after Stage 1 product confirmation.

Selection criteria (must ALL pass):
  1. product.upsell_product_id is set (upsell relationship exists in catalog)
  2. upsell_product.stock > 0
  3. upsell_product.price ≤ confirmed_product.unit_price × 1.50
  4. session.rejected_upsells does NOT contain upsell_product_id

Upsell message format (Casual tone, Thai):
  "อยากลอง [Upsell Product Name] ดูไหมคะ? 😊
   คุณภาพดีกว่า เพิ่มแค่ ฿[Price Difference]
   (ราคา ฿[Upsell Price])
   [✅ เอาเลย] [❓ ต่างกันยังไง] [❌ ไม่เอา]"

Price difference calculation: upsell_price - confirmed_unit_price (shown as positive number)
Example: confirmed ฿199, upsell ฿279 → "เพิ่มแค่ ฿80"

If customer clicks [❌ ไม่เอา]:
  session.rejected_upsells.push(upsell_product_id)
  Stored in Redis session key "order_session:{room_id}", TTL: 7200 seconds
  AI advances to Stage 3 silently — does NOT mention upsell again this session

If customer clicks [✅ เอาเลย]:
  Replace original product with upsell product in order draft
  Advance to Stage 3 (cross-sell)

If no upsell defined OR price exceeds 150% cap: skip Step 4 silently, go to Step 5.
```

```
STEP 5: Cross-sell (max 2 items per session)
─────────────────────────────────────────────────────────────────
Fires after upsell is resolved (accepted, declined, or skipped).

Selection priority:
  Priority 1: Admin-defined cross-sell relationships (product.cross_sell_ids[])
  Priority 2: Purchase co-occurrence score ≥60% (products bought together by ≥60% of customers
              who bought the main product — computed in nightly analytics job)
  Priority 3: Fallback — top-selling product in a different category (by 30-day sales volume)
              excluding already-confirmed products

Cross-sell cap: maximum 2 products shown per session, even if more qualify
Cross-sell products must: be in stock (stock > 0), NOT be same as main or upsell product in order

Rejection memory:
  session.cross_sell_shown = [product_id_1, product_id_2] (list of cross-sell IDs offered)
  session.cross_sell_declined = true if customer rejected all
  Once cross_sell_declined = true: do NOT offer cross-sell again this session
  Stored in Redis session, TTL: 7200 seconds

Discount during cross-sell:
  AI may apply up to max_auto_discount_pct (default 10%) on cross-sell items only
  Discount is NOT offered automatically — only if admin configures cross-sell discount
  (workspace_settings.crosssell_discount_enabled = true, default: false)
  Upsell items: NO discount can be applied during upsell, only on cross-sell

If 0 cross-sell products available: skip Step 5 silently, go to Step 6.
```

```
STEP 6: Order Summary + Confirmation
─────────────────────────────────────────────────────────────────
Fires after cross-sell is resolved (items added, declined, or skipped).
AI generates itemized summary (see Stage 4 in Order Flow section for exact format).

Estimated delivery shown if: workspace_settings.estimated_delivery_days is set
  Display: "จัดส่งภายใน [N] วันทำการ" where N = estimated_delivery_days
  If not set: omit delivery line from summary

Customer must explicitly confirm ("✅ ยืนยันสั่งซื้อ") before proceeding.
No auto-advance — order summary waits up to 60 minutes (Stage 4 timeout).
```

```
STEP 7: Order Creation + Payment Link
─────────────────────────────────────────────────────────────────
Fires when customer confirms order summary.

T+0ms    Customer clicks [✅ ยืนยันสั่งซื้อ]
T+100ms  Order record written to MongoDB (source="ai", status="PENDING_PAYMENT")
T+300ms  Payment link generated via Payso API
T+500ms  Payment link sent to customer

Order completion message (Casual tone, Thai):
  "สั่งซื้อเรียบร้อยแล้วนะคะ 🎉
   ออเดอร์: #[Order ID]
   รวม: ฿[Grand Total]
   
   👇 ชำระเงินได้ที่นี่เลยค่ะ
   [ชำระเงิน ฿[Grand Total]] ← clickable payment link
   
   ลิงก์หมดอายุใน 24 ชั่วโมงนะคะ
   ขอบคุณที่ใช้บริการค่ะ 💚"

AI begins payment monitoring (see Step 8) immediately after this message.
```

```
STEP 8: Payment Monitoring
─────────────────────────────────────────────────────────────────
After payment link is sent, AI monitors payment status actively.

Polling method: AI worker queries order.status every 5 minutes via internal API
  (Webhook from Payso is push-based and takes priority when received;
   5-minute polling is the fallback check if webhook delivery fails)

Poll interval: 300 seconds (5 minutes)
Poll duration: up to 24 hours (payment link TTL)
Poll stop condition: any of these events cancels polling:
  - order.status changes to PENDING_VERIFY (customer paid via bank transfer)
  - order.status changes to PAID (gateway payment confirmed)
  - order.status changes to COMPLETED
  - order.status changes to CANCELLED
  - 24 hours elapsed (payment link expired)

If order.status changes to PENDING_VERIFY (customer submitted payment):
  AI sends acknowledgement: "ได้รับการชำระเงินแล้วนะคะ กำลังตรวจสอบอยู่ค่ะ 🔍"
  AI does not confirm payment — that requires slip verification (see File 8)

If order.status changes to COMPLETED (payment verified):
  AI sends completion message (Step 10) and closes room

If 24 hours pass with no payment: triggers payment follow-up (see Step 9)
```

```
STEP 9: Payment Follow-up (24h unpaid → single reminder)
─────────────────────────────────────────────────────────────────
This is separate from the "abandoned interest" follow-up (different trigger, different counter).
Trigger: 24 hours after payment link was sent AND order.status is still PENDING_PAYMENT

Payment reminder message (Casual tone, Thai):
  "ลิงก์ชำระเงินของคุณกำลังจะหมดอายุในอีก [X] ชั่วโมงนะคะ
   ชำระได้เลยนะคะ 💳
   [ชำระเงิน ฿[Grand Total]] ← original payment link (same link)
   
   หากต้องการความช่วยเหลือ กดนี้เลยนะคะ 😊
   [👤 คุยกับเจ้าหน้าที่]"

Timing: Sent at exactly T+18h after payment link creation
  (= 18 hours after payment link sent, which is 6 hours before the 24h expiry)
  [X] in message = 6 (the remaining hours at send time)

Frequency: Exactly 1 attempt only. Never re-sent.
Counter: tracked in order record as payment_reminder_sent = true (boolean)
  Check before sending: if payment_reminder_sent = true → skip (idempotency guard)

If customer pays before T+18h: payment_reminder cancelled (order status already changed)
If customer pays after T+18h but before T+24h: no action needed (order updates normally)
If T+24h passes without payment: order.status → PAYMENT_EXPIRED
  AI sends: "ลิงก์ชำระเงินหมดอายุแล้วค่ะ หากต้องการสั่งซื้อใหม่กรุณาติดต่อเจ้าหน้าที่นะคะ"
  Handoff triggered (reason: "payment_link_expired")

This payment follow-up does NOT count toward the max_attempts counter in Follow-up Management.
It is tracked independently on the order record.
```

```
STEP 10: Order Complete
─────────────────────────────────────────────────────────────────
Trigger: order.status changes to COMPLETED (slip verified + approved, or gateway confirmed)

Completion message (Casual tone, Thai):
  "✅ คำสั่งซื้อ #[Order ID] สำเร็จแล้วนะคะ!
   ขอบคุณมากนะคะ 🎉 หวังว่าจะได้ให้บริการอีกนะคะ 💚"

Completion message (Casual tone, English):
  "✅ Order #[Order ID] is complete!
   Thank you so much! 🎉 Hope to serve you again soon 💚"

After completion message:
  Room status → RESOLVED (or COMPLETED per workspace settings)
  AI stops monitoring this room
  Session cleared from Redis immediately
  order_session_end_reason = "completed" written to audit log
  Follow-up timers (if any still pending) cancelled immediately
```

---

## AI Eligibility Checks (Before AI Responds)

Before the AI generates any response, 4 eligibility checks run in sequence. All 4 must pass. Any single failure stops AI engagement for that message.

```
CHECK 1: Is AI Sales Agent enabled for this workspace?
  Pass: workspace_settings.ai_sales_agent_enabled = true
  Fail: AI does not respond; message routed to unassigned inbox
  Fail behavior: No message sent to customer (silent pass-through)

CHECK 2: Is AI enabled for this specific channel?
  Pass: channel_settings[channel].ai_enabled = true
  Fail: AI does not respond; message routed to unassigned inbox
  Fail behavior: No message sent to customer

CHECK 3: Is this conversation already assigned to a human agent (status = InProgress with agent)?
  Pass: room.ai_active = true AND room.assigned_agent_id = null
  Fail: AI does not respond; human agent handles conversation
  Fail behavior: AI stays silent; no notification

CHECK 4: Is this customer on the AI block list (VIP requiring human, or manually excluded)?
  Pass: customer.ai_blocked = false
  Fail: AI does not respond; message routed to assigned agent or unassigned inbox
  Fail behavior: If customer has assigned agent → routed to them; otherwise → unassigned inbox
  Block list source: CRM customer profile field ai_blocked (boolean), set by Admin or Manager

All 4 checks pass in ≤50ms (Redis cache lookup, not DB query).
If checks 1–3 all pass but check 4 fails, system logs: "AI blocked — customer on exclusion list."
```

---

## AI Message Processing Pipeline

### Full Pipeline with Timing

```
T+0ms    Webhook received (customer message arrives from platform)
T+10ms   Deduplication check: message_id exists in Redis cache?
           YES → discard (platform webhook retry); pipeline stops
           NO  → write message_id to Redis with 300-second TTL; continue
T+15ms   4 eligibility checks run (Redis cache reads)
           Any fail → route to inbox; pipeline stops
T+20ms   Customer profile loaded from Redis cache
           Cache miss → fetch from MongoDB in ≤80ms; re-cache for 300 seconds
T+40ms   Conversation context loaded:
           - Load last 5 messages from Redis
           - If customer lifetime message count ≥ 100: load last 20 messages
           - First-time customer: no history (empty context)
T+60ms   Knowledge base searched (see Section: Knowledge Base Lookup)
T+120ms  Intent classification runs (see Section: Intent Detection)
T+300ms  Response generation begins (AI model call with context + KB results + intent)
T+1800ms Response generation deadline (hard cutoff at 1800ms from T+0)
           If AI has not returned by T+1800ms → send fallback response (see Fallback)
T+2000ms Latest acceptable delivery to customer (SLA target)

Total budget: 2000ms from webhook receipt to customer-visible message.
AI model call budget: T+300ms to T+1800ms = 1500ms maximum.
```

### Message Deduplication

```
Platform webhooks retry on timeout (e.g., LINE retries after 1 second, 3 times).
Deduplication prevents processing the same message multiple times.

Key: "dedup:{platform}:{message_id}"
TTL: 300 seconds (5 minutes)
Storage: Redis (distributed, not in-process)

On duplicate detection:
  - Log: "Duplicate message discarded: {message_id}"
  - Return HTTP 200 to platform (so platform does not retry again)
  - No customer-visible effect
```

### Queue Behavior Under Load

```
Normal load: Pipeline runs synchronously within 2000ms SLA
High load (queue depth > 50 pending messages):
  - New messages enqueued in RabbitMQ (queue: ai_message_processing)
  - Queue consumer processes in FIFO order
  - If queue depth > 200: alert sent to admin dashboard ("AI processing delayed")
  - Messages held in queue up to 300 seconds before expiry
  - If message expires in queue: route to unassigned inbox with label "AI queue timeout"
  - No message is silently dropped (either processed or routed to inbox)
```

### Fallback Response (Timeout)

```
If AI model returns no response by T+1800ms:
  Tone: Casual (default — matches workspace setting regardless)
  Thai fallback: "ขอโทษนะคะ ระบบกำลังประมวลผลอยู่ กรุณารอสักครู่ค่ะ 🙏"
  English fallback: "Sorry, please hold on for a moment while we process your request."
  
  After sending fallback: mark this conversation for human handoff
  Handoff reason: "AI timeout — response not generated within 1800ms"
  Agent notified same as confidence-based handoff (see Handoff section)
```

---

## Intent Detection

### Confidence Score Calculation

Confidence is a single composite score (0–100%) calculated from 3 weighted factors:

```
Factor 1: Intent clarity score (50% weight)
  - How clearly the message maps to a known intent category
  - Calculated by AI model: probability of top intent class
  - Range: 0–100

Factor 2: Knowledge base match score (30% weight)
  - Best match found in knowledge base for the detected intent
  - 0 if no KB match found; 100 if exact match found
  - Fuzzy match score from product/FAQ search

Factor 3: Context coherence score (20% weight)
  - Does the current message fit logically with the last 5 messages?
  - 100 = highly coherent (continuation of existing topic)
  - 50 = neutral (new topic, no conflict)
  - 0 = contradictory or out of context

Final confidence = (Factor1 × 0.50) + (Factor2 × 0.30) + (Factor3 × 0.20)
Score is an integer 0–100 (rounded down, no decimals).
```

### Intent Categories and Confidence Bands

```
Intent categories (mutually exclusive, AI selects highest-probability):
  GREETING      — Customer says hello, opening message
  QUESTION      — Customer asks about product, price, stock, shipping, returns
  BUY           — Customer expresses intent to purchase
  COMPLAINT     — Customer reports a problem (not received, wrong item, refund)
  PRICE_QUERY   — Customer asks specifically about discounts or negotiation
  CUSTOM_ORDER  — Customer requests modification, engraving, bulk pricing
  HUMAN_REQUEST — Customer explicitly asks for a human agent
  OTHER         — Message does not fit any above category

Confidence bands and actions:

  90–100%: High confidence
    → AI responds directly and takes full action (answer question, start order flow, etc.)
    → No clarification needed
    → Logged as "auto-handled"

  70–89%: Medium confidence
    → AI responds and takes action
    → Response may include one implicit clarification woven into answer
      Example: "สนใจสินค้า A ใช่ไหมคะ? ราคา ฿199 สั่งได้เลยนะคะ"
    → Logged as "handled with clarification"

  50–69%: Low confidence (below threshold)
    → AI does NOT respond with content
    → AI sends clarification request (see Clarification Flow below)
    → Logged as "clarification requested"
    → If this is already the 2nd clarification attempt → handoff immediately

  Below 50%: Very low confidence
    → AI sends clarification request (same as 50–69% band)
    → After 1 failed clarification → handoff on 2nd failure
    → Exception: if intent detected is HUMAN_REQUEST at any confidence → immediate handoff

  Special case — HUMAN_REQUEST intent detected at any confidence level:
    → Immediate handoff; no clarification attempted; no content response
```

### Multi-Intent Handling

```
If message contains multiple intents (e.g., question + buy in same message):
  "สินค้า A มีสีดำไหม ถ้ามีขอ 2 ชิ้นเลย"
  
  AI extracts ALL intents detected:
    Intent 1: QUESTION (color availability) — confidence: 85%
    Intent 2: BUY (2 units) — confidence: 88%
  
  Rule: If 2 intents detected, both must be ≥70% to handle both.
  
  Handling priority:
    1. Answer the question FIRST (resolve QUESTION intent)
    2. Then proceed to order flow (BUY intent)
    Combined into a single response to avoid back-and-forth.
  
  Maximum intents per message AI will handle: 2
  If 3+ intents detected: treat as CUSTOM_ORDER, confidence capped at 65% → clarification
  
  Example multi-intent response (Casual tone):
    "สีดำมีค่ะ สต็อก 15 ชิ้น ขอยืนยัน: สินค้า A สีดำ x2 ถูกต้องไหมคะ? 😊
     [✅ ถูกต้อง] [❌ เปลี่ยนแปลง]"
```

### Clarification Request Flow

```
Trigger: AI confidence < 70% on incoming message

Step 1: AI sends clarification message (attempt 1 of 2)
  Clarification message template (Thai, Casual tone):
    "ขอโทษนะคะ ไม่แน่ใจว่าต้องการอะไร ช่วยบอกได้ไหมคะ? เช่น
     🔍 ถามเรื่องสินค้า | 🛒 ต้องการสั่ง | ❓ อื่นๆ"
  Clarification message template (English, Casual tone):
    "Sorry, I'm not sure what you need. Could you help clarify?
     🔍 Product question | 🛒 Ready to order | ❓ Something else"
  
  Counter written: conversation.clarification_attempts = 1

Step 2: Customer responds

  Option A: Customer's response is ≥70% confidence
    → Process normally; clarification_attempts reset to 0
    → No handoff

  Option B: Customer's response is still <70% confidence (attempt 2)
    → AI sends second clarification (attempt 2 of 2):
      Thai: "ขอโทษค่ะ ยังไม่เข้าใจเลย ขอโอนให้เจ้าหน้าที่ช่วยดูแลแทนนะคะ 🙏"
      English: "I'm sorry, I still can't understand. Let me connect you with our team."
    → Immediately after sending: trigger handoff (reason: "2 clarification attempts failed")
    → clarification_attempts counter is NOT reset (stays at 2 for agent to see)
    → Agent sees in context: "AI failed 2 clarification attempts"

  Clarification attempts are per-conversation-session.
  Session ends when: customer orders, conversation is closed, or agent takes over.
  Counter resets to 0 when: a new session begins.
```

### Specific Intent Examples with Confidence Scores

```
Example 1: Clear buy intent
  Input: "ได้ครับ ขอ 2 ชิ้น"
  Intent: BUY (96%), confidence: 94%
  Action: Start order flow immediately

Example 2: Clear question
  Input: "สินค้า A ราคาเท่าไหร่?"
  Intent: QUESTION (98%), KB match: 95%, context: 50%
  Confidence: (98×0.5) + (95×0.3) + (50×0.2) = 49 + 28.5 + 10 = 87%
  Action: Answer from knowledge base

Example 3: Complaint — low confidence
  Input: "ยังไม่ได้รับของ"
  Intent: COMPLAINT (72%), KB match: 0% (no KB article for fulfillment issues), context: 50%
  Confidence: (72×0.5) + (0×0.3) + (50×0.2) = 36 + 0 + 10 = 46%
  Action: Clarification request (attempt 1)
  Note: If a second message also scores <70% → handoff (complaint requires CRM/order context)

Example 4: Human request
  Input: "อยากคุยกับคน"
  Intent: HUMAN_REQUEST (99%)
  Action: Immediate handoff regardless of composite score

Example 5: Mixed intent — handled
  Input: "สีดำมีไหม ถ้ามีขอเลย 1 ชิ้น"
  Intent 1: QUESTION — color availability (88%), Intent 2: BUY (85%)
  Both ≥70% → handle both in one response (answer then proceed to order)

Example 6: Ambiguous
  Input: "อันนั้นยังมีไหม"
  Intent: QUESTION (58%), KB match: 0% (no referent identified), context: 30%
  Confidence: (58×0.5) + (0×0.3) + (30×0.2) = 29 + 0 + 6 = 35%
  Action: Clarification request (attempt 1)
```

---

## Knowledge Base Lookup

### Search Priority Order

```
Step 1: Exact product name match (string equality, case-insensitive, Thai normalized)
  Match criteria: Exact match after Thai character normalization (strip tone marks for comparison)
  If found: return product record immediately; skip remaining steps
  Time budget: ≤20ms

Step 2: Fuzzy product name match (Levenshtein distance ≤2 characters OR ≥80% token similarity)
  Uses: Thai word tokenization (PyThaiNLP-equivalent) then token overlap ratio
  Threshold: ≥80% token similarity to count as match
  Max results returned: top 3 products ranked by similarity score (descending)
  If found: return top 3; proceed to KB ranking
  Time budget: ≤40ms

Step 3: Category match (customer message contains category keyword)
  Example: "เสื้อ" → category: clothing → return top 3 in-stock products in that category
  Ranking: by sales volume (30-day) descending
  Max results: 3 products
  If found: return these 3; proceed to KB ranking
  Time budget: ≤30ms

Step 4: FAQ keyword match (customer message contains FAQ trigger keyword)
  FAQ stored as: question_keywords[] → answer_text
  Match: if ≥1 of question_keywords found in customer message (exact or fuzzy ≥80%)
  Max results: top 1 FAQ match (best keyword overlap)
  If found: return FAQ answer
  Time budget: ≤20ms

Step 5: Description keyword search (full-text search across product descriptions)
  Uses: full-text index on product.description field
  Max results: top 3 products by relevance score
  If found: return top 3
  Time budget: ≤60ms

Step 6: No match found (all 5 steps returned 0 results)
  Action: AI responds with:
    Thai: "ขอโทษค่ะ ไม่พบข้อมูลที่ต้องการ ลองระบุชื่อสินค้าให้ชัดเจนขึ้นได้ไหมคะ?"
    English: "Sorry, I couldn't find that. Could you describe what you're looking for in more detail?"
  This does NOT count as a clarification attempt.
  Confidence from Factor 2 (KB match): 0% (which may push composite below 70% → triggers clarification)

Total KB lookup budget: ≤100ms (all steps run in parallel where possible; first match wins)
```

### Product Data Freshness

```
Product catalog data (prices, stock, images):
  Source: Product catalog MongoDB collection
  Cache: Redis, key: "kb:product:{product_id}", TTL: 60 seconds
  On cache miss: fetch from MongoDB (≤30ms), re-cache

Stock level:
  Read from Redis cache (60-second TTL)
  If stock = 0: AI responds "สินค้าหมดชั่วคราว" and suggests closest alternative
  Alternative selection: top 1 product from same category with stock > 0, ranked by 30-day sales

FAQ data:
  Cache: Redis, key: "kb:faq:{workspace_id}", TTL: 300 seconds (5 minutes)
  FAQ updates in Settings take effect within 300 seconds (next cache expiry)

Max products returned to AI for response generation: 3
  If 3 products found, AI selects the most relevant 1–3 to mention in response
  AI never mentions more than 3 products in a single message
```

---

## Order Flow

### Overview

Order flow activates when AI detects BUY intent at ≥70% confidence. The flow has 5 stages with strict timeouts and rollback rules.

```
Stage 1: Product Confirmation
Stage 2: Upsell Offer (once per product, once per session)
Stage 3: Cross-sell Offer (max 2 items, once per session)
Stage 4: Order Summary + Confirmation
Stage 5: Order Creation + Payment Link
```

### Stage 1: Product Confirmation

```
AI detects BUY intent.

AI message (Casual tone, Thai):
  "ยืนยันรายการนะคะ:
   📦 [Product Name] x[Quantity]
   ราคา: ฿[Unit Price] × [Quantity] = ฿[Line Total]
   
   ถูกต้องไหมคะ?
   [✅ ถูกต้อง] [✏️ แก้ไข] [❌ ยกเลิก]"

Quick reply buttons: 3 buttons shown
  Button 1: "✅ ถูกต้อง" → advance to Stage 2
  Button 2: "✏️ แก้ไข" → AI asks "ต้องการแก้ไขอะไรคะ?" (free text, restarts intent detection)
  Button 3: "❌ ยกเลิก" → AI says "ไม่เป็นไรนะคะ ถ้าต้องการกลับมาสั่งได้เลยค่ะ 😊"; order flow ends

Customer timeout: 30 minutes of silence after Stage 1 message
  On timeout: session state saved (order_in_progress = stage_1_confirmed)
  Follow-up: NOT fired from here (follow-up fires from interest signal, not from order flow)
  If customer returns within 2 hours: session restored; resume from last stage
  If customer returns after 2 hours: session cleared; order flow must restart from beginning
  Session stored in Redis, key: "order_session:{room_id}", TTL: 7200 seconds (2 hours)
```

### Stage 2: Upsell Offer

```
Trigger: Stage 1 confirmed (customer clicked ✅)

Upsell selection criteria:
  1. Product must have a defined upsell relationship in catalog (product.upsell_product_id)
  2. Upsell product must be in stock (stock > 0)
  3. Upsell price must be ≤ 150% of confirmed product's unit price
     Formula: upsell_price ≤ confirmed_unit_price × 1.50
     Example: Product ฿199 → upsell must be ≤ ฿298.50 → round down to ฿298
  4. If upsell price > 150% of original: skip upsell; proceed directly to Stage 3

  If no upsell relationship defined OR price exceeds cap: skip Stage 2 entirely; go to Stage 3

Upsell message (Casual tone, Thai):
  "อยากลอง [Upsell Product Name] ดูไหมคะ? 😊
   คุณภาพดีกว่า ราคา ฿[Upsell Price]
   [Product image thumbnail if available]
   [✅ เอาเลย] [❓ ต่างกันยังไง] [❌ ไม่ดีค่ะ]"

Button behaviors:
  "✅ เอาเลย" → Replace original product with upsell product in order; advance to Stage 3
  "❓ ต่างกันยังไง" → AI shows product comparison (from product.comparison_notes field if set, else description)
                   After showing comparison: show same 3 buttons again (max 1 follow-up question)
                   If customer asks again → advance to Stage 3 without upsell (too many questions = friction)
  "❌ ไม่ดีค่ะ" → Record: upsell_declined = true for this session; advance to Stage 3

Upsell rules:
  - Offered maximum 1 time per session per product (not per order — if customer adds new product, that product's upsell is offered)
  - If upsell_declined = true for this product: do NOT offer again in same session
  - upsell_declined flag stored in Redis session, key: "order_session:{room_id}", TTL: 7200 seconds

Customer timeout at Stage 2: 30 minutes
  On timeout: advance to Stage 3 without upsell (treat as decline)
  Do NOT resend upsell offer after timeout
```

### Stage 3: Cross-sell Offer

```
Trigger: Stage 2 complete (accepted, declined, or skipped)

Cross-sell selection criteria:
  1. Products must have a defined cross-sell relationship in catalog (product.cross_sell_ids[])
  2. Each cross-sell product must be in stock
  3. Maximum 2 products shown (even if more are defined — show top 2 by sales volume)
  4. Cross-sell products must NOT be same as the main product or upsell product already in order

  If 0 cross-sell products available: skip Stage 3; go to Stage 4

Cross-sell message (Casual tone, Thai):
  "อยากเพิ่มสินค้าอื่นไหมคะ? 🛍️
   [Product 1 Name] ฿[Price]
   [Product 2 Name] ฿[Price]
   
   [+ เพิ่มทั้งหมด] [+ เพิ่ม [P1 only]] [+ เพิ่ม [P2 only]] [ไม่ดีค่ะ]"

If only 1 cross-sell product available:
  "อยากเพิ่ม [Product Name] ฿[Price] ไหมคะ?
   [✅ เพิ่มเลย] [❌ ไม่ดีค่ะ]"

Cross-sell rules:
  - Offered maximum 1 time per session (not per product)
  - If declined: cross_sell_declined = true; do NOT offer again in same session
  - Customer can select both, one, or none
  - Selected items added to order line items

Customer timeout at Stage 3: 30 minutes
  On timeout: advance to Stage 4 without cross-sell items
```

### Stage 4: Order Summary + Final Confirmation

```
Trigger: Stage 3 complete (items selected, declined, or skipped)

Order summary message (Casual tone, Thai):
  "สรุปรายการสั่งซื้อค่ะ 🛒
   ─────────────────────────
   [Line 1: Product Name × Qty = ฿Total]
   [Line 2: Product Name × Qty = ฿Total]  ← if cross-sell added
   ─────────────────────────
   รวม: ฿[Grand Total]
   ที่อยู่จัดส่ง: [Address if on file, else "กรุณาแจ้งที่อยู่"]
   ─────────────────────────
   ยืนยันออเดอร์นี้ได้เลยนะคะ 😊
   [✅ ยืนยันสั่งซื้อ] [✏️ แก้ไขรายการ] [❌ ยกเลิก]"

Fields shown in summary (all required):
  - Product name (full name from catalog)
  - Quantity (integer)
  - Unit price (฿ format)
  - Line total (unit price × quantity)
  - Grand total (sum of all line totals)
  - Shipping address (if stored in customer profile; otherwise show "กรุณาแจ้งที่อยู่")
  - Discount (if applied, shows: "ส่วนลด -฿[Amount]" line)

If customer clicks "✏️ แก้ไขรายการ":
  AI asks: "ต้องการแก้ไขอะไรคะ?" (free text)
  Customer response: AI re-parses and updates order; returns to Stage 4 summary
  Max edits: 3 rounds (if customer edits 4 times: handoff, reason: "excessive order modifications")

If customer clicks "❌ ยกเลิก":
  AI: "ไม่เป็นไรนะคะ ถ้าต้องการกลับมาสั่งได้เลยค่ะ 😊"
  Order flow ends; session cleared; no order created
  order_abandoned = true written to session log (for analytics)

Customer timeout at Stage 4: 60 minutes (longer — customer may be checking address)
  On timeout: session preserved for 2 hours from last Stage 4 message
  No action taken (do not auto-confirm — order confirmation requires explicit customer action)
```

### Stage 5: Order Creation + Payment Link

```
Trigger: Customer clicks "✅ ยืนยันสั่งซื้อ" in Stage 4

Execution (all atomic):
  T+0ms    Customer confirms
  T+100ms  Order record created in MongoDB:
             order.source = "ai"
             order.status = "PENDING_PAYMENT"
             order.created_by = "ai_agent"
             order.workspace_id = [workspace]
             order.customer_id = [customer]
             order.line_items = [array of confirmed items]
             order.total = [grand total]
             order.created_at = NOW()
  T+300ms  Payment link generated via Payso integration
             Link format: https://pay.onebear.com/[unique_token]
             Token TTL: 24 hours (expires after 24 hours if unpaid)
  T+500ms  Payment link sent to customer via same channel they messaged from
  T+500ms  AI sends confirmation message:

  Confirmation message (Casual tone, Thai):
    "สั่งซื้อเรียบร้อยแล้วนะคะ 🎉
     ออเดอร์: #[Order ID]
     รวม: ฿[Grand Total]
     
     👇 ชำระเงินได้ที่นี่เลยค่ะ
     [ชำระเงิน ฿[Grand Total]] ← clickable payment link button
     
     ลิงก์หมดอายุใน 24 ชั่วโมงนะคะ
     ขอบคุณที่ใช้บริการค่ะ 💚"

  T+500ms  Room label updated: "AI" badge added to room
  T+500ms  Order appears in Inbox (room list) with status PENDING_PAYMENT
  T+500ms  Session cleared from Redis

If order creation fails (MongoDB write error):
  AI sends: "ขอโทษค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งนะคะ"
  Retry: 1 time (wait 500ms, attempt again)
  If 2nd attempt also fails: handoff to agent (reason: "Order creation failed — technical error")
  Agent notified with full order details so they can create manually

Payment link generation timeout:
  If Payso does not return link within 2500ms:
  Retry: 1 time
  If still no link: create order without payment link; send:
    "สั่งซื้อเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะส่งลิงก์ชำระเงินให้ภายใน 5 นาทีนะคะ"
    Handoff to agent to generate payment link manually
```

### Upsell & Cross-sell Detailed Specification

#### Upsell Selection Criteria (Exact Rules)

```
A product qualifies as an upsell when ALL conditions are true:
  1. product.upsell_product_id is non-null (relationship explicitly defined by admin in catalog)
  2. upsell_product.status = ACTIVE
  3. upsell_product.stock > 0 (at time of Stage 2 trigger — real-time Redis check)
  4. upsell_product.price ≥ confirmed_product.unit_price × 1.10
     (minimum 110% of base price — must offer meaningful upgrade, not same price)
  5. upsell_product.price ≤ confirmed_product.unit_price × 1.50
     (maximum 150% of base price — default cap, see GAP-AI-03)
  6. Configurable max: workspace_settings.upsell_max_price_pct (default 150%, configurable 110%–200%)
     If admin sets to 200%: formula becomes ≤ confirmed_price × 2.00

If upsell_product.price is outside the 110%–[max_pct]% band: skip upsell silently.
If no upsell_product_id defined: skip upsell silently.
Both cases: advance to Stage 3 with no message about upsell.
```

#### Cross-sell Selection Algorithm (Exact Priority)

```
Cross-sell selection runs at Stage 3 trigger. Priority order:

Priority 1: Admin-defined relationship
  Source: product.cross_sell_ids[] (array of product_ids set in catalog admin panel)
  Filter: in-stock (stock > 0), not already in order, not already rejected this session
  Sort: by admin-defined order (array index), take top 2

Priority 2: Co-occurrence score (if Priority 1 yields fewer than 2 products)
  Source: product_cooccurrence table, nightly computed batch job
  Formula: cooccurrence_score = orders_containing_both_products / orders_containing_base_product
  Threshold: score ≥ 0.60 (i.e., ≥60% of customers who bought main product also bought this)
  Filter: in-stock, not in order, not in Priority 1 results
  Sort: score descending, take enough to fill remaining slots (up to 2 total)

Priority 3: Fallback (if Priority 1 + 2 yield fewer than 2 products)
  Source: product catalog, same workspace
  Filter: different category from main product, in-stock, not in order
  Sort: 30-day units_sold descending
  Take enough to fill remaining slots (up to 2 total)

Final list: at most 2 products total (from Priority 1+2+3 combined)
If 0 products found after all priorities: skip Stage 3 silently
```

#### Rejection Memory (Exact Storage)

```
Upsell rejection stored in Redis session:
  Key: "order_session:{room_id}"
  Field: rejected_upsells (JSON array of product_id strings)
  Example: {"rejected_upsells": ["prod_abc", "prod_xyz"], ...}
  TTL: 7200 seconds (same as session TTL)

Cross-sell state stored in Redis session:
  Field: cross_sell_declined (boolean, default false)
  Field: cross_sell_shown (JSON array of product_id strings shown to customer)
  Once cross_sell_declined = true: skip Stage 3 entirely on any restart within session
  Cross_sell_shown prevents re-offering same product if customer asks for "other options"

Session cleared when: order completed, handoff triggered, room closed, or idle 4 hours (see GAP-AI-02)
After session cleared: rejection memory is gone. New session = fresh slate for all offers.
```

#### Cross-sell Discount Logic

```
cross-sell discount is NOT applied by default.
Only applied when:
  workspace_settings.crosssell_discount_enabled = true (Admin-configurable, default: false)
  AND workspace_settings.crosssell_discount_pct > 0 (integer 1–30, default: 0)

When enabled:
  Discount applied to cross-sell item line price before showing to customer
  Discounted price shown in cross-sell message: "฿[Original] → ฿[Discounted] (ลด [X]%)"
  Discount recorded in order.discount_lines[] when customer adds cross-sell item
  Discount amount: cross_sell_item.price × (crosssell_discount_pct / 100), rounded to ฿1

Upsell items: discount NEVER applied. Upsell price is always at full catalog price.
```

### Payment Monitoring (After Payment Link Sent)

```
State machine after Stage 5 (payment link delivered):

order.status transitions AI monitors:
  PENDING_PAYMENT → PENDING_VERIFY  (customer submitted bank slip)
  PENDING_PAYMENT → PAID            (gateway payment confirmed via webhook)
  PENDING_PAYMENT → PAYMENT_EXPIRED (24h elapsed, no payment)
  PENDING_VERIFY  → COMPLETED       (slip verified and approved)
  PENDING_VERIFY  → PENDING_PAYMENT (slip rejected — customer must resubmit)

Polling logic:
  Worker: Quartz.NET job "PaymentMonitorJob" in OneBear.Worker
  Interval: every 300 seconds (5 minutes)
  Query: SELECT status FROM orders WHERE id = :order_id
  Job stops when: status is COMPLETED, CANCELLED, or PAYMENT_EXPIRED
  Job also stops when: 24h have elapsed from order.created_at (fail-safe)

Webhook priority:
  Payso sends webhook on payment events → processed immediately (< 5 seconds)
  Webhook triggers same AI actions as poll detection (faster path — preferred)
  If webhook received while poll is pending: poll result is ignored (idempotent)

Customer slip detection:
  When customer sends image/file in chat while order.status = PENDING_PAYMENT:
    If workspace_settings.auto_submit_slip = true (Admin-configurable, default: false):
      System auto-submits image to slip verification pipeline
      AI sends: "ได้รับสลิปแล้วค่ะ กำลังตรวจสอบให้นะคะ 🔍"
    If auto_submit_slip = false (default):
      AI sends: "ได้รับรูปภาพแล้วค่ะ เจ้าหน้าที่จะตรวจสอบสลิปให้นะคะ 🙏"
      Room tagged: "slip_received" for agent to see
      Agent receives notification (same as manual handoff notification)
```

### Order Flow Rollback Rules

```
Customer abandons at any stage (session expires after 2 hours):
  Stage 1 timeout → No order created; no record written; session cleared
  Stage 2 timeout → No order created; session cleared
  Stage 3 timeout → No order created; session cleared
  Stage 4 timeout → No order created; session cleared
    (order is NOT created until Stage 5 confirmation)

If customer returns after session expiry (>2 hours):
  AI treats it as a new conversation
  AI does NOT reference the abandoned order automatically
  If customer mentions "ที่คุยกันไว้" (the previous conversation):
    AI confidence on this intent will likely be low → clarification → may need handoff

Rollback is simple because Stage 5 is the only point where an order record is written.
Stages 1–4 exist entirely in Redis session state.
```

---

## Language Detection & Response Behavior

### Detection Algorithm

```
Detection method: Token-level language classification
  1. Tokenize the customer message (Thai word segmentation + space tokenization for Latin)
  2. Classify each token as: THAI | ENGLISH | NUMERIC | PUNCTUATION | UNKNOWN
  3. Count THAI tokens and ENGLISH tokens (ignore NUMERIC, PUNCTUATION, UNKNOWN in ratio)
  4. Calculate: thai_ratio = thai_tokens / (thai_tokens + english_tokens)
  5. Apply rules below

Rules:
  thai_ratio ≥ 0.60 → respond in Thai
    (Example: "ราคา A product?" → 1 Thai token "ราคา", 2 English tokens → ratio 1/3 = 33% Thai)
    Wait — this would be English. Rechecked:
    "ราคา product A?" → "ราคา" = 1 Thai, "product", "A" = 2 English → 1/3 = 33% Thai → respond English
    "สินค้า A ราคาเท่าไหร่" → "สินค้า", "ราคา", "เท่า", "ไหร่" = 4 Thai, "A" = 1 English → 4/5 = 80% Thai → respond Thai

  thai_ratio = 0.00 (0 Thai tokens, all English) → respond in English
  thai_ratio > 0.00 AND thai_ratio < 0.60 → treat as mixed → respond in Thai
  (Mixed default is Thai, not English — most Onebear customers are Thai)

Minimum message length for language detection: 2 tokens
  If message has ≤1 token (e.g., "OK", "ได้"): use conversation's established language from context
  If no established language in context: default to Thai

Supported languages: Thai (TH), English (EN)
  All other languages detected → respond in Thai + append notice
```

### Language Notice for Unsupported Languages

```
Triggered when: message is detected as neither Thai nor English
  (thai_ratio = 0.00 AND message contains no recognizable English words)

Thai notice appended to bottom of response:
  "หมายเหตุ: เราสามารถตอบได้เฉพาะภาษาไทยและภาษาอังกฤษเท่านั้นค่ะ 🙏"

Notice placement: last line of AI response, separated by blank line
Notice font/styling: same as regular message text (no special formatting in chat bubbles)
Notice appears: once per session (not repeated on every message)
  After first notice: session flag language_notice_shown = true (stored in Redis session)
  Subsequent unsupported-language messages: AI responds in Thai without repeating notice

Example:
  Customer: "Berapa harga?"
  AI response:
    "สวัสดีค่ะ ยินดีให้บริการนะคะ 😊 ต้องการสอบถามเรื่องอะไรคะ?

    หมายเหตุ: เราสามารถตอบได้เฉพาะภาษาไทยและภาษาอังกฤษเท่านั้นค่ะ 🙏"
```

### Language Switching Mid-Conversation

```
If customer switches language mid-conversation (e.g., started Thai, now sends English):
  AI detects language of the CURRENT message (not history)
  AI responds in language of current message (per rules above)
  No special notice required for switching
  Context (last 5 messages) remains visible to AI regardless of language

If customer switches to unsupported language mid-conversation:
  AI responds in Thai
  Language notice shown ONLY if language_notice_shown = false (once per session)
```

---

## Handoff Flow

### Handoff Triggers (All 4 conditions)

```
TRIGGER 1: Confidence below threshold
  Condition: composite confidence score < workspace_settings.confidence_threshold
  Default threshold: 70% (configurable: 50–90%)
  Fire: immediately (do not wait for next message)

TRIGGER 2: Customer explicitly requests human
  Condition: intent = HUMAN_REQUEST (any confidence level)
  Thai detection phrases (any of): "คุยกับคน", "ขอคุยกับเจ้าหน้าที่", "ต้องการพนักงาน",
    "สอบถามคน", "ให้คนช่วย", "อยากคุยกับคน", "staff", "human", "agent", "real person"
  Fire: immediately after detection

TRIGGER 3: 2 consecutive clarification attempts both failed
  Condition: conversation.clarification_attempts = 2 AND latest confidence < 70%
  Fire: immediately after 2nd clarification fails

TRIGGER 4: Custom order or complexity detected
  Condition: intent = CUSTOM_ORDER detected at any confidence ≥ 50%
  Examples: custom engraving, bulk B2B pricing, special delivery requirements
  Fire: immediately

TRIGGER 5: Order modification excessive
  Condition: customer has edited order summary ≥ 4 times in Stage 4
  Fire: immediately

TRIGGER 6: AI model timeout
  Condition: AI model did not return response within 1800ms
  Fire: immediately after timeout fallback message sent
```

### Handoff Execution

```
T+0ms    Handoff trigger fires
T+10ms   AI sends handoff message to customer:
  Thai (Casual): "ขอโทษนะคะ ขอโอนสายให้เจ้าหน้าที่ช่วยดูแลต่อนะคะ สักครู่นะคะ 🙏"
  English (Casual): "I'll connect you with our team right away. Please hold on a moment! 🙏"

T+20ms   Handoff context package built (see Context Payload below)
T+30ms   Room assignment: room.ai_active = false; room.status = "PENDING_AGENT"
T+30ms   Room label updated in Inbox:
            Before: [🤖 AI] badge
            After:  [⚠️ Handoff] badge (yellow, pulsing for 60 seconds then static)
T+30ms   Agent notification sent (see Notification below)
T+30ms   AI stops processing new messages for this room
           (eligibility check 3 now fails — room has ai_active = false)
```

### Handoff Context Payload (Exact Fields)

```
Context package sent to agent (visible in Handoff Info panel in chat):

{
  "handoff_reason": "confidence_low | human_requested | clarification_failed | custom_order | order_edit_exceeded | ai_timeout",
  "handoff_reason_display": "[Human-readable reason, Thai]",
  "confidence_score": 45,           // integer, 0–100; null if trigger is human_requested
  "detected_intent": "COMPLAINT",   // last detected intent before handoff
  "clarification_attempts": 2,      // integer, 0–2
  "customer_id": "cust_xxx",
  "customer_name": "Niran K.",
  "customer_platform": "LINE",
  "customer_segment": "Hot",        // from CRM segment tag
  "customer_lifetime_orders": 3,    // integer
  "customer_lifetime_value": 1200,  // integer, ฿
  "customer_ai_blocked": false,     // boolean
  "last_5_messages": [              // array of message objects
    {
      "sender": "customer | ai",
      "text": "...",
      "timestamp": "2026-04-09T14:30:00Z",
      "intent_detected": "QUESTION",
      "confidence": 72
    }
  ],
  "order_in_progress": {           // null if no order in progress
    "stage": 2,                    // 1–4
    "items": [
      { "product_id": "prod_abc", "product_name": "Product A", "quantity": 2, "unit_price": 199 }
    ],
    "upsell_declined": true,
    "cross_sell_declined": false
  },
  "kb_search_results": [           // what AI found in KB before giving up
    { "type": "product | faq", "name": "...", "match_score": 72 }
  ],
  "session_start_time": "2026-04-09T14:25:00Z",
  "ai_version": "1.0.0"
}
```

### Agent Notification

```
Notification channels (all fire simultaneously):
  1. In-app badge: Room moves to top of Inbox list; badge count increments by 1
  2. In-app toast (desktop): "[Customer Name] needs agent — [reason in Thai]" (5 seconds, dismissible)
  3. Push notification (mobile app, if agent has mobile installed): same text as toast
  4. Audio alert: 1 short chime (if agent has desktop app focused, not muted)

Notification goes to:
  - If room has assigned agent: that agent's user account
  - If no assigned agent: all agents in same workspace with Chat.View permission
  - If 0 agents online: notification still sent (will appear when they log in); room stays in "Handoff" state

Unread handoff rooms: sorted to top of Inbox list above all non-handoff rooms
```

### Return to AI (Agent → AI)

```
When can agent return conversation to AI?
  - At any time, if: room.ai_active = false AND workspace_settings.ai_sales_agent_enabled = true
  - Button: "Return to AI" in room action panel (top-right of chat view)

Restrictions on returning to AI:
  1. Cannot return to AI if ai_blocked = true for this customer
  2. Cannot return to AI if workspace AI is disabled
  3. Cannot return to AI if channel AI is disabled
  4. Cannot return to AI if confidence_threshold > 90% (safety — agent should not set impossible threshold)
     → In this case: button hidden (not greyed out)

What happens when agent returns to AI:
  - room.ai_active = true
  - clarification_attempts reset to 0
  - No message sent to customer (silent transition)
  - Room label: [⚠️ Handoff] → [🤖 AI]
  - AI resumes on next customer message

Agent can return to AI multiple times in a session (no limit).
```

---

## Follow-up Auto-trigger

### Trigger Condition: What Qualifies as "Interested"

```
A customer is classified as "interested" when ALL of the following are true:
  1. AI has successfully detected QUESTION or BUY intent at confidence ≥70% in this session
  2. A specific product was mentioned OR identified in KB search results during the session
  3. Customer has NOT completed an order in this session
  4. Customer has NOT sent any message for 120 minutes (2 hours) since the last AI response

Condition 4 measurement:
  Start timer: at timestamp of last outgoing AI message in this session
  Timer fires: at T+120 minutes from that timestamp
  Timer cancelled: if customer sends any message before T+120 minutes
```

### Follow-up Timing: Exact Rules

```
Follow-up 1:
  Fires: T+120 minutes after last AI message (2 hours)
  Send window check: MUST fall within 09:00–21:00 Bangkok time (ICT, UTC+7)
  If T+120 minutes falls outside window:
    Delay until next 09:00 Bangkok time
    Example: Last AI message at 22:00 → T+120 = 00:00 → delay until 09:00 same day (9 hours later)
    Example: Last AI message at 19:30 → T+120 = 21:30 → delay until 09:00 next day

Follow-up 2:
  Fires: T+24 hours after Follow-up 1 was sent (not from original last-AI-message timestamp)
  Same send window rule: 09:00–21:00 Bangkok time
  If Follow-up 2 would fall outside window: same delay logic as above

No Follow-up 3:
  After Follow-up 2: stop permanently for this session
  follow_up_exhausted = true (stored in session log, not in Redis — this is permanent)
```

### Follow-up Message Content

```
Follow-up 1 message template (Casual tone, Thai) — normal stock:
  "สวัสดีค่ะ [Customer Name if known, else skip] 😊
   ยังสนใจ [Product Name] อยู่ไหมคะ?
   ราคา ฿[Current Price] | มีสต็อก [Stock Count] ชิ้น
   [🛒 สั่งได้เลยค่ะ]"

Follow-up 1 message template (Casual tone, Thai) — low stock (stock ≤ 5 units):
  "สวัสดีค่ะ [Customer Name if known, else skip] 😊
   ยังสนใจ [Product Name] อยู่ไหมคะ?
   ราคา ฿[Current Price] | เหลือน้อยแล้ว! สต็อก [Stock Count] ชิ้น 🔥
   [🛒 สั่งได้เลยค่ะ]"

Stock urgency rule:
  If product.stock ≤ 5 at the time of sending follow-up:
    Add "เหลือน้อยแล้ว!" prefix to stock display
    Add 🔥 emoji after stock count
    This applies to both Follow-up 1 and Follow-up 2
  Stock is checked at send time (real-time Redis read), not at timer creation time

Follow-up 1 message template (Casual tone, English):
  "Hi [Customer Name if known]! 😊
   Still interested in [Product Name]?
   ฿[Current Price] | [Stock Count] in stock
   [🛒 Order now]"

Follow-up 2 message template (Casual tone, Thai):
  "แจ้งเตือนนะคะ [Product Name] ยังมีอยู่ค่ะ
   สต็อกเหลือ [Stock Count] ชิ้น — ไม่อยากพลาดนะคะ 😊
   [🛒 สั่งได้เลยค่ะ] [👤 คุยกับเจ้าหน้าที่]"

Follow-up 2 message template (Casual tone, English):
  "[Product Name] is still available!
   Only [Stock Count] left — don't miss out 😊
   [🛒 Order now] [👤 Talk to staff]"

Notes:
  - Language of follow-up: matches language used in original session (Thai or English)
  - [Stock Count] is fetched in real-time at send time (not at session creation)
  - If stock = 0 at follow-up send time: do NOT send follow-up (cancel silently)
    Reason: sending follow-up for out-of-stock product creates negative experience
  - Product price is fetched in real-time at send time

Tone variation:
  - Formal workspace: replace "😊" with nothing; remove casual particles (ค่ะ stays, slang removed)
  - Cute workspace: "สินค้าตัวนี้น่ารักมากเลยนะคะ~ ยังสนใจอยู่ไหมคะ? 🎀"
```

### Conditions That Stop Follow-up (All Cancel the Timer)

```
Any of these events occurring before timer fires cancels follow-up:
  1. Customer sends any message (even a single character)
  2. Customer places an order (order.status = PENDING_PAYMENT or beyond)
  3. Agent manually takes over the room (room.ai_active = false via handoff or manual)
  4. Customer's ai_blocked flag set to true
  5. Workspace AI disabled (workspace_settings.ai_sales_agent_enabled = false)
  6. Channel AI disabled for this customer's channel
  7. Room is closed (room.status = CLOSED or RESOLVED)
  8. Product mentioned in session goes out of stock (stock = 0)
     → Stock check runs at: T+110 minutes (10 minutes before Follow-up 1 would fire)
     → If stock = 0: cancel timer; log reason = "product_out_of_stock"

After Follow-up 1 fires, timer for Follow-up 2 is set.
Same conditions 1–8 can cancel Follow-up 2 timer as well.
```

---

## Discount & Price Negotiation

### Trigger

```
Triggered when: intent = PRICE_QUERY detected at ≥70% confidence
  OR: customer message contains any of: "ลดได้ไหม", "ราคาดีกว่านี้ได้ไหม", "discount", "cheaper",
      "ถูกกว่านี้", "ต่อราคา", "ราคาพิเศษ", "มีโปรไหม", "ส่วนลด"

Eligibility check (runs before offering discount):
  1. Is discount enabled for this workspace? (workspace_settings.discount_enabled = true)
     If false: AI responds "ราคานี้เป็นราคามาตรฐานค่ะ ไม่สามารถปรับได้นะคะ"; end
  2. Does this product have a discount_allowed flag? (product.discount_allowed = true)
     If false: AI responds "สินค้านี้ไม่สามารถลดราคาได้นะคะ"; end
  3. Has a discount already been offered in this session? (session.discount_offered = true)
     If true: AI responds "ได้เสนอส่วนลดไปแล้วนะคะ ไม่สามารถปรับเพิ่มได้อีกค่ะ"; end

If all 3 pass: proceed to discount offer.
```

### Discount Offer Flow

```
Step 1: AI offers maximum automatic discount
  Maximum automatic discount: workspace_settings.max_auto_discount_pct (default: 10%, range: 1–30%)
  AI calculates: discount_amount = unit_price × (max_auto_discount_pct / 100)
  Discounted price: unit_price - discount_amount (rounded to nearest ฿1)
  
  AI message (Casual tone, Thai):
    "เพื่อตอบแทนที่สนใจนะคะ ลดให้ [X]% ได้เลยค่ะ
     ราคาพิเศษ: ฿[Discounted Price] (จากปกติ ฿[Original Price])
     [✅ รับส่วนลด] [❌ ไม่ดีค่ะ]"
  
  session.discount_offered = true (written immediately when message sent)

Step 2A: Customer accepts
  Discount applied to line item
  Order flow continues from Stage 1 (or current stage if mid-order)
  Discount amount stored in order.discount_lines[]

Step 2B: Customer rejects
  AI responds: "ไม่เป็นไรนะคะ ราคาเต็ม ฿[Original Price] นะคะ สั่งได้เลยนะคะ 😊"
  No further discount offered in this session

Step 2C: Customer asks for MORE discount than offered
  Example: "ลด 20% ได้ไหม" when max_auto_discount = 10%
  
  Check: Requested discount > workspace_settings.manager_approval_threshold_pct?
  (default: 5%; range: 1–30%; note: threshold is for amount REQUIRING approval, not the offer)
  
  Since 10% > 5% (manager_approval_threshold), this requires manager approval.
  
  AI message:
    "ส่วนลดที่ขอเกินขีดจำกัดอัตโนมัติค่ะ ขอส่งให้ผู้จัดการอนุมัติก่อนนะคะ
     รอสักครู่นะคะ (ไม่เกิน 30 นาที)"
  
  Manager approval request:
    - Notification sent to all users with Manager or Admin role in workspace
    - Notification: "ลูกค้า [Name] ขอส่วนลด [X]% สำหรับ [Product] มูลค่า ฿[Amount] — อนุมัติ?"
    - Manager sees: [✅ อนุมัติ] [❌ ปฏิเสธ] [✏️ เสนอ [Y]% แทน]
    
    Manager approval timeout: 30 minutes from request time
    
    If manager approves within 30 minutes:
      Requested discount applied; AI sends "ผู้จัดการอนุมัติส่วนลด [X]% แล้วค่ะ 🎉"
      Order continues
    
    If manager offers counter-discount (e.g., 15% instead of 20%):
      AI sends to customer: "ผู้จัดการเสนอส่วนลด [Y]% ได้นะคะ ฿[Counterofferr Price] สนใจไหมคะ?"
      [✅ รับ] [❌ ไม่รับ]
    
    If manager rejects within 30 minutes:
      AI sends: "ขอโทษค่ะ ส่วนลดที่ขอไม่สามารถอนุมัติได้ค่ะ สั่งที่ ฿[Auto-Discount Price] ได้เลยนะคะ"
    
    If no manager response within 30 minutes (timeout):
      AI sends: "ขอโทษค่ะ ไม่ได้รับการตอบกลับจากผู้จัดการ เสนอส่วนลด [max_auto_discount]% ได้เลยนะคะ"
      → Fallback to max automatic discount (not the customer's requested amount)

Discount cap enforcement:
  AI can NEVER apply discount > workspace_settings.max_discount_cap_pct (default: 30%, range: 1–50%)
  This is a hard cap — even if manager approves above this, system rejects the approval
  and sends error to manager: "ส่วนลดเกินขีดจำกัดสูงสุด [30]% — ไม่สามารถอนุมัติได้"
```

---

## Knowledge Base Synchronization

### Version Management

```
Knowledge base version:
  Each workspace has a kb_version integer (increments on every save)
  Stored in: MongoDB workspace record + Redis cache key "kb:version:{workspace_id}"

New conversations:
  On first message of a new session: load current kb_version from Redis
  Store kb_version in session: session.kb_version = current
  All KB lookups in this session use the version loaded at session start

Ongoing sessions:
  Continue using session.kb_version (the version at session start)
  Do NOT reload KB mid-session even if admin updates FAQ
  Reason: Avoid inconsistency mid-order (e.g., price changed between Stage 1 and Stage 4)

Definition of "session end" (when KB version refreshes):
  A session ends when ANY of the following occur:
    1. Customer places an order (Stage 5 complete) → session cleared
    2. Conversation is handed off to human agent → session cleared
    3. Room is closed (room.status = CLOSED or RESOLVED) → session cleared
    4. Room is idle for 4 hours (no messages from either side) → session cleared by Quartz.NET job
       (This is separate from the follow-up 2-hour timer — this is the session TTL)
    5. Agent manually triggers "Refresh AI Context" button in room action panel

Session TTL in Redis: 14400 seconds (4 hours) — same as definition 4 above
```

### Admin KB Update Notification

```
When admin updates FAQ or product catalog, a banner appears in the AI monitoring dashboard:
  "Knowledge base updated (v{new_version}). New sessions will use updated version.
   {N} ongoing sessions will continue on v{old_version} until they end."

Where N = count of active sessions with a different kb_version.

Admin can click "Force refresh all sessions" (available to Admin role only):
  This action sets all active sessions' kb_version to current
  Warning shown: "This may cause mid-session inconsistency (e.g., prices changed mid-order). Continue?"
  [✅ ยืนยัน] [❌ ยกเลิก]
  
  If confirmed: all Redis session objects updated; log written
```

---

## Configuration & Settings

**Location**: Settings → Messaging → AI Sales Agent

### Section 1: Master Toggle + Per-channel Toggles

| Field Name | Type | Default | Valid Range | Who Can Edit |
|------------|------|---------|-------------|--------------|
| `ai_sales_agent_enabled` | boolean | false (off at workspace creation) | true/false | Admin only |
| `channel_ai_enabled.line` | boolean | false | true/false | Admin, Manager |
| `channel_ai_enabled.facebook` | boolean | false | true/false | Admin, Manager |
| `channel_ai_enabled.instagram` | boolean | false | true/false | Admin, Manager |
| `channel_ai_enabled.whatsapp` | boolean | false | true/false | Admin, Manager |
| `channel_ai_enabled.lazada` | boolean | false | true/false | Admin, Manager |
| `channel_ai_enabled.shopee` | boolean | false | true/false | Admin, Manager |

Note: Per-channel toggles are disabled (greyed out, not clickable) when master `ai_sales_agent_enabled = false`.

### Section 2: Role Policy Table

| Role | AI ตอบแทน | AI สร้างออเดอร์ | AI เจรจาราคา | ต้องอนุมัติก่อน |
|------|-----------|-----------------|--------------|-----------------|
| Admin | true (locked) | true (locked) | true (locked) | false (locked) |
| Manager | true | true | false | false |
| Agent | true | false | false | true |
| Staff | true | false | false | true |

Field names:
- `role_policy.{role}.ai_can_respond` — boolean
- `role_policy.{role}.ai_can_create_order` — boolean
- `role_policy.{role}.ai_can_negotiate_price` — boolean
- `role_policy.{role}.requires_approval` — boolean

Who can edit role policy: Admin only (all rows). Manager can read all rows but not edit.

### Section 3: Handoff Policy

| Field Name | Type | Default | Valid Range | Who Can Edit |
|------------|------|---------|-------------|--------------|
| `confidence_threshold` | integer (%) | 70 | 50–90 | Admin, Manager |
| `max_turns_before_handoff` | integer | 5 | 1–20 | Admin, Manager |
| `out_of_hours_behavior` | enum | auto_reply | auto_reply \| stop \| notify | Admin, Manager |
| `out_of_hours_message` | string | "ขณะนี้ปิดทำการ กรุณาติดต่อใหม่ 09:00-21:00 น." | max 200 chars | Admin, Manager |

`max_turns_before_handoff` — definition of "turn": one customer message + one AI response = 1 turn.
If customer sends 5 messages and AI responds 5 times = 5 turns → if threshold = 5 → handoff on 6th message.

### Section 4: Tone Configuration (GAP 11 — LOCKED)

| Field Name | Type | Default | Valid Range | Who Can Edit |
|------------|------|---------|-------------|--------------|
| `ai_tone` | enum | casual | formal \| casual \| cute | Admin, Manager |

Tone takes effect on next message. Does not retroactively change in-progress conversations.
Implementation: `workspace_settings.ai_tone` enum, injected into AI prompt template at generation time.

### Section 5: Discount Policy

| Field Name | Type | Default | Valid Range | Who Can Edit |
|------------|------|---------|-------------|--------------|
| `discount_enabled` | boolean | false | true/false | Admin only |
| `max_auto_discount_pct` | integer (%) | 10 | 1–30 | Admin, Manager |
| `manager_approval_threshold_pct` | integer (%) | 5 | 1–30 | Admin only |
| `max_discount_cap_pct` | integer (%) | 30 | 1–50 | Admin only |
| `manager_approval_timeout_min` | integer (minutes) | 30 | 5–120 | Admin only |

Validation: `manager_approval_threshold_pct` must be < `max_auto_discount_pct` ≤ `max_discount_cap_pct`.
If violating: show inline validation error; block save.

### Section 6: Follow-up Settings

| Field Name | Type | Default | Valid Range | Who Can Edit |
|------------|------|---------|-------------|--------------|
| `followup_enabled` | boolean | true | true/false | Admin, Manager |
| `followup_delay_minutes` | integer | 120 | 30–1440 | Admin, Manager |
| `followup_max_count` | integer | 2 | 1–3 | Admin, Manager |
| `followup_send_window_start` | time (HH:MM) | "09:00" | "00:00"–"23:59" | Admin, Manager |
| `followup_send_window_end` | time (HH:MM) | "21:00" | "00:00"–"23:59" | Admin, Manager |
| `followup_message_1` | string | (template above) | max 300 chars | Admin, Manager |
| `followup_message_2` | string | (template above) | max 300 chars | Admin, Manager |

### Section 7: Knowledge Base (FAQ Management)

| Field Name | Type | Default | Valid Range | Who Can Edit |
|------------|------|---------|-------------|--------------|
| `faq[].question_keywords` | string[] | [] | max 10 keywords per FAQ, max 100 FAQ entries | Admin, Manager |
| `faq[].answer_text` | string | "" | max 500 chars | Admin, Manager |
| `faq[].enabled` | boolean | true | true/false | Admin, Manager |

### Save Behavior

All settings saved with: "บันทึกการตั้งค่า" button.
Save confirmation: toast "✓ บันทึกแล้ว" (green) displayed for 2 seconds, then disappears.
Save failure: toast "เกิดข้อผิดพลาด กรุณาลองใหม่" (red) displayed for 5 seconds.
Unsaved changes indicator: orange dot on section header; browser "leave page" warning if navigating away.

---

## AI Performance Monitoring Dashboard

**Location**: Insights → AI Sales Agent tab

```
Dashboard layout (desktop):

┌────────────────────────────────────────────────────────┐
│ AI Sales Agent — วันนี้                                │
│                                                        │
│ สถานะ: [🟢 ONLINE]  เวอร์ชัน KB: v42               │
│                                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ข้อความ  │ │ตอบสำเร็จ│ │ออเดอร์  │ │Handoffs │  │
│ │  147    │ │  131    │ │  23     │ │  16     │  │
│ │ received│ │(89%)    │ │closed   │ │(11%)    │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│ Avg response time: 0.8s (p95: 1.7s)                  │
│ Follow-up recovery: 4 orders from 27 follow-ups (15%) │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Handoff Reasons (Today)                          │  │
│ │ Low confidence:      9 (56%)                     │  │
│ │ Human requested:     4 (25%)                     │  │
│ │ Clarification fail:  2 (13%)                     │  │
│ │ Custom order:        1 (6%)                      │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ [ดู Missed Intents] [แก้ไข FAQ] [Training Log]       │
└────────────────────────────────────────────────────────┘
```

Metrics refresh interval: 30 seconds (real-time poll, not push)
Date range: Today (default), Last 7 days, Last 30 days (selector)
Export: CSV download of all metrics (date-range filtered)

---

## Edge Cases

### Customer Goes Silent Mid-Order (Stage 2)

```
Scenario: Customer confirmed product (Stage 1) then disappears at upsell (Stage 2)

T+0min   Stage 1 confirmed; AI sends upsell message
T+30min  No customer response; Stage 2 timeout fires
  → AI silently advances to Stage 3 (cross-sell)
  → AI sends cross-sell message immediately

T+60min  No customer response at Stage 3; Stage 3 timeout fires
  → AI silently advances to Stage 4 (summary)
  → AI sends order summary with original product only (no upsell, no cross-sell)

T+120min No customer response at Stage 4; Stage 4 timeout fires
  → Session preserved (no auto-confirm — explicit confirmation required)
  → No message sent

T+120min Follow-up timer fires (independently):
  → AI sends Follow-up 1 (interest-based, not order-stage-based)
  → Message: "ยังสนใจ [Product Name] อยู่ไหมคะ? [🛒 สั่งได้เลยค่ะ]"
  → If customer clicks: restart order flow from Stage 1 (session expired; fresh start)

Wait — session TTL is 2 hours. After T+120min the session expires.
If customer responds at T+121min: new session begins from intent detection.
Follow-up 1 link leads customer back; they retype or click quick reply → new session → clean restart.
```

### Same Customer Messages from Two Channels Simultaneously

```
Scenario: Customer messages on LINE and Facebook within the same minute

LINE message: standard pipeline runs
Facebook message: standard pipeline runs

The 4 eligibility checks are per-room (LINE = room_A, Facebook = room_B).
Both rooms are independent. AI responds on both channels.

No de-duplication across channels (by design — customer chose both channels).
Agent monitoring sees 2 active rooms for same customer (identified by customer profile linkage).

If agent wants to consolidate: manual process (merge rooms feature, if available; otherwise handle separately).
```

### Product Goes Out of Stock During Order Flow

```
Scenario: Product has stock=1 at Stage 1. Customer confirmed. Between Stage 2 and Stage 5, another customer buys last unit.

Stage 5 execution:
  T+0ms  Customer confirms order
  T+50ms Order creation: system checks stock before writing
    stock = 0 → order creation blocked
    AI sends: "ขอโทษนะคะ สินค้าเพิ่งหมดสต็อกค่ะ ขออภัยด้วยนะคะ 🙏
               ต้องการดูสินค้าอื่นที่คล้ายกันไหมคะ?"
    → AI searches for in-stock alternative in same category
    → Suggests 1 alternative: "มี [Alternative Product] ฿[Price] ค่ะ สนใจไหม?"
    [✅ สนใจ] [❌ ไม่ดีค่ะ]

If customer accepts alternative: restart from Stage 1 with new product.
If customer declines: order flow ends; follow-up NOT triggered (customer already had a full interaction).
```

### Agent Takes Over Then AI Re-enabled

```
Scenario: Agent handled complaint. Issue resolved. Agent clicks "Return to AI."

When agent returns conversation to AI:
  - room.ai_active = true
  - New session begins (old session cleared)
  - clarification_attempts = 0
  - All follow-up timers reset (no pending follow-ups from before)
  - KB version: current version loaded fresh

Next customer message is processed as a brand-new session.
Agent's messages are visible in context (last 5 messages), but AI does not inherit agent's commitments.
If agent promised custom pricing: agent must create a special order manually (AI does not honor undocumented commitments).
```

### Confidence Threshold Changed Mid-Day

```
Scenario: Admin changes confidence_threshold from 70% to 80% at 14:00.

Effect:
  - All new sessions starting after 14:00: use 80% threshold
  - All ongoing sessions: continue using the threshold that was set at session start
    (threshold captured in session at start: session.confidence_threshold = 70)
  - Sessions that started at 13:00 with threshold 70%: still use 70% until session ends

Implementation: session.confidence_threshold is written at session creation.
Not re-read from workspace_settings during a session.
Rationale: Avoid handoff mid-order due to admin changing threshold while customer is buying.
```

---

## Acceptance Criteria

### Pipeline & Eligibility

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-01 | All 4 eligibility checks complete in ≤50ms (Redis lookup) | p99 latency |
| AC-02 | Message deduplication prevents same message_id from processing twice within 300 seconds | Platform retry simulation |
| AC-03 | Full pipeline from webhook to customer response ≤2000ms (p95) | End-to-end timing |
| AC-04 | AI model call budget: ≤1500ms (T+300ms to T+1800ms) | AI model response timing |
| AC-05 | Fallback message sent within 50ms of T+1800ms timeout | Timeout test |
| AC-06 | Queue depth alert fires when queue > 50 pending messages | Load test |
| AC-07 | No message silently dropped — every message either processed or routed to inbox | Message audit log |

### Intent Detection

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-08 | Composite confidence score is an integer 0–100 (no decimals) | Unit test: score calculation |
| AC-09 | Confidence threshold of 70% (default) triggers handoff when score = 69 and does NOT trigger at score = 70 | Threshold boundary test |
| AC-10 | HUMAN_REQUEST intent at any confidence triggers immediate handoff | Detection test |
| AC-11 | 2 consecutive clarification attempts both < 70% → handoff | Clarification flow test |
| AC-12 | Max intents per message = 2; 3+ intents detected → capped at CUSTOM_ORDER (confidence ≤65%) | Multi-intent test |
| AC-13 | Clarification attempt counter resets to 0 at session start | Session reset test |

### Knowledge Base

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-14 | Exact product name match returns in ≤20ms | Timing test |
| AC-15 | Fuzzy match threshold: ≥80% token similarity (Levenshtein ≤2 OR token ratio ≥80%) | Fuzzy match unit test |
| AC-16 | Max 3 products returned to AI per KB lookup | Output inspection |
| AC-17 | Product stock and price fetched in real-time (Redis TTL: 60 seconds) | Cache expiry test |
| AC-18 | 0 KB results: AI asks for clarification (does NOT count as clarification_attempt) | Flow test |
| AC-19 | KB version captured at session start; session uses that version until session ends | Version isolation test |

### Order Flow

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-20 | Order record NOT written until Stage 5 confirmation (Stages 1–4 in Redis only) | DB audit during test |
| AC-21 | Upsell price cap: upsell must be ≤150% of confirmed product unit price | Price validation test |
| AC-22 | Upsell offered maximum 1 time per session per product | Duplicate offer test |
| AC-23 | Cross-sell maximum 2 items shown | Output inspection |
| AC-24 | Order summary shows: product name, quantity, unit price, line total, grand total, shipping address (or placeholder), discount if applicable | Summary field audit |
| AC-25 | Payment link generated within 2500ms of Stage 5 confirmation | Timing test |
| AC-26 | Payment link token TTL: 24 hours | Expiry test |
| AC-27 | Order record sets source = "ai", status = "PENDING_PAYMENT", created_by = "ai_agent" | DB field inspection |
| AC-28 | Session Redis TTL: 7200 seconds (2 hours); expired session restarts flow from Stage 1 | TTL expiry test |
| AC-29 | Stage 2 customer timeout: 30 minutes → advance to Stage 3 (skip upsell) | Timeout test |
| AC-30 | Stage 3 customer timeout: 30 minutes → advance to Stage 4 (skip cross-sell) | Timeout test |
| AC-31 | Stage 4 customer timeout: 60 minutes → session preserved; no auto-confirm | Timeout test |
| AC-32 | Order creation failure: 1 retry after 500ms; if 2nd fails → handoff | Failure injection test |

### Language Detection

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-33 | thai_ratio ≥ 0.60 → Thai response | Language ratio test |
| AC-34 | thai_ratio = 0.00 (all English) → English response | Language ratio test |
| AC-35 | 0.00 < thai_ratio < 0.60 → Thai response (mixed defaults to Thai) | Mixed language test |
| AC-36 | ≤1 token message → use conversation's established language; no prior context → Thai | Short message test |
| AC-37 | Unsupported language → Thai response + notice appended | Detection test |
| AC-38 | Language notice shown maximum 1 time per session (not repeated) | Notice repeat test |

### Handoff

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-39 | Handoff trigger fires within 500ms of condition detection | Timing test |
| AC-40 | Handoff context package contains all 12 required fields (see Context Payload section) | Payload inspection |
| AC-41 | Agent receives in-app badge, toast (5 seconds), push notification, and audio chime on handoff | Notification test |
| AC-42 | Room label changes from [🤖 AI] to [⚠️ Handoff] within 30ms of handoff | UI timing test |
| AC-43 | "Return to AI" button hidden (not greyed) when ai_blocked=true OR workspace AI disabled | UI state test |
| AC-44 | After return to AI: clarification_attempts = 0, new session, room label = [🤖 AI] | State reset test |

### Follow-up

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-45 | Follow-up timer starts at last AI message timestamp, fires at exactly T+120 minutes | Timer accuracy test |
| AC-46 | Follow-up send window respected: messages only sent between 09:00–21:00 Bangkok (ICT) | Timezone boundary test |
| AC-47 | Stock check runs at T+110 minutes; if stock=0 at that time → cancel follow-up silently | Stock check test |
| AC-48 | Maximum 2 follow-up messages per session (follow_up_exhausted flag prevents 3rd) | Count enforcement test |
| AC-49 | Any customer message cancels follow-up timer (within 1 minute of message receipt) | Cancellation test |
| AC-50 | Follow-up 2 timer starts at Follow-up 1 send timestamp (+24 hours), not from original session start | Timer chaining test |

### Discount & Price Negotiation

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-51 | Discount only offered if discount_enabled=true AND product.discount_allowed=true | Eligibility gate test |
| AC-52 | Discount offered maximum 1 time per session (session.discount_offered flag) | Duplicate offer test |
| AC-53 | AI cannot apply discount > max_discount_cap_pct (hard system cap, not UI-only) | Cap enforcement test |
| AC-54 | Manager approval request sent to all Manager + Admin role users | Notification test |
| AC-55 | Manager approval timeout: 30 minutes → fallback to max_auto_discount_pct (not customer's requested amount) | Timeout test |
| AC-56 | Manager cannot approve above max_discount_cap_pct; system rejects and sends error to manager | Cap rejection test |

### Configuration

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-57 | Agent role cannot view or edit role policy table | Permission test |
| AC-58 | Per-channel toggles disabled (not clickable) when master AI toggle is false | UI state test |
| AC-59 | Save confirmation toast: "✓ บันทึกแล้ว" appears within 200ms and disappears after 2 seconds | UI timing test |
| AC-60 | Unsaved changes trigger browser leave-page warning | Navigation test |
| AC-61 | Validation: manager_approval_threshold_pct < max_auto_discount_pct ≤ max_discount_cap_pct; inline error if violated | Validation test |
| AC-62 | AI tone change takes effect on next message only; no retroactive change to in-progress sessions | Tone isolation test |

### Knowledge Base Synchronization

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-63 | New sessions load current kb_version at session creation | Version capture test |
| AC-64 | Ongoing sessions do not reload KB version mid-session | Version isolation test |
| AC-65 | Session cleared when room idle for 4 hours (Quartz.NET job) | Job timing test |
| AC-66 | Admin "Force refresh all sessions" button: updates all active session kb_versions | Bulk update test |
| AC-67 | Dashboard banner shows count of ongoing sessions on different KB version after update | Banner count test |

---

## Success Metrics

| Metric | Target | Measurement Period | How Measured |
|--------|--------|--------------------|--------------|
| **Response time (p95)** | <2000ms | Real-time | Pipeline timing logs |
| **AI closure rate** | >20% of all orders | Daily | Orders with source="ai" / total orders |
| **Handoff accuracy** | >85% correct | Weekly | Agent survey: "Was this handoff necessary?" |
| **KB coverage** | 100% of FAQ questions answered without "not found" | Weekly | 0-result log count / total searches |
| **Upsell adoption** | >30% of AI orders include upsell | Weekly | Orders with upsell item / AI-sourced orders |
| **Follow-up recovery** | >15% of follow-ups convert to order | Weekly | Orders from follow-up click / total follow-ups sent |
| **False positive handoff** | <5% | Weekly | Unnecessary handoffs / total handoffs |
| **System uptime** | ≥99.5% | Monthly | Worker health check / total minutes |
| **Queue depth** | <50 messages sustained | Real-time | Queue monitoring |
| **Discount approval rate** | tracked (no target set) | Monthly | Approved discounts / requests |

---

## Integration Checklist

- [ ] **Inbox / Chat**: AI badge on rooms; Handoff badge on triggered rooms; "Return to AI" button in room actions
- [ ] **Order Management**: Orders created with `source: "ai"`, appear in order list immediately with PENDING_PAYMENT status
- [ ] **Product Catalog**: Real-time stock and price reads via Redis (60-second TTL); out-of-stock handling in order flow
- [ ] **CRM**: Customer profile read (segment, lifetime orders, lifetime value, ai_blocked flag); customer name used in follow-up messages
- [ ] **Follow-up Management**: AI follow-up uses same Bangkok timezone window as Order Management follow-up (09:00–21:00 ICT)
- [ ] **Settings**: All config fields in `workspace_settings` and `channel_settings` documents; role policy in separate collection
- [ ] **Slip Verification**: AI-created orders proceed through same slip verification flow as manually created orders (no bypass)
- [ ] **Notifications**: Agent handoff notifications use same notification infrastructure as manual assignments
- [ ] **Insights / Dashboard**: AI stats tab reads from `ai_conversation_events` collection (not from orders collection directly)
- [ ] **RabbitMQ**: AI message processing via `SendAiChatbotMessage` consumer; follow-up via `ScheduleAiFollowup` job in Quartz.NET
- [ ] **Redis**: All session state, deduplication keys, KB cache, and follow-up timers stored in Redis (not in-process)
- [ ] **Audit Log**: Every AI action logged: message received, intent detected, confidence score, action taken, handoff fired, order created

---

## Locked Decisions

This section records all confirmed, locked decisions for the AI Sales Agent feature. These are final and must not be reopened without explicit product owner sign-off.

---

### GAP 11: AI Tone Configuration
**Status**: LOCKED (April 8, 2026)
**Decision**: Shop owner can configure AI response tone. Three options: Formal, Casual, Cute.
**Default**: Casual
**Scope**: Workspace-level setting (one tone applies to all channels and conversations in that workspace)
**When applied**: Takes effect on next message sent after change. Does not retroactively alter in-progress conversations.
**Implementation**:
- `workspace_settings.ai_tone` column, type: enum (`formal` | `casual` | `cute`)
- Default value at workspace creation: `casual`
- Value injected into AI prompt template at message-generation time
- UI: Dropdown in AI Settings panel, labeled "Response Tone", shows current selection with "(Default)" badge on Casual

**Tone examples**:

| Tone | Thai | English |
|------|------|---------|
| Formal | "สินค้า A ราคา ฿199 กรุณายืนยันการสั่งซื้อ" | "Product A is ฿199. Please confirm your order." |
| Casual (default) | "สินค้า A ราคา ฿199 นะคะ สั่งได้เลยค่ะ 😊" | "Product A is ฿199! Ready to order? 😊" |
| Cute | "หยิบสินค้า A ราคา ฿199 ได้เลยนะคะ~ 🎀💕" | "Product A is ฿199~ Want one? 🎀💕" |

**Rationale**: Thai SME shop owners selling to Thai consumers expect a warm, approachable tone by default. Casual fits most shops (fashion, food, lifestyle). Formal serves B2B or professional services. Cute serves shops targeting younger audiences (stationery, accessories, K-style).

---

### GAP-AI-01: Confidence Score Architecture
**Status**: LOCKED (April 9, 2026)
**Decision**: Confidence is a single composite integer (0–100) derived from 3 weighted factors: intent clarity (50%), KB match (30%), context coherence (20%).
**Rationale**: Single score is simpler to configure (one threshold slider) and explain to non-technical shop owners. Multi-factor weighting ensures KB miss appropriately reduces confidence even when intent is clear.
**Default threshold**: 70% (configurable 50–90%)

---

### GAP-AI-02: Order State Location
**Status**: LOCKED (April 9, 2026)
**Decision**: Order in-progress state (Stages 1–4) lives entirely in Redis. Order record in MongoDB is written only at Stage 5 confirmation.
**Rationale**: Eliminates "phantom orders" (partially-created orders that customer never confirmed). Simplifies rollback (no DB record to delete). Redis session TTL provides automatic cleanup.
**Session TTL**: 7200 seconds (2 hours)

---

### GAP-AI-03: Upsell Price Cap
**Status**: LOCKED (April 9, 2026)
**Decision**: Upsell product price must be ≤150% of confirmed product unit price. If upsell exceeds this cap: skip upsell entirely.
**Rationale**: Prevents AI from suggesting an upsell that feels like a bait-and-switch. 150% cap allows meaningful upgrade while keeping psychological comfort. Example: ฿200 product → upsell up to ฿300. Beyond that, customer feels manipulated.

---

### GAP-AI-04: Follow-up Send Window
**Status**: LOCKED (April 9, 2026)
**Decision**: Follow-up messages respect the 09:00–21:00 Bangkok (ICT, UTC+7) window, same as Order Management feature.
**Rationale**: Consistent with shop's operating hours. Sending at 01:00 creates negative brand impression even if technically allowed. Delay to next 09:00 preserves the 2-hour urgency feeling without disturbing customers.

---

### GAP-AI-05: Manager Approval Timeout
**Status**: LOCKED (April 9, 2026)
**Decision**: If no manager responds to a discount approval request within 30 minutes: AI falls back to the maximum automatic discount (max_auto_discount_pct), NOT the customer's requested amount.
**Rationale**: Fallback must be conservative (shop owner's pre-approved limit). Customer's requested amount may exceed what was sanctioned. 30 minutes is long enough for manager to respond while keeping customer engaged.

---

### GAP-AI-06: KB Version Isolation Per Session
**Status**: LOCKED (April 9, 2026)
**Decision**: Ongoing sessions do not reload KB version when admin makes updates. Session ends when: order placed, handoff triggered, room closed, or 4 hours of inactivity. Only then does new KB version take effect.
**Rationale**: Price change mid-order would create inconsistency between what AI quoted in Stage 1 and what it writes in Stage 5. Session isolation is safer for order integrity.

---

### GAP-AI-07: Cross-Channel Customer Sessions
**Status**: LOCKED (April 9, 2026)
**Decision**: Sessions are per-room (per-channel). A customer messaging on both LINE and Facebook has 2 independent AI sessions. No cross-channel session merging.
**Rationale**: Merging across channels requires CRM identity resolution which may be unreliable. Independent sessions are safe and correct. Edge case (same person, two channels) is rare enough that manual agent handling is acceptable.

---

## Review Questions

All previously open questions are now resolved and locked above. The following questions remain open pending product owner decision before development begins:

1. **Marketplace channels (Lazada, Shopee)**: Do these channels support quick reply buttons (product cards with [✅/❌] buttons), or only plain text? If plain text only: order flow requires a different UX pattern for those channels.
2. **AI model provider**: Which LLM powers intent classification and response generation? This affects: Thai language quality, inference latency (currently budgeted at 1500ms), and cost per message.
3. **Customer address collection**: If customer profile has no stored address at Stage 4, what is the exact flow? Does AI ask for address before showing summary? Or show summary with "แจ้งที่อยู่" placeholder and agent handles fulfillment?

---

*Last updated: April 9, 2026 — Full rewrite with digit-level precision. All locked decisions from April 8 preserved. New decisions GAP-AI-01 through GAP-AI-07 added.*
