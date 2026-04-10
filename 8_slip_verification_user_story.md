# 8. Slip Verification — User Story

**Status**: Locked — All critical gap decisions incorporated (April 8, 2026)
**Priority**: Critical (Legal/compliance + fraud prevention)
**Target Users**: Agents (upload), Managers/Admins (review & approve)
**Primary Device**: Mobile (slip upload), Desktop (admin review)
**Time Target**: <2 min AI verification, <5 min manual review

---

## Feature Overview

The **Slip Verification** system verifies customer bank transfer receipts (slips) before confirming payment. It uses AI to automatically verify slips with high confidence, and escalates uncertain cases to manual admin review. This prevents fraud while maintaining fast payment confirmation.

**Goal**: Customer sends slip → AI verifies → Confirm payment OR escalate to admin → Order marked COMPLETED.

---

## User Personas & Goals

### Persona 1: Agent (Slip Receiver)
- Customer sends bank slip image/file in chat
- Agent uploads/forwards slip to system
- **Goal**: Upload slip → Quick verification → Order status updates automatically (no manual waiting)

### Persona 2: Manager (Slip Reviewer)
- Reviews slips flagged as "uncertain" by AI (any confidence below 100%)
- Manually verifies slip details (bank, amount, timestamp, account)
- **Goal**: See flagged slips in dashboard → Review → Approve/Reject in <2 minutes

### Persona 3: Admin (Blacklist Manager)
- Manages fraudulent accounts/patterns
- Blocks suspicious banks/accounts from future orders
- **Goal**: Quickly blacklist bad actors, prevent repeated fraud

### Persona 4: Customer (Payer)
- Takes screenshot of bank transfer confirmation
- Sends to agent via chat
- **Goal**: Send once → Auto-verified → Order confirmed (no back-and-forth)

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **Auto-verification rate** | 85%+ | Slip reaches 100% confidence, no manual review needed |
| **Verification time** | <2 min (auto) / <5 min (manual) | Fast = happy customers |
| **Fraud detection rate** | 99%+ | Catch fake slips before accepting payment |
| **Manual review workload** | <15% of slips | Auto = less admin burden |
| **False positive rate** | <1% | Avoid rejecting valid legitimate slips |
| **Blacklist accuracy** | 95%+ | Only block actually fraudulent accounts |

---

## Slip Verification Flow

### Step 1: Slip Upload

```
Customer scenario:
1. Customer completes bank transfer
2. Takes screenshot of transfer confirmation
3. Sends to agent in chat: "ส่งสลิปแล้ว [image]"

Agent action:
  ┌──────────────────────────────┐
  │ Chat showing slip image       │
  │ [Image of bank slip]          │
  │                              │
  │ [Upload to Verify] ← button  │
  │ [Preview]                    │
  └──────────────────────────────┘

Agent clicks [Upload to Verify]:
  - System extracts slip details (OCR)
  - Sends to AI for analysis
  - Status: PENDING_VERIFICATION
```

### Step 2: AI Auto-Verification

```
AI Analysis (< 2 seconds):

Input: Slip image
Check 1: Is this a valid bank slip? (bank logo recognized?)
Check 2: Amount matches order total? (within ±฿1 or ±1%, whichever is larger)
Check 3: Timestamp valid? (within last 24 hours)
Check 4: Bank account matches our account? (correct recipient)
Check 5: Payer details match customer profile? (name/phone)
Check 6: Is account on blacklist? (red flag)

Confidence Threshold (GAP 21 — LOCKED):
  EXACTLY 100% → AUTO-APPROVE
  Anything below 100% → MANUAL REVIEW (admin must decide)
  Unreadable image → Ask customer to resend (not counted as a retry)

Note: There is NO auto-reject path based on confidence score alone.
Any readable slip that does not reach 100% confidence goes to manual review,
regardless of how low the score is. Only the blacklist causes immediate rejection
without manual review.
```

### Step 3: Outcome

#### Option A: 100% Confidence (Auto-Approved)

```
Timeline:
1. 14:30 - Agent uploads slip
2. 14:31 - AI verifies (< 2 sec)
3. 14:31 - Confidence: 100%
4. 14:31 - Order status committed: PENDING_VERIFY → PAID ✅  (atomic DB transaction)
5. 14:31 - Customer confirmation sent immediately after status commit
6. 14:31 - Audit log written async (does not block customer confirmation)

No admin action needed.
Order marked PAID, revenue counted.
```

#### Option B: Below 100% Confidence (Manual Review Required)

```
Timeline:
1. 14:30 - Agent uploads slip
2. 14:31 - AI verifies (confidence: 75% — example)
3. 14:31 - Status: PENDING_VERIFY (flagged for manual review)
4. 14:32 - Admin dashboard shows: "1 slip awaiting review"

Admin action:
  ┌──────────────────────────────────────┐
  │ Slip Review Panel (Desktop)          │
  │                                      │
  │ Order: ORD-2026-001                 │
  │ Customer: Niran K.                   │
  │ Amount: ฿5000                       │
  │                                      │
  │ [Slip Image Preview]                 │
  │                                      │
  │ AI Analysis:                         │
  │  ✅ Bank logo recognized             │
  │  ✅ Amount matches (฿5000)           │
  │  ✅ Timestamp valid                  │
  │  ⚠️ Account name slightly different  │
  │  ✅ Within 24h window                │
  │                                      │
  │ Confidence: 75%                      │
  │                                      │
  │ Admin decision:                      │
  │ [Approve] [Reject] [Request Info]    │
  │                                      │
  │ Notes: [optional textarea]           │
  └──────────────────────────────────────┘

If [Approve]:
  - Order status committed: PENDING_VERIFY → PAID ✅  (atomic)
  - Customer notified immediately after status commit
  - Audit log written async
  - Revenue counted

If [Reject]:
  - Admin selects rejection reason from dropdown (e.g., wrong_amount, blurry, wrong_account)
  - Admin may add private note (stored as admin_note, not shown to customer)
  - Status: PENDING_PAYMENT (back to payment)
  - Customer receives specific reason message (see GAP 24 — Rejection Notification)
  - Flag customer/bank for review

If [Request Info]:
  - Send message to customer: "Please confirm details: [list]"
  - Slip stays PENDING_VERIFY (awaiting customer response)
```

