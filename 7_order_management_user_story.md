# 7. Order Management — User Story

**Status**: Updated with Locked Gap Decisions (GAP 7, 8, 9)
**Priority**: 🔴 Critical (Revenue tracking + payment handling)
**Target Users**: Managers, Agents/Staff, Customers
**Primary Device**: Mobile (customer), Desktop (admin)
**Time Target**: <3 seconds order creation, payment link generation

---

## Feature Overview

The **Order Management** system tracks customer purchases from initial order creation through payment completion. It handles full payment, deposits, installments, and provides real-time payment status visibility to both customers and staff.

**Goal**: Convert interest → confirmed order → payment received → revenue tracked → fulfillment ready.

---

## User Personas & Goals

### Persona 1: Agent (Order Creator)
- Creates order in chat (via AI or manual)
- Wants instant payment link to send
- **Goal**: Order created → payment link generated → send to customer → tracking updates automatically

### Persona 2: Manager (Revenue Monitor)
- Tracks daily/weekly revenue
- Needs visibility on pending payments
- **Goal**: Dashboard shows all orders by status (pending, awaiting payment, paid, failed)

### Persona 3: Customer (Payer)
- Receives payment link via chat
- Clicks link → pays via bank transfer, credit card, QR code
- **Goal**: One click → payment confirmed → order status updates in chat

### Persona 4: Admin (Slip Verifier)
- Verifies customer bank slips for deposits
- Manually approves/rejects payments
- **Goal**: Bank slip received → verify → approve → order status updated

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **Payment success rate** | 95%+ | <5% failed payments = max revenue |
| **Avg order value** | ฿500-5000 | Depends on product catalog |
| **Payment time** | <10 min (after link sent) | Quick conversion = better user experience |
| **Deposit tracking** | 100% verified | Legal/tax compliance |
| **Revenue visibility** | Real-time | Dashboard shows true business health |
| **Failed payment recovery** | >30% (resend link) | Passive retry = extra revenue |

---

## Order Status Flow

### Order Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ NEW (Order Created)                                             │
│   - Order generated from chat                                   │
│   - Customer confirmed items + price                            │
│   - Awaiting first response/action                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ INPROGRESS (Conversation Active)                                │
│   - AI or Admin already responded to customer                   │
│   - Negotiation/clarification happening                         │
│   - Customer has not yet committed to order                     │
│   - Can follow-up, adjust price, suggest alternatives           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ PENDING_PAYMENT (Ready to Pay)                                  │
│   - Customer confirmed final price                              │
│   - Payment link generated & sent                               │
│   - Customer hasn't paid yet                                    │
│   - Can retry/resend link                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ PENDING_VERIFY (Awaiting Verification)                          │
│   - Payment received (full/deposit/slip)                        │
│   - Awaiting verification:                                      │
│     * Slip verification (AI/manual)                             │
│     * Payment gateway confirmation                              │
│   - Not yet completed                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
         ┌──────────────────┴──────────────────┐
         ↓                                      ↓
    COMPLETED                            CANCELLED
    (Fully verified                       (Rejected slip,
     & ready to ship)                      refund issued)

PAYMENT_EXPIRED (Payment Link Expired — GAP 9 Locked)
  - Triggered when payment link passes its 24-hour expiry
  - System job detects expiry, sets order status to PAYMENT_EXPIRED
  - Customer receives notification via their original order channel
  - Internal note auto-created for admin
  - Agent can regenerate a new payment link → status returns to PENDING_PAYMENT
  - Order does NOT auto-cancel; shop owner decides next action