#### Option C: Blacklisted Account (Immediate Rejection)

```
Timeline:
1. 14:30 - Agent uploads slip
2. 14:31 - AI checks blacklist FIRST (before full analysis)
3. 14:31 - Account found: BLOCKED
4. 14:31 - Auto-reject: <1 second
5. Admin notified (internal alert, no customer reason revealed)

No manual review. Customer does not receive the blacklist reason.
Customer receives a generic message: "Unable to process payment. Please contact support."
```

#### Option D: Unreadable Image

```
Timeline:
1. 14:30 - Agent uploads slip
2. 14:31 - AI cannot read image (too blurry, corrupted, or unsupported format)
3. 14:31 - Status remains PENDING_VERIFY (unchanged)
4. 14:31 - Customer receives: "Please send a clearer photo of your payment slip."

This does NOT count toward the 3-retry limit (GAP 22).
Customer retakes photo and resubmits.
```

---

## Retry Limit (GAP 22 — LOCKED)

```
Retry rules per order:
  - Customer may resubmit a slip up to 3 times per order
  - Counter increments only on readable submissions (unreadable image does NOT count)
  - After 3 failed readable submissions, admin must manually check the order
  - System sets flag: manual_review_required = true on slip_verification record
  - Admin sees alert: "Customer has submitted 3 slips without approval. Manual check required."

Retry counter display:
  - Admin review panel shows: "Attempt 2 of 3" label
  - On 3rd attempt, label shows: "Final attempt — manual review triggered"
```

---

## Verification Rules (AI Checks)

```
PRE-ANALYSIS CHECKS (run before AI, in order):
  0a. Duplicate slip detection (hash check, T+50ms) — see Duplicate Slip Detection section
  0b. Blacklist check — Account on blacklist → Immediate rejection, no AI analysis

MUST PASS FOR 100% CONFIDENCE (auto-approve if all mandatory checks clear):
  1. Bank logo recognized (valid Thai bank)
  2. Amount within tolerance: ±฿1 or ±1% of order total, whichever is larger (GAP 23)
  3. Timestamp within last 24 hours AND not in the future (Cases T1, T2)
  4. Recipient account matches shop account
  5. No blacklist match
  6. No fake slip hard flags (F1: pixel manipulation, F4: QR mismatch) — see Fake Slip Detection

RISK FACTORS (any present = confidence drops below 100% → manual review):
  1. Account name slightly different from customer
  2. Amount outside tolerance but not obviously wrong
  3. Timestamp near 24h boundary (Case T2)
  4. Slip image poor quality (but readable)
  5. Unusual bank code (rare bank)
  6. Multiple transfers from same account today (stacking)
  7. Known fake template partial match (Check F2 soft flag)
  8. Font inconsistency in amount field (Check F3)
  9. Bank layout mismatch (Check F5)
  10. Missing QR code on slip type that should have QR (Check F4 soft variant)
  11. Timezone inconsistency on slip (Case T3)

HARD FLAGS (force confidence = 0%, special admin warning required):
  F1: Pixel manipulation detected (>15% anomaly rate in text regions)
  F4: QR data does not match slip text (amount or timestamp mismatch)
  T1: Slip timestamp is in the future

BLACKLIST CHECK (happens before AI analysis):
  1. Account on blacklist → Immediate rejection, no AI analysis
  2. Admin notified internally
  3. Customer receives generic message only
```

---

## Amount Tolerance (GAP 23 — LOCKED)

```
Rule: Accept ±฿1 or ±1% of order total, whichever is larger.

Examples:
  Order ฿100  → Tolerance = ±฿1 (1% = ฿1, so equal; ±฿1 applies)
  Order ฿500  → Tolerance = ±฿5 (1% = ฿5 > ฿1; ±฿5 applies)
  Order ฿5000 → Tolerance = ±฿50 (1% = ฿50 > ฿1; ±฿50 applies)
  Order ฿50   → Tolerance = ±฿1 (1% = ฿0.50 < ฿1; ±฿1 applies)

Rationale: Accounts for Thai banking rounding and minor fee deductions.
Amount outside tolerance = confidence drops below 100% → manual review.

Implementation:
  tolerance = max(1.00, order_total * 0.01)
  pass = abs(amount_paid - order_total) <= tolerance
```

---

## Duplicate Slip Detection (Pre-Analysis Check)

This check runs BEFORE AI analysis, within 50ms of upload. It is the first gate in the verification pipeline.

```
METHOD: SHA-256 hash of raw image bytes, checked against slip_submissions table.

Execution timing:
  T+0ms   Image received by system
  T+1ms   SHA-256 hash computed from raw image bytes
  T+50ms  Hash check completes: SELECT COUNT(*) FROM slip_submissions
            WHERE image_hash = :hash AND status != 'REJECTED'
           (indexed query on image_hash column)

CASE A: Same slip, same order (customer resubmitting after rejection)
  Condition: slip_submissions record exists with image_hash = :hash AND order_id = :current_order_id
             AND status = 'REJECTED'
  Behavior: Allow. Treated as normal resubmission.
  Retry counter: incremented as normal (counts as 1 readable submission)
  Note: This is the legitimate "customer retakes same slip after rejection" scenario.

CASE B: Same slip, different order (attempting to reuse a verified slip)
  Condition: slip_submissions record exists with image_hash = :hash AND order_id != :current_order_id
             AND status != 'REJECTED'
  Behavior: IMMEDIATE REJECTION — no AI analysis runs.
  Response time: <1 second
  reason_code: 'duplicate_slip'
  Customer message: "This slip has already been used for a previous order. Each slip can only be used once."
  Admin notification: "Duplicate slip attempt: ORD-[original_order_id] (original) → ORD-[current_order_id] (attempted)"
  Suspicious activity tracking:
    customer.suspicious_slip_count += 1
    If suspicious_slip_count reaches 3: auto-add customer to MONITORING status
      Admin sees: "Customer flagged for monitoring (3 duplicate slip attempts)"
  Retry counter: does NOT increment (duplicate detection is not a readable submission failure)

CASE C: Same slip, same order but already PAID
  Condition: slip_submissions record exists with image_hash = :hash AND order_id = :current_order_id
             AND order.status IN ('PAID', 'COMPLETED')
  Behavior: REJECT — order already confirmed.
  reason_code: 'already_paid'
  Customer message: "Your order has already been confirmed. No additional payment is needed."
  Admin notification: none required (benign — customer may not realize order is confirmed)
  Retry counter: does NOT increment

STORAGE:
  image_hash written to slip_submissions record on every upload attempt (before any other check)
  image_hash field: VARCHAR(64), indexed, non-nullable
  Hash is stored even for REJECTED submissions (needed for Case A detection)

HASH COLLISION:
  SHA-256 collision probability ≈ 1 in 2^256 (negligible)
  If collision detected (same hash, visually different images via manual admin review):
    Treat as non-duplicate (extremely unlikely in practice)
    System does not have built-in perceptual hash fallback for this edge case
```