```

---

## Payment Modes (Global Config)

### Mode 1: Full Payment

**Customer pays entire amount upfront**

```
Status: NEW
↓ (AI/Agent responds with quote)
Status: INPROGRESS
↓ (Customer accepts price)
Status: PENDING_PAYMENT (payment link sent)
↓
Customer pays ฿5000 (via payment gateway)
↓
Status: PENDING_VERIFY (awaiting payment confirmation)
↓
Payment confirmed by gateway
↓
Status: COMPLETED ✅ (ready to ship)
```

### Mode 2: Deposit + Installments

**Customer pays initial deposit, then remaining in installments**

```
Status: NEW → INPROGRESS
↓
Status: PENDING_PAYMENT (deposit link sent: ฿1000)
↓
Customer pays ฿1000 (deposit)
↓
Status: PENDING_VERIFY (verifying deposit)
↓
Deposit confirmed
↓
Status: COMPLETED (deposit approved, awaiting installments)
↓
Day 7: Auto-reminder for Installment 1 (฿2000)
↓
Customer pays Installment 1
↓
Status: PENDING_VERIFY (verifying installment 1)
↓
Confirmed → Status: COMPLETED (installment 1 approved)
↓
Day 14: Auto-reminder for Installment 2 (฿2000)
↓
Customer pays Installment 2
↓
Status: PENDING_VERIFY → Status: COMPLETED (all received)
```

### Mode 3: Payment by Slip (Bank Transfer)

**Customer transfers money, uploads/sends slip for verification**

```
Status: NEW → INPROGRESS → PENDING_PAYMENT (bank account info provided)
↓
Customer transfers ฿5000 + sends slip
↓
Agent uploads slip
↓
Status: PENDING_VERIFY
↓
AI verifies slip:
  - If 100% confident: Auto-approve → Status: COMPLETED ✅
  - If <100% confident: Escalate to manual review
↓
Admin reviews slip:
  - Approve: Status: COMPLETED ✅
  - Reject: Back to PENDING_PAYMENT (try another method)
```

---

## Payment Link Management

**Payment Gateway**: Payso API
**API Documentation**: https://api-docs.payso.co/docs/api/overviews

### Link Creation

```
Order created (status: NEW)
  → System generates unique payment_link_id
  → Creates payment link via Payso API
  → Link expires: Now + 24 hours (locked default — GAP 9)
  → Link status: ACTIVE

When order status changes to PENDING_PAYMENT:
  → System sends payment link to customer via chat
  → Format: "Click to pay: [payment-link-url]"
  → Link trackable (can see if customer opened/paid)

Payso API Integration:
  - Use Payso API endpoints for payment link creation
  - Follow Payso webhook specifications for payment confirmation
  - Implement idempotency per Payso API requirements
  - Refer to: https://api-docs.payso.co/docs/api/overviews
```

### Link Expiry & Recovery

**Locked (GAP 9)**: Payment links expire after 24 hours. On expiry, order status becomes PAYMENT_EXPIRED, customer is notified via their original order channel, and an internal note is created for the admin.

```
Scenario 1: Link expires (24h passed — GAP 9 Locked)
  → Scheduled job detects link has passed expires_at
  → Link status: EXPIRED
  → Order status: PAYMENT_EXPIRED
  → Customer notified via original order channel: "Your payment link has expired. Contact the shop for a new link."
  → Internal note auto-created for admin: "Payment link expired for Order [ORD-ID]"
  → Agent in chat: Sees "⚠️ Payment link expired" badge
  → Agent clicks [Resend Link] → New 24h link generated → Order returns to PENDING_PAYMENT

Scenario 2: Customer clicks expired link
  → Shows page: "This payment link has expired"
  → Options: [Request New Link] → auto-notifies agent

Scenario 3: Auto-recovery (optional feature)
  → Manager enables: "Auto-resend failed links after 24h"
  → If customer hasn't paid: New link sent automatically at 24h mark
  → Customer gets message: "New payment link: [link]"
```

### Idempotency (No Double Charges)

```
Problem: Customer clicks "Pay" twice, payment processed twice

Solution: Idempotency Keys
  - Each payment link has unique idempotency_key
  - Gateway stores: idempotency_key → first payment_id
  - If same key sent again: Return existing payment_id (not new charge)

Real-world: Customer clicks button twice, browser reloads → only 1 charge
```

---

## Deposit & Installment Tracking

### Deposit Configuration (Admin)

```
Settings → Deposit & Installments

Enable Deposit Mode: [Toggle] ❌

If enabled:
  Deposit amount: [30] % of total
  Installment count: [2] (1-5)
  Installment interval: [7] days between each

  Example:
    Total: ฿5000
    Deposit: 30% = ฿1500
    Remaining: ฿3500 ÷ 2 = ฿1750 per installment

    Schedule:
      Payment 1 (Deposit): ฿1500 - Day 0
      Payment 2 (Installment): ฿1750 - Day 7
      Payment 3 (Installment): ฿1750 - Day 14