---

## Fake Slip Detection (AI Fraud Analysis)

Fake slip detection runs within the AI analysis window (T+300ms to T+1800ms), in parallel with the standard verification checks. It uses visual and structural analysis to detect digitally altered or fabricated slip images.

```
HARD FLAGS (either forces confidence = 0%, no manual review option unlocks this):

Check F1: Digital manipulation detection
  Method: Pixel-level analysis of text regions vs background
    - Extract text regions using OCR bounding boxes
    - Compare compression artifacts: text region vs background region
    - Flag if pixel anomaly rate in text regions > 15% (meaning text was likely pasted in)
  On flag: confidence = 0% immediately
  reason_code: 'image_manipulation_detected'
  Admin banner: "⚠️ AI suspects this slip may be digitally altered. Review carefully."

Check F4: QR code validation
  Method: Decode QR/barcode present on slip image (using zxing-compatible library)
  Thai bank slips that should have QR: PromptPay slips, SCB, KBank, BBL, Krungthai
  If QR present:
    Decode QR data → extract: transaction_id, amount, timestamp, account
    Compare against OCR-extracted values from slip text
    If QR amount != slip text amount (beyond ±฿1 tolerance): confidence = 0%
    If QR timestamp != slip text timestamp (beyond ±60 seconds): confidence = 0%
    reason_code: 'qr_data_mismatch'
  If QR expected but absent:
    Check: is this a slip type that always has QR? (bank-specific format database)
    If yes and QR absent: confidence < 100% → manual review
    reason_code: 'missing_expected_qr'
  Note: QR absence alone does not force confidence to 0% — only QR data mismatch does

Admin handling when confidence = 0% (hard flag):
  Slip goes to manual review WITH special warning banner (cannot be hidden by admin)
  Banner: "⚠️ AI suspects this slip may be digitally altered. Review carefully."
  Banner is red, displayed above all slip details, requires acknowledgement before approve/reject buttons are shown
  If admin clicks [Approve] on a slip with SUSPECTED_FAKE flag:
    System requires secondary approval from a user with Manager or Admin role
    (if reviewing admin IS Manager/Admin: system shows confirmation modal "This slip is flagged as potentially fake. Confirm approval?")
    If second role is different user: pending approval notification sent to all other Manager/Admin users
    Secondary approval timeout: 60 minutes → if no second approver, slip remains in manual review
  reason_code for admin: 'suspected_fake' (internal only, customer sees generic message)
```

```
SOFT FLAGS (reduce confidence below 100%, send to manual review — no special banner):

Check F2: Known fake template recognition
  Method: Perceptual hash comparison against database of known fake slip templates
  Template database: Updated weekly by Onebear security team
  Exact match (perceptual hash distance = 0): confidence = 0% → HARD FLAG
  Near match (perceptual hash distance ≤ 10): confidence drops below 100% → manual review
  reason_code: 'known_fake_template' (near match, soft) or 'exact_fake_template' (hard)

Check F3: Font consistency check
  Method: OCR extracts font metadata from amount field rendering
  Bank-specific expected fonts:
    Bangkok Bank: amount in Helvetica Neue Bold
    KBank: amount in KBank proprietary font (identified by letter-spacing)
    SCB: amount in SCB own font
    Krungthai: amount in Krungthai font
  If font detected in amount field does not match expected bank font:
    confidence drops below 100% → manual review
    reason_code: 'font_inconsistency'
  Note: Font check has ~80% accuracy — treated as soft signal only

Check F5: Bank-specific layout validation
  Method: Template matching against expected layout per bank
  Layout database: Per-bank slip layout specifications (field positions, logos, dimensions)
  If slip layout deviates from expected bank layout by >20%:
    confidence drops below 100% → manual review
    reason_code: 'layout_mismatch'
  If bank cannot be identified (no logo match): risk_factor_count += 1

COMBINED SOFT FLAG IMPACT:
  Each soft flag reduces confidence below 100% (exact amount depends on composite formula)
  Any soft flag = goes to manual review (since auto-approve requires exactly 100%)
  2+ soft flags = confidence shows as "< 50%" in admin review panel (additional visual warning)
```

---

## Amount Mismatch — Specific Cases

These expand on GAP 23 (amount tolerance ±฿1 or ±1%) with exact admin options for each sub-case.

```
AMOUNT COMPARISON FORMULA (exact — from GAP 23):
  tolerance = max(1.00, order_total × 0.01)   [in Baht, rounded to 2 decimal places]
  amount_ok = abs(slip_amount - order_total) <= tolerance
  If amount_ok = false: risk_factor_count += 1 → confidence cannot reach 100%
```