```

### Installment Notifications

```
Day 0: Customer receives deposit link (฿1500)
Day 6: System sends reminder "Payment due tomorrow"
Day 7: Customer pays Installment 1 (฿1750)
Day 13: Reminder "Payment due tomorrow"
Day 14: Customer pays Installment 2 (฿1750)
Day 21: Final reminder if not paid yet
Day 28: Escalate to manager if still not paid (overdue)
```

---

## Notifications & Reminders

### Automatic Messages

```
1️⃣ Order Created
   → Chat: "สั่งซื้อสินค้า ฿5000 | Order ID: ORD-2026-001"
   → Status: NEW

2️⃣ AI/Agent Response
   → Chat: "ยืนยันราคาแล้ว ฿5000 พร้อมชำระเงินหรือไหม?"
   → Status: INPROGRESS

3️⃣ Payment Link Sent
   → Chat: "ชำระเงิน: [Click to pay]"
   → Status: PENDING_PAYMENT
   → Link expires in 24h (GAP 9 Locked)

4️⃣ Payment Received (Awaiting Verification)
   → Chat: "ได้รับเงินแล้ว ⏳ กำลังตรวจสอบ..."
   → Status: PENDING_VERIFY

5️⃣ Payment Verified ✅
   → Chat: "✅ ยืนยันชำระเงินสำเร็จแล้ว! (ORD-2026-001)"
   → Status: COMPLETED
   → Order ready to ship

6️⃣ Deposit Received
   → Chat: "✅ ได้รับมัดจำแล้ว ฿1500 (ORD-2026-001)"
   → Status: COMPLETED (for deposit)
   → "ชำระส่วนที่ 2 วันที่ [date]: [link]"

7️⃣ Installment Due
   → Chat (auto, day 6): "เตือน: ชำระเงินส่วนที่ 2 ฿1750 พรุ่งนี้"
   → Actionable: [Pay Now]

8️⃣ Payment Failed
   → Chat: "❌ ชำระเงินไม่สำเร็จ. ลองอีกครั้ง: [link]"
   → Status: PENDING_PAYMENT (back to payment)
   → Link still active, can resend

9️⃣ Payment Link Expired (GAP 9 Locked)
   → Triggered by scheduled job at expires_at (24h after link creation)
   → Customer notification (via original order channel): "Your payment link has expired. Please contact the shop for a new link."
   → Internal admin note: "Payment link expired — Order [ORD-ID]"
   → Order status: PAYMENT_EXPIRED
   → Agent sees expiry badge in chat; can regenerate link

🔟 Follow-up Sent Out-of-Window (GAP 8 Locked)
   → Send window: 9 AM – 9 PM Bangkok time
   → If follow-up scheduled outside this window, behavior is configurable per shop:
       - send_at_start: Send at 9 AM next available window start
       - queue: Hold message in queue until next window opens
       - skip: Discard the follow-up message entirely
   → Shop owner configures `out_of_window_action` in Follow-up Settings
```

---

## Configuration Panel (Admin Desktop)

```
⚙️ Order Management Settings