```
CASE AM1: Amount too low (underpayment beyond tolerance)
  Example: Slip ฿4,900, order ฿5,000 (short ฿100; tolerance = ฿50; 100 > 50 → fails)
  AI result: confidence < 100% → manual review
  Admin review panel shows: "Amount short by ฿100.00 (received ฿4,900 / expected ฿5,000)"
  Admin options:
    [Approve anyway]          → standard approval flow (order → PAID)
    [Reject - wrong amount]   → reason_code = 'wrong_amount'
    [Request additional payment] → new option:
      Customer receives: "We received ฿4,900 but your order total is ฿5,000.
                         Please transfer the remaining ฿100 and send the new slip."
      Order stays PENDING_VERIFY
      New slip submission expected (retry counter resets? → No: retry counter is per order,
        any readable submission from this point increments counter regardless of reason)

CASE AM2: Amount too high (overpayment beyond tolerance)
  Example: Slip ฿5,200, order ฿5,000 (overpaid ฿200; tolerance = ฿50; 200 > 50 → fails)
  AI result: confidence < 100% → manual review
  Admin review panel shows: "Overpayment of ฿200.00 (received ฿5,200 / expected ฿5,000)"
  Admin options:
    [Approve + credit ฿200]   → standard approval; order_credit record created:
                                 INSERT INTO order_credits (customer_id, amount, reason, source_order_id)
                                 VALUES (:customer_id, 200.00, 'overpayment', :order_id)
    [Approve - no credit]     → standard approval; ฿200 treated as donation/absorbed
    [Reject]                  → reason_code = 'wrong_amount'

CASE AM3: Amount within tolerance but close (suspicious rounding)
  Example: Slip ฿4,999, order ฿5,000 (difference ฿1; tolerance = ฿50; 1 ≤ 50 → PASSES)
  AI result: amount_ok = true → does NOT reduce confidence for this alone
  No special treatment. Standard confidence calculation applies.
  Admin does NOT see a special warning for this case.

CASE AM4: Fee deduction (bank transfer fee absorbed by tolerance)
  Example: Slip ฿4,975, order ฿5,000 (short ฿25; typical transfer fee ฿25; tolerance = ฿50; 25 ≤ 50 → PASSES)
  AI result: amount_ok = true → passes
  Note: The ±฿50 tolerance for ฿5,000 order is intentionally sized to absorb Thai bank transfer fees (฿10–25).
  If transfer fee exceeds tolerance (e.g., ฿60 fee on small order):
    Slip falls into Case AM1 handling.

CASE AM5: Zero amount or unreadable amount
  Example: OCR extracts ฿0.00 or fails to read amount field
  AI result: confidence = 0% immediately (cannot verify payment amount)
  Goes to manual review
  Admin sees: "Amount could not be read from slip — manual verification required"
  reason_code (if rejected): 'wrong_amount' (customer message: wrong amount template)
  reason_code (internal): 'amount_unreadable'
```

---

## Timestamp Fraud Cases

```
CASE T1: Future timestamp (clock manipulation)
  Condition: slip.timestamp > system_time (slip timestamp is after current time)
  Detection: |slip.timestamp - NOW()| > 60 seconds AND slip.timestamp > NOW()
    (60-second buffer to account for minor clock drift)
  AI result: confidence = 0% immediately
  reason_code: 'timestamp_future'
  Hard flag: yes → admin sees warning banner "Slip timestamp is in the future — likely manipulated"
  Admin note shown: "AI flagged: slip timestamp is [X] minutes in the future"
  No secondary approval required (this is a hard fraud signal — single admin decision)

CASE T2: Exactly 24h boundary
  Condition: slip.timestamp is between 23h 59m and 24h 1m before NOW()
  Slip at 23h 59m ago: timestamp_age = 23:59 < 24:00 → PASSES (within window)
  Slip at 24h 01m ago: timestamp_age = 24:01 > 24:00 → FAILS (outside window)
  AI result (fail): confidence < 100% → manual review (not a hard flag)
  reason_code: 'expired_timestamp'
  Admin sees: "Slip timestamp is 24 hours 1 minute old — just outside 24h window"
  Admin may use discretion: [Approve anyway] for borderline cases

CASE T3: Timezone inconsistency on slip
  Condition: slip contains explicit timezone data inconsistent with issuing bank's region
  Example: Bangkok Bank slip showing timezone UTC-5 (Eastern US time)
  Thai bank slips expected timezone: ICT (UTC+7) or UTC (some digital formats)
  Detection: OCR extracts timezone from slip → compare against bank's expected timezone
  If mismatch detected:
    confidence drops below 100% → manual review (soft flag)
    reason_code: 'timezone_inconsistency'
    Admin sees: "Slip shows timezone [X], expected [Y] for [Bank Name]"
  Note: Not all slips include explicit timezone data.
    If timezone absent: no deduction (absence is normal)
    If timezone present and wrong: soft flag only (not hard)

TIMESTAMP CHECK IMPLEMENTATION NOTE:
  All timestamp comparisons use Asia/Bangkok (ICT, UTC+7) as the reference timezone.
  slip.timestamp is converted to UTC before comparison with system UTC time.
  System time source: NTP-synchronized server clock (Azure infrastructure).
```

---

## Rejection Notification (GAP 24 — LOCKED)

```
When admin rejects a slip, they must:
  1. Select a reason_code from dropdown
  2. Optionally add a private admin_note (never shown to customer)

Reason codes and corresponding customer messages:

  reason_code: blurry_image
  Customer message: "Your slip photo is not clear enough to verify. Please retake the photo in good lighting and reupload."

  reason_code: wrong_amount
  Customer message: "The amount on your slip does not match the order total. Please verify the transfer amount and reupload."

  reason_code: wrong_account
  Customer message: "The recipient account on your slip does not match our payment account. Please ensure you transferred to the correct account."

  reason_code: expired_timestamp
  Customer message: "Your slip shows a transfer date that is more than 24 hours old. Please make a new transfer and send the slip."

  reason_code: suspicious_content
  Customer message: "We were unable to verify your payment slip. Please contact our support team for assistance."

  reason_code: duplicate_slip
  Customer message: "This slip has already been submitted. If you believe this is an error, please contact support."

  reason_code: other
  Customer message: "We were unable to verify your payment slip. Please contact our support team for assistance."

Admin note is stored in slip_verification.admin_note field.
Customer NEVER sees the admin note.
Customer sees ONLY the reason_code-mapped message above.
```

---

## Order Status Atomicity (GAP 25 — LOCKED)

```
Commit sequence for ALL approvals (auto or manual):

  Step 1 (synchronous, DB transaction):
    - UPDATE orders SET status = 'Paid', paid_at = NOW() WHERE id = :order_id
    - COMMIT transaction immediately

  Step 2 (after commit, send customer confirmation):
    - POST /chat/send: "Payment received and verified. Your order is confirmed."
    - Customer is notified as soon as status is committed

  Step 3 (asynchronous, non-blocking):
    - INSERT INTO verification_audit_log (...)
    - UPDATE slip_verification SET result = 'approved', approved_by = :admin_id, approved_at = NOW()
    - Any webhook/integration triggers

Guarantee: Customer confirmation is NEVER delayed by logging.
If async log fails, order status is already Paid — do not roll back.
Failed async logs are retried by background job (3 retries with backoff).
```

---

## Blacklist Management

### Admin Blacklist Dashboard

```
Slip Verification Settings

TAB: Blacklist Management
┌────────────────────────────────────────────────┐
│ Blocked Banks & Accounts                       │
├────────────────────────────────────────────────┤
│ Account: 123-456-7890 (Bangkok Bank)           │
│    Status: BLOCKED                             │
│    Reason: Fraudulent transfers (5 attempts)   │
│    Added: 2026-04-05                           │
│    Action: [Whitelist] [Extend Block]          │
│            (no delete option — permanent)       │
│                                                │
│ Account: 987-654-3210 (Kasikornbank)           │
│    Status: BLOCKED                             │
│    Reason: Invalid slip submission (3x)        │
│    Added: 2026-03-28                           │
│    Action: [Whitelist] [Extend Block]          │
│                                                │
│ Account: 555-888-2222 (Krungthai)             │
│    Status: MONITORING (suspicious)             │
│    Reason: Unusual pattern (10+ transfers/hr) │
│    Added: 2026-04-07                           │
│    Action: [Block Now] [Clear Flag]            │
│            (no delete option — permanent)       │
│                                                │
├────────────────────────────────────────────────┤
│ [+ Add to Blacklist]                           │
│ [Block Bank] [Block Country Code]              │
└────────────────────────────────────────────────┘

Rules:
  - BLOCKED: Slips auto-rejected, no manual review
  - MONITORING: Slips flagged for manual review (yellow alert)
  - AUTO-UNBLOCK: After 30 days (unless extended)
  - DELETE is not available for any role — blacklist entries are permanent records
```

### Automatic Blacklist Triggers

```
Auto-block if:
  1. Same account rejects 5+ times (likely fraud)
  2. Same account submits 10+ slips in 1 hour (stacking)
  3. Account marked as "stolen/disputed" by bank
  4. Admin manually blocks

Auto-monitor (flag yellow) if:
  1. Same account has 3+ auto-rejections (risky)
  2. Unusual transfer pattern (e.g., 5am transfer)
  3. Customer reports chargebacks on this account
```

---

## Configuration Panel (Admin Desktop)

```
Slip Verification Settings

GENERAL:
  AI Confidence Threshold for Auto-Approve: 100% (fixed, not configurable)
  All slips below 100%: Always go to manual review (no exceptions)

VERIFICATION RULES:
  Bank logo recognition: [Toggle] ✅
  Amount tolerance: ±฿1 or ±1% (whichever is larger) — GAP 23
  Timestamp window: [24] hours
  Recipient account matching: [Toggle] ✅

RETRY SETTINGS:
  Max slip submissions per order: 3 (after 3, admin must manually check)

NOTIFICATIONS:
  Notify admin on manual review needed: [Toggle] ✅
  Notify customer if rejected: [Toggle] ✅  (with specific reason — GAP 24)
  Auto-escalate after: [5] minutes (if admin doesn't review)

BLACKLIST SETTINGS:
  Auto-blacklist after rejections: [5] failed slips
  Auto-monitoring after: [3] suspicious slips
  Block duration: [30] days (auto-unblock unless extended)
  Allow whitelist override: [Toggle] ✅

IMAGE QUALITY:
  Min image resolution: [720] pixels
  Max file size: [5] MB
  Supported formats: [JPG, PNG, PDF]
```

---

## Acceptance Criteria

### Slip Upload & Extraction
- [ ] Agent can upload slip image/file from chat
- [ ] System extracts slip details via OCR (amount, bank, timestamp, account, payer name)
- [ ] Slip image stored with encryption (secure storage)
- [ ] Order status: PENDING_VERIFY (while processing)
- [ ] Upload supports: JPG, PNG, PDF formats
- [ ] File size limit: Max 5MB
- [ ] Image quality check: Min 720px (ask for resend if too blurry — does not count as retry)

### AI Auto-Verification
- [ ] AI analyzes slip < 2 seconds
- [ ] Checks: Bank logo, amount (±฿1 or ±1% tolerance), timestamp, recipient account, payer details, blacklist
- [ ] Confidence threshold: Exactly 100% for auto-approve; anything below = manual review
- [ ] 100% confidence: Auto-approved, order status committed atomically, async log follows
- [ ] Below 100% confidence: Flagged for manual review (regardless of exact score)
- [ ] Unreadable image: Ask customer for clearer photo; does NOT count toward retry limit
- [ ] Blacklist check happens BEFORE AI analysis; blacklisted = immediate rejection, no AI analysis

### Retry Limit
- [ ] System tracks submission_count per order on slip_verification record
- [ ] Readable submissions increment counter; unreadable submissions do not
- [ ] After 3 readable submissions without approval, manual_review_required flag set
- [ ] Admin sees "Customer submitted 3 slips without approval. Manual check required." alert
- [ ] Admin review panel shows current attempt number (e.g., "Attempt 2 of 3")