GLOBAL SETTINGS:
  Payment Gateway: Payso (https://api-docs.payso.co/docs/api/overviews)
  Payso API Key: [••••••••••••••••]
  Order ID prefix: [ORD-]
  Currency: [THB ▼]

PAYMENT LINK:
  Default expiry: [24] hours (locked default — GAP 9; configurable 1-72h)
  Auto-resend on failure: [Toggle] ✅
  Auto-resend delay: [24] hours
  Resend max attempts: [3]

FOLLOW-UP SEND WINDOW (GAP 8):
  Send window: 9:00 AM – 9:00 PM (Bangkok time, fixed)
  Out-of-window action: [send_at_start ▼] (send_at_start | queue | skip)

DEPOSIT MODE:
  Enable: [Toggle] ❌
  Default deposit %: [30] (10-50%)
  Default installments: [2] (1-5)
  Installment interval: [7] days (1-30)
  Installment reminder: [6] hours before due

PAYMENT METHODS (Enable/Disable):
  ☑ Credit Card / Debit Card
  ☑ Bank Transfer (Slip Upload)
  ☑ QR Code (PromptPay)
  ☑ Mobile Banking App Link
  ☑ Installment Plans (3/6/12 months)

NOTIFICATIONS:
  Notify admin on payment: [Toggle] ✅
  Notify customer on expiry: [Toggle] ✅
  Notify customer on overdue: [Toggle] ✅

REFUND POLICY:
  Allow partial refunds: [Toggle] ✅
  Auto-refund on cancellation: [Toggle] ✅
```

---

## Acceptance Criteria

### Order Creation
- [ ] Order can be created from chat (via AI or manual agent action)
- [ ] Order captures: customer_id, products (qty + price), total, payment_mode, discount (if any)
- [ ] Order assigned unique order_id (format: ORD-2026-001, incrementing)
- [ ] Initial status: NEW (order created, awaiting first response)
- [ ] Status transitions: NEW → INPROGRESS (when AI/Admin responds) → PENDING_PAYMENT (customer ready to pay)
- [ ] Order immutable after customer confirms final price

### Payment Link Generation
- [ ] Payment link generated on order creation
- [ ] Link created via Payso API
- [ ] Link includes: order_id, amount, currency, expiry_time, customer_email
- [ ] Link expires after 24 hours (locked default — GAP 9; configurable 1-72h in settings)
- [ ] On expiry: scheduled job updates order status to PAYMENT_EXPIRED, notifies customer via original channel, creates internal admin note
- [ ] Idempotency key unique per link (prevents double charging)
- [ ] Link can be resent unlimited times (agent clicks [Resend Link])
- [ ] New link can be generated even if previous still active
- [ ] Link status tracked: ACTIVE, EXPIRED, COMPLETED, FAILED

### Payment Success
- [ ] Payment webhook from Payso received and processed < 5 sec (see: https://api-docs.payso.co/docs/api/overviews)
- [ ] Order status updated: PENDING_PAYMENT → PENDING_VERIFY
- [ ] Payment confirmation verified (amount matches, timestamp valid, Payso idempotency key honored)
- [ ] Order status updated: PENDING_VERIFY → COMPLETED
- [ ] Customer notified in chat: "✅ Payment verified & order confirmed"
- [ ] Agent sees order status update in real-time
- [ ] Dashboard revenue updated when status = COMPLETED
- [ ] Idempotency check: Payso payment_id never processed twice (per Payso API spec)

### Deposit & Installment Mode
- [ ] If deposit mode enabled: First payment = deposit % of total
- [ ] Subsequent payments = remaining ÷ installment_count
- [ ] Schedule tracked: Each installment shows due_date
- [ ] Auto-reminder sent 6 hours before due_date
- [ ] Overdue reminder sent if not paid by due_date
- [ ] Status flow per payment: PENDING_PAYMENT → PENDING_VERIFY → COMPLETED (approved) or back to PENDING_PAYMENT (rejected)
- [ ] All installments must reach COMPLETED before final order status = COMPLETED

### Payment Failure & Recovery
- [ ] Payment declined: Order stays PENDING_PAYMENT
- [ ] Agent sees: "⚠️ Payment failed" badge
- [ ] Agent can [Resend Link] to customer
- [ ] Auto-resend feature: If enabled, new link sent after 24h (if not paid)
- [ ] Max resend attempts: 3 (default, configurable 1-5)
- [ ] After max attempts: Manual escalation (manager review)

### Slip Verification (Bank Transfer)
- [ ] Customer uploads/sends bank slip image/file
- [ ] AI auto-verifies if 100% confident (amount matches, account correct, timestamp valid)
- [ ] If <100% confident: Escalate to manual review by manager/admin
- [ ] Admin can: Approve / Reject / Request more info
- [ ] On approve: Order status → PAID
- [ ] On reject: Back to PENDING_PAYMENT (try another method)
- [ ] Rejected slip logged in audit trail

### Notifications
- [ ] Order created: Chat message confirms order + amount
- [ ] Payment link sent: Chat message with clickable link
- [ ] Payment success: Chat message confirms receipt
- [ ] Deposit received: Chat shows deposit + installment schedule
- [ ] Installment due (next day): Reminder in chat
- [ ] Payment failed: Chat message with retry link
- [ ] All notifications timestamped in audit log

### Real-time Updates
- [ ] Order status changes visible to agent immediately (< 1 sec)
- [ ] Customer sees status in chat thread in real-time
- [ ] Dashboard KPIs update immediately (daily revenue, pending payments count)
- [ ] Payment link status updates live (expiry countdown visible)

### Idempotency & Data Integrity
- [ ] No duplicate orders for same customer + same products + same timestamp
- [ ] No double charging if payment webhook received twice
- [ ] Idempotency key unique per payment attempt
- [ ] Each order linked to unique order_id (searchable, immutable)
- [ ] Audit log tracks: order creation, payment sent, payment received, status changes
- [ ] Rollback safe: If webhook fails, order still retry-able

### Dashboard & Analytics
- [ ] Orders by status: NEW, INPROGRESS, PENDING_PAYMENT, PENDING_VERIFY, COMPLETED, CANCELLED
- [ ] Revenue today/this week/this month (only COMPLETED orders)
- [ ] In-progress orders: Count + time in INPROGRESS status
- [ ] Pending payments: Count + total amount (PENDING_PAYMENT status)
- [ ] Pending verification: Count + total amount (PENDING_VERIFY status)
- [ ] Payment success rate: % of COMPLETED / total orders
- [ ] Failed payments: Count + reason (declined, expired, rejected slip)
- [ ] Installment tracker: Due dates, paid dates, overdue alerts

### Stock Soft-Hold (GAP 7 Locked)
- [ ] On order creation: Stock for all line items is soft-held immediately
- [ ] Soft-hold duration: 30 minutes from order creation (soft_hold_expires_at timestamp)
- [ ] Cleanup job runs every 5 minutes and releases expired soft-holds
- [ ] If order confirmed and reaches PENDING_PAYMENT: Soft-hold maintained until paid or payment link expires
- [ ] On payment confirmed (COMPLETED): Soft-hold converted to hard stock deduction
- [ ] On order cancelled or payment link expiry (PAYMENT_EXPIRED): Soft-hold released immediately

### Follow-up Out-of-Window Behavior (GAP 8 Locked)
- [ ] Send window defined as 9:00 AM – 9:00 PM Bangkok time (fixed, not configurable)
- [ ] If follow-up scheduled outside this window, apply shop owner's configured action:
  - `send_at_start`: Queue and send at 9 AM at the start of next available window
  - `queue`: Hold until the next window opens (same behavior as send_at_start but labeled differently for owner clarity)
  - `skip`: Discard the message, do not send
- [ ] `out_of_window_action` is configurable per workspace in Follow-up Settings
- [ ] Default action: `send_at_start` (messages never silently dropped unless owner selects skip)
- [ ] Audit log records which messages were delayed or skipped due to window rules

### Error Handling
- [ ] Payment gateway timeout: Retry with exponential backoff (1s, 5s, 15s)
- [ ] Webhook missing: Admin dashboard shows "⚠️ Payment pending verification"
- [ ] Link generation fails: Error shown to agent, [Retry] button available
- [ ] Invalid order: Show error (product no longer available, etc.)
- [ ] Refund requested: Manual process (admin approval required)

---

## Edge Cases

### Overpayment
**Customer pays more than order amount**
```
Order: ฿5000
Payment received: ฿5500

Solution:
  - Accept payment
  - Create Credit (฿500)
  - Offer: Use for next order / Manual refund
  - Log in audit trail
```

### Partial Payment (Deposit Mode)
**Customer paid ฿1500, then paid ฿1000 (should be ฿1750)**
```
Expected: ฿1500 (deposit) + ฿1750 (installment 1) + ฿1750 (installment 2)
Received: ฿1500 + ฿1000 (short ฿750)

Solution:
  - Accept ฿1500 deposit
  - Mark Installment 1 as PARTIALLY_PAID (฿1000/฿1750)
  - Reminder: "Still need ฿750 more for installment 1"
  - Accept remaining ฿750 + full installment 2 (฿1750) separately
```

### Cancelled Order
**Customer requests cancellation before/after payment**
```
Status: PENDING_PAYMENT
  → Agent clicks [Cancel Order]
  → Status: CANCELLED
  → Payment link deactivated (no more payments accepted)
  → Chat shows: "Order cancelled"

Status: PAID (before shipment)
  → Customer requests refund
  → Admin initiates refund via gateway
  → Amount transferred back to customer payment method
  → Order status: REFUNDED
  → Audit logged
```

### Link Expiry During Checkout
**Customer clicks link, enters payment form, but link expires mid-payment**
```
Problem: Payment gateway has link, but Onebear thinks it's expired

Solution:
  - Payment gateway honors link for 30 sec after customer starts
  - If customer submits within 30 sec: Payment goes through
  - If customer abandons form: Link fully expires
  - When agent resends: New link with new 24h window (GAP 9)
```

### Multi-Product Order
**Order contains 3 products, 1 goes out of stock before payment**
```
Order: Shirt (in stock) + Pants (out of stock) + Hat (in stock)

Solution (GAP 7 Locked — Stock Soft-Hold):
  - On order creation: Soft-hold stock (reserve it)
    → soft_hold_expires_at = NOW + 30 minutes
  - Cleanup job runs every 5 minutes
  - If order not confirmed within 30 min: Stock soft-hold released automatically
  - If order confirmed + payment link sent (PENDING_PAYMENT): Hold maintained
  - If paid: Stock deducted immediately (soft-hold converted to hard deduction)
  - If payment link expires (24h — GAP 9): Status becomes PAYMENT_EXPIRED, stock released
```

---

## Integration Checklist

- [ ] **Inbox Chat**: Order created in chat context, payment link sent via chat
- [ ] **AI Sales Agent**: AI creates order, generates payment link, sends link automatically
- [ ] **Product Catalog**: Order captures product prices + stock (stock deducted on paid)
- [ ] **CRM**: Order linked to customer record (search orders by customer)
- [ ] **Follow-up Management**: If payment pending > 24h, auto-trigger follow-up; respects 9 AM–9 PM Bangkok send window (GAP 8); out-of-window action configured per shop
- [ ] **Slip Verification**: Bank slips uploaded, AI/manual verification
- [ ] **Dashboard/KPI**: Revenue today, pending payments, payment success rate
- [ ] **Audit Log**: Every order + payment event logged

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Avg time to payment** | <10 min | From link sent to paid |
| **Payment success rate** | 95%+ | PAID / (PAID + FAILED) |
| **Link click rate** | 85%+ | Clicked / sent |
| **Payment conversion** | 70%+ | PAID / PENDING_PAYMENT |
| **Failed payment recovery** | 30%+ | Repaid after resend / failed |
| **Deposit completion rate** | 90%+ | Full deposit + installments paid on time |
| **Order turnaround** | <24h to ship | PAID → READY_SHIP |
| **Refund rate** | <5% | REFUNDED / PAID |

---

## Configuration Defaults

| Setting | Default | Why | Range |
|---------|---------|-----|-------|
| **Link expiry** | 24 hours (LOCKED — GAP 9) | Urgency for payment; standard Thai e-commerce expectation | 1-72 hours |
| **Auto-resend** | ON | Recover failed payments | Toggle |
| **Resend delay** | 24 hours | Not aggressive | 6-72 hours |
| **Max resends** | 3 | Avoid spam | 1-5 |
| **Stock soft-hold** | 30 minutes (LOCKED — GAP 7) | Short hold prevents over-reserving stock for non-committed customers | Fixed |
| **Stock check job** | Every 5 minutes (LOCKED — GAP 7) | Timely release of unclaimed stock | Fixed |
| **Follow-up out-of-window** | send_at_start (LOCKED — GAP 8) | Messages default to next window open rather than being silently dropped | send_at_start / queue / skip |
| **Follow-up send window** | 9 AM – 9 PM Bangkok (LOCKED — GAP 8) | Thai SME standard business hours | Fixed |
| **Deposit %** | 30% | Reasonable upfront | 10-50% |
| **Installments** | 2 | Common use case | 1-5 |
| **Interval** | 7 days | Weekly payment | 1-30 days |

---

## Review Questions

1. **Overpayment handling**: Should we auto-refund overpayment or let customer use as credit?
2. **Partial installment payment**: Should system auto-apply partial payment to next installment, or require exact amount?
3. **Slip verification**: Should AI auto-verify at 95%+ confidence, or require manual for all bank slips?
4. **Cancellation window**: After how long should orders auto-cancel if payment not received? (48h? 72h?)
5. **Refund processing**: Instant refund via gateway, or manual approval first?
6. **Multi-currency**: Should system support multiple currencies, or only THB for MVP?
7. **Payment gateway**: Should we support Omise only, or add Stripe + 2C2P?
8. **Bulk orders**: Can one order have multiple products, or 1 product per order only?

---

## Ready for Feature #8: Slip Verification?

Order Management complete.

**Should I proceed to Feature #8: Slip Verification** (AI verification, confidence thresholds, blacklist, manual review, admin approval workflow)?

---

## Locked Decisions

All decisions below are locked and non-negotiable. They are sourced from `MASTER_PROTOTYPE_SPECIFICATION.md` and must not be changed without a formal gap-decision update.

---

### GAP 7: Stock Soft-Hold Duration

**Decision**: Stock is soft-held for 30 minutes from the time an order is created. If the order is not confirmed (does not reach PENDING_PAYMENT) within 30 minutes, the soft-hold is released and the stock becomes available again.

**Implementation Rules**:
- Order record has a `soft_hold_expires_at` timestamp (= created_at + 30 min)
- Background cleanup job runs every 5 minutes to release expired soft-holds
- Soft-hold is maintained (not reset) once the order reaches PENDING_PAYMENT
- On payment confirmation: soft-hold is converted to a permanent stock deduction
- On cancellation or PAYMENT_EXPIRED: soft-hold is released immediately
- This prevents stock over-reservation by customers who do not complete their order

**Rationale**: 30-minute hold balances customer intent with inventory availability for Thai SME shops that sell limited-quantity products.

---

### GAP 8: Follow-up Out-of-Window Behavior

**Decision**: If a follow-up message is scheduled to send outside the 9:00 AM – 9:00 PM Bangkok time window, the shop owner's configured action determines what happens. The action is set per workspace.

**Three configurable behaviors** (`out_of_window_action` field):
- `send_at_start` — Hold the message and send it at 9:00 AM when the next window opens (default)
- `queue` — Queue the message; it sends at the next window open (functionally equivalent to send_at_start; distinct label for owner clarity)
- `skip` — Discard the message entirely; do not send

**Implementation Rules**:
- Send window is fixed at 9:00 AM – 9:00 PM Bangkok (Asia/Bangkok, UTC+7); not configurable by shop
- `out_of_window_action` is set in workspace Follow-up Settings (default: `send_at_start`)
- Audit log records whether a message was delayed (send_at_start / queue) or discarded (skip)
- No message is ever sent during the 9 PM – 9 AM blackout window

**Rationale**: Sending messages at night is intrusive for Thai customers and reflects poorly on the shop. Shop owners need control over what happens to time-sensitive follow-ups that fall outside the window.

---

### GAP 9: Payment Link Expiry Notification

**Decision**: Payment links expire after 24 hours. When expiry occurs, the system automatically: (1) sets the order status to PAYMENT_EXPIRED, (2) sends a notification to the customer via their original order channel, and (3) creates an internal note for the admin.

**Implementation Rules**:
- Payment link `expires_at` = link_created_at + 24 hours (default; shop can configure 1-72h)
- A scheduled job checks `expires_at` daily (or at minimum every 5 minutes for timely detection)
- On expiry:
  1. Link status → EXPIRED
  2. Order status → PAYMENT_EXPIRED
  3. Customer notification sent via the channel the order originated from (LINE, Facebook Messenger, Instagram DM, etc.)
  4. Internal admin note auto-created: "Payment link expired for Order [ORD-ID] at [timestamp]"
- PAYMENT_EXPIRED does not auto-cancel the order; the agent must decide next action
- Agent can regenerate a new 24h payment link at any time, which returns order to PENDING_PAYMENT
- The customer-facing notification must be sent in Thai (or the language of the originating channel)

**Rationale**: 24 hours creates appropriate urgency while giving customers enough time to act. Automatic notification removes manual tracking burden from shop owners and ensures customers know why their link stopped working.

---

*Locked: April 8, 2026 — Source: MASTER_PROTOTYPE_SPECIFICATION.md (GAP 7, 8, 9)*