### Manual Review
- [ ] Admin dashboard shows slips awaiting review (sorted by age)
- [ ] Admin can view: Order details, slip image, AI analysis, confidence score, attempt number
- [ ] Admin can: Approve / Reject / Request More Info
- [ ] On reject: Admin must select reason_code from predefined list
- [ ] Admin can add private note (stored as admin_note, never shown to customer)
- [ ] Review can be completed < 5 minutes
- [ ] Auto-escalate if admin doesn't review within 5 minutes (notify manager)
- [ ] Audit log: Who reviewed, when, decision, reason_code, admin_note

### Approval/Rejection
- [ ] On approve: Order status committed first (PENDING_VERIFY → PAID), then async log
- [ ] On approve: Customer notified immediately after status commit
- [ ] On approve: Revenue counted immediately
- [ ] On reject: Order status PENDING_VERIFY → PENDING_PAYMENT
- [ ] On reject: Customer receives specific reason message mapped from reason_code (GAP 24)
- [ ] On reject: Admin note stored privately, never sent to customer
- [ ] On "request info": Slip stays PENDING_VERIFY, customer message sent

### Blacklist Management
- [ ] Admin can manually add accounts to blacklist (with reason)
- [ ] Admin can set block duration (permanent or N days)
- [ ] Auto-blacklist: After 5 consecutive rejections (configurable)
- [ ] Blacklisted accounts: All future slips auto-rejected immediately
- [ ] Monitoring status: Flag accounts with 3+ suspicious slips (yellow alert)
- [ ] Auto-unblock: After 30 days (unless extended by admin)
- [ ] Whitelist override: Admin can manually whitelist if needed
- [ ] No delete option available anywhere in blacklist UI for any role
- [ ] Audit log: Who added to blacklist, reason, when, expiry

### Notifications
- [ ] Admin notified when slip needs manual review: "1 slip awaiting review (ORD-2026-001)"
- [ ] Auto-escalate: If admin doesn't review within 5 min, notify manager
- [ ] Customer notified on approval immediately after order status commit
- [ ] Customer notified on rejection with specific reason_code message (not generic)
- [ ] Customer NOT told if rejection is due to blacklist — receives generic support message only
- [ ] Audit log: Every verification action logged

### Duplicate Slip Detection
- [ ] SHA-256 hash computed on every upload at T+1ms, stored in slip_submissions.image_hash
- [ ] Hash check completes within 50ms (indexed DB query)
- [ ] Case A (same slip, same order, previously rejected): allowed — treated as normal resubmission
- [ ] Case B (same slip, different order): immediate rejection < 1 second, reason_code = 'duplicate_slip'
- [ ] Case B: customer.suspicious_slip_count incremented; admin notified with both order IDs
- [ ] Case B: if suspicious_slip_count reaches 3, customer auto-added to MONITORING status
- [ ] Case C (same slip, same order, order already PAID): rejection with reason_code = 'already_paid', no admin action
- [ ] Duplicate detection does NOT increment retry counter

### Fake Slip Detection
- [ ] Check F1 (pixel manipulation): runs within AI analysis window; >15% anomaly rate → confidence = 0%
- [ ] Check F4 (QR validation): QR data decoded; amount or timestamp mismatch → confidence = 0%
- [ ] Checks F2, F3, F5 (template, font, layout): soft flags only → confidence < 100% → manual review
- [ ] Hard flag (F1 or F4 fired): admin sees red banner "⚠️ AI suspects this slip may be digitally altered" — cannot be hidden
- [ ] Admin must acknowledge hard-flag banner before approve/reject buttons are enabled
- [ ] Admin approving SUSPECTED_FAKE slip: secondary approval required from Manager/Admin role
- [ ] Secondary approval timeout: 60 minutes (slip stays in manual review if no second approver)
- [ ] Future timestamp (Case T1): confidence = 0%, admin warning shown
- [ ] Timezone inconsistency (Case T3): confidence < 100%, soft flag only

### Amount Mismatch Cases
- [ ] Case AM1 (underpayment): admin sees "Amount short by ฿X", options: Approve / Reject / Request additional payment
- [ ] Case AM1 "Request additional payment": customer receives specific amount-owed message; order stays PENDING_VERIFY
- [ ] Case AM2 (overpayment): admin sees "Overpayment of ฿X", options: Approve+credit / Approve-no-credit / Reject
- [ ] Case AM2 "Approve+credit": order_credit record inserted with customer_id, amount, source_order_id
- [ ] Case AM3 (within tolerance): no warning shown; confidence not reduced for this alone
- [ ] Case AM4 (bank fee): ฿25 fee on ฿5,000 order passes tolerance (฿25 < ฿50 tolerance)
- [ ] Case AM5 (unreadable amount): confidence = 0%; admin sees "Amount could not be read"

### Dashboard & Analytics
- [ ] Slips pending review count + list (sortable by age)
- [ ] AI auto-verification rate: % auto-approved / total
- [ ] Manual review rate: % flagged for manual / total
- [ ] Approval rate: % approved by admin / reviewed
- [ ] Rejection rate: % rejected by admin / reviewed
- [ ] Blacklist count: Total blocked accounts
- [ ] Blocked revenue: ฿ from blacklisted accounts (prevented fraud)
- [ ] Fake slip detection count: total slips flagged as SUSPECTED_FAKE (daily + cumulative)
- [ ] Duplicate slip attempt count: total Case B detections (daily + cumulative)
- [ ] Suspicious customer count: customers in MONITORING status

### Error Handling
- [ ] OCR fails (unreadable image): Ask customer for clearer image; does not count as retry
- [ ] No recipient account configured: Show error "Shop bank account not configured"
- [ ] API timeout: Retry 3 times with backoff (1s, 5s, 15s)
- [ ] Slip image corrupted: Ask customer to resend with message "File could not be read. Please send a new image."
- [ ] Async log fails after status commit: Background job retries log write (3 retries); does NOT roll back order status

---

## Edge Cases

### Poor Image Quality
```
Problem: Customer takes blurry/angled photo

AI Result: Image unreadable — NOT counted as a retry attempt

Customer path:
  1. Receives: "Please send a clearer photo of your payment slip."
  2. Takes clearer photo
  3. Resubmits — retry counter unchanged
```

### Account Name Mismatch
```
Problem: Slip shows "Niran Karunasena" but registered as "Niran K."

AI Result: Confidence below 100% (name slightly different)

Admin path:
  1. Sees: Slip awaiting review
  2. Views slip: Amount ✅, Bank ✅, Name slightly different
  3. Checks CRM: Customer name is "Niran K." (nickname for longer name)
  4. Admin approves → Order status committed → PAID → Customer notified
```

### Multiple Transfers
```
Problem: Customer made 2 transfers (1st failed, sent 2nd)

Slip 1 submitted:
  - AI checks: All pass
  - Confidence: 100%
  - Order status committed: PAID ✅

Slip 2 submitted:
  - AI checks: Amount ✅, But already paid once
  - Duplicate detection: Same order, same customer
  - Cannot approve: Order already PAID
  - Admin notified: "Duplicate slip submission for already-paid order"
  - Customer receives: reason_code duplicate_slip message
```

### Blacklisted Account
```
Problem: Account added to blacklist for fraud

New slip from same account:
  1. Agent uploads slip
  2. Blacklist check runs FIRST (before AI analysis)
  3. Account found: BLOCKED
  4. Auto-reject: <1 second
  5. Admin notified internally
  6. Customer receives generic message: "Unable to process payment. Please contact support."

No manual review. Customer does not learn they are blacklisted.
```

### Slip Timestamp Old
```
Problem: Customer sends screenshot from 2 days ago

AI Result: Confidence below 100%
  - Check: Timestamp 48 hours old — fails timestamp rule
  - Confidence cannot reach 100% → goes to manual review

Admin sees reason: Timestamp outside 24h window
Customer message if rejected: reason_code = expired_timestamp
"Your slip shows a transfer date that is more than 24 hours old. Please make a new transfer and send the slip."
```

### Customer Exhausts Retry Limit
```
Problem: Customer submits 3 readable slips, none approved

After 3rd submission:
  1. slip_verification.submission_count = 3
  2. manual_review_required flag set to true
  3. Admin alert: "Customer has submitted 3 slips without approval. Manual check required for ORD-2026-XXX."
  4. Admin reviews order manually — can approve, reject, or request info
  5. Customer message stays unchanged: "Your payment slip is being reviewed."
```

### Fake Slip Detected
```
Problem: Customer submits digitally edited bank slip

Check F1 fires (pixel anomaly > 15%):
  1. Agent uploads slip
  2. Duplicate hash check: no duplicate (new slip)
  3. AI analysis runs: F1 fires → confidence forced to 0%
  4. Status stays PENDING_VERIFY (manual review)
  5. Admin sees slip review panel WITH red banner:
     "⚠️ AI suspects this slip may be digitally altered. Review carefully."
  6. Banner must be acknowledged (click [I understand]) before approve/reject shown
  7. Admin reviews manually: "Amount mismatch visible — text looks pasted"
  8. Admin clicks [Reject]
  9. reason_code = 'suspicious_content'
  10. Customer receives: "We were unable to verify your payment slip. Please contact our support team."
  11. Admin notes internally: "SUSPECTED_FAKE — F1 pixel anomaly"
  12. customer.suspicious_slip_count += 1

If admin tries to approve SUSPECTED_FAKE slip:
  Modal: "This slip is flagged as potentially fake. Confirm approval?"
  If admin is Manager/Admin: single confirmation sufficient
  If admin has lower permissions: system requires secondary Manager/Admin approval
  Secondary approval request sent; 60-minute timeout applies
```

### Duplicate Slip Reuse Attempt
```
Problem: Customer submits same slip image for a second order

New order created by same customer. Customer sends the same slip image.

T+0ms   Agent uploads slip image
T+1ms   SHA-256 hash computed: matches hash from ORD-2026-001 (previous order, PAID)
T+50ms  Hash check: found in slip_submissions (Case B)
T+51ms  IMMEDIATE REJECTION (no AI analysis)
        reason_code = 'duplicate_slip'
        Customer message: "This slip has already been used for a previous order.
                          Each slip can only be used once."
        Admin notification: "Duplicate slip attempt:
                            ORD-2026-001 (original, PAID) → ORD-2026-015 (attempted)"
        customer.suspicious_slip_count → 1 (or incremented if already > 0)
```

---

## Integration Checklist

- [ ] **Inbox Chat**: Slip upload button in chat actions menu
- [ ] **Order Management**: Slip verification updates order status (PENDING_VERIFY → PAID) atomically
- [ ] **CRM**: Customer slip history linked to customer record; retry count visible in customer profile
- [ ] **Dashboard/KPI**: Slip verification rate, fraud prevention count
- [ ] **Audit Log**: Every slip upload, verification, approval/rejection logged (async, does not block status)
- [ ] **Notifications**: Admin alerts for manual reviews, customer confirmations with specific reasons
- [ ] **Payment Gateway**: Slip verification independent from Payso (offline verification)

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Auto-verification rate** | 85%+ | Auto-approved / total slips |
| **Verification speed (auto)** | <2 sec | From upload to approval |
| **Verification speed (manual)** | <5 min | From flagged to resolved |
| **Manual review rate** | <15% | Manual / total |
| **Fraud detection rate** | 99%+ | Blocked fraud / attempted fraud |
| **False positive rate** | <1% | Rejected legitimate / total approved |
| **Approval rate (manual)** | 70%+ | Approved by admin / reviewed |
| **Blacklist accuracy** | 95%+ | Correct blocks / total blocks |

---

## Configuration Defaults

| Setting | Default | Why | Range |
|---------|---------|-----|-------|
| **Auto-approve threshold** | 100% | Only perfect confidence auto-approves | Fixed at 100% |
| **Manual review threshold** | Below 100% | Any uncertainty requires human check | Fixed |
| **Amount tolerance** | ±฿1 or ±1% | Accounts for Thai banking rounding/fees | Fixed |
| **Timestamp window** | 24 hours | Recent transfer = legitimate | 1-72 hours |
| **Max retries per order** | 3 | Limit abuse; force admin review after 3 | 1-5 |
| **Auto-blacklist** | 5 rejections | After 5 fails, likely fraud | 3-10 |
| **Block duration** | 30 days | Enough to prevent abuse | 7-90 days |

---

## Review Questions

~~1. **100% confidence requirement**: Should we ever auto-approve at <100% confidence, or always require 100% for auto-approve?~~
**RESOLVED (GAP 21)**: Exactly 100% for auto-approve. Anything below = manual review. No exceptions.

~~2. **Amount tolerance**: Is exact match required, or is a small tolerance acceptable?~~
**RESOLVED (GAP 23)**: ±฿1 or ±1% of order total, whichever is larger.

~~3. **Customer resubmission**: Can customers resubmit a slip after wrong upload?~~
**RESOLVED (GAP 22)**: Yes, max 3 readable retries per order. After 3, admin must manually check.

~~4. **Rejection notification**: Does customer receive a specific reason or a generic message?~~
**RESOLVED (GAP 24)**: Specific reason shown to customer via reason_code-mapped messages. Admin note stored privately.

~~5. **Order status atomicity**: Does status update happen synchronously or with logging?~~
**RESOLVED (GAP 25)**: Order status commits first (synchronous transaction). Logging is async and non-blocking.

6. **Manual review threshold**: Is there a lower confidence bound below which we should still auto-reject instead of always sending to manual review? (Currently: all below 100% = manual review, no auto-reject)
7. **Timestamp window**: Should it be 24 hours, 48 hours, or customer-configurable?
8. **Auto-blacklist trigger**: Is 5 rejections the right number? Should it be 3 or 10?
9. **Whitelist override**: Should admins be able to override blacklist decisions?
~~10. **Duplicate detection**: Should system prevent submitting same slip twice across different orders?~~
**RESOLVED**: Yes. SHA-256 hash-based duplicate detection prevents reuse of verified slips across orders. See Duplicate Slip Detection section.
11. **Customer appeals**: If rejected, can customer dispute/appeal the rejection?

---

## Locked Decisions

This section documents all product decisions that are finalized and must not be changed without explicit product owner approval. These decisions are sourced from `MASTER_PROTOTYPE_SPECIFICATION.md` and locked on April 8, 2026.

---

### GAP 21: Confidence Threshold for Auto-Approval

**Decision**: AI must reach exactly 1.0 confidence (100%) to auto-approve. Anything below 100% requires manual admin review.

**Rationale**: No partial confidence is acceptable for automatic payment confirmation. Human judgment is required for any ambiguity.

**Implementation**:
- `if confidence < 1.0: status = "manual_review"`
- Admin must explicitly approve or reject all non-100% slips
- There is no auto-reject path based on confidence score alone

**Affected sections updated**: Step 2 AI scoring, Option B/C outcomes, Verification Rules, Configuration Defaults, Acceptance Criteria, Configuration Panel.

---

### GAP 22: Customer Resubmission After Wrong Image

**Decision**: Yes, customers may resubmit. Maximum 3 readable retries per order. After 3, admin must manually check the order.

**Rationale**: Customers legitimately upload wrong images. A limit prevents abuse while allowing genuine retries.

**Implementation**:
- `slip_verification.submission_count` — increments only on readable submissions
- `slip_verification.manual_review_required = true` — set after 3rd readable submission
- Unreadable image (OCR failure) does NOT increment counter
- Admin sees alert after 3rd attempt

**Affected sections updated**: Step 2, Retry Limit section (new), Configuration Panel, Acceptance Criteria, Edge Cases.

---

### GAP 23: Amount Tolerance

**Decision**: Accept ±฿1 or ±1% of order total, whichever is larger.

**Rationale**: Thai banking systems may deduct small fees or round amounts. A rigid exact-match rule would cause unnecessary false rejections for legitimate payments.

**Implementation**:
```
tolerance = max(1.00, order_total * 0.01)
pass = abs(amount_paid - order_total) <= tolerance
```
Amount outside tolerance causes confidence to drop below 100% → manual review.

**Affected sections updated**: Step 2 Check 2, Verification Rules, Amount Tolerance section (new), Configuration Panel, Configuration Defaults.

---

### GAP 24: Rejection Notification to Customer

**Decision**: Customer receives a specific reason message based on reason_code. Admin may add a private note that is never shown to the customer.

**Rationale**: Customers need actionable information to fix their submission. Generic messages cause confusion and repeat contact. Admin notes allow internal context without exposing operational logic to customers.

**Implementation**:
- `slip_rejection.reason_code` — enum: blurry_image, wrong_amount, wrong_account, expired_timestamp, suspicious_content, duplicate_slip, other
- `slip_rejection.admin_note` — free text, admin-only
- Customer message derived from reason_code mapping (see Rejection Notification section)
- admin_note is NEVER included in any customer-facing message

**Affected sections updated**: Option B rejection flow, Rejection Notification section (new), Acceptance Criteria, Edge Cases, Notifications.

---

### GAP 25: Order Status Atomicity

**Decision**: Order status changes first in a synchronous DB transaction. Customer is confirmed immediately after commit. Audit logging is asynchronous and non-blocking.

**Rationale**: Customer experience must not be delayed by logging. If the log write fails, the payment is already confirmed — do not roll back. Log failures are retried by background job.

**Implementation**:
- Transaction: `UPDATE orders SET status = 'Paid'` — commits immediately
- Customer notification: sent after transaction commit
- Audit log: async job, 3-retry backoff on failure
- Failed log write does NOT trigger order status rollback

**Affected sections updated**: Option A timeline, Option B approval flow, Order Status Atomicity section (new), Acceptance Criteria, Error Handling.

---

## Ready for Feature #9: Calendar & KPI?

Slip Verification locked and complete with all 5 gap decisions incorporated.

**Should I proceed to Feature #9: Calendar & KPI** (event aggregation, revenue heatmap, KPI snapshot calculations, role-based visibility)?
