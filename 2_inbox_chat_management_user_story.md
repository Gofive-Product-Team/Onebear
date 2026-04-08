# 2. Inbox & Chat Management — User Story

**Status**: Ready for Review
**Priority**: 🔴 Critical (Core communication hub)
**Target Users**: Shop admins, sales staff, team managers
**Primary Device**: Mobile (70%), Desktop (30%)
**Goal**: Unified inbox for all channels, instant message routing, smart AI handoff

---

## Feature Overview

**Inbox** is the central command center where all customer messages from every channel (LINE, Facebook, Instagram, WhatsApp, Lazada, TikTok) arrive in one place. Messages are automatically assigned to team members, AI helps respond automatically, and escalation alerts notify managers when responses are slow.

**Key Value**: Never miss a message. Respond faster. Let AI handle easy questions.

---

## User Personas & Goals

### Persona 1: Solo Seller (Primary)
- Only person managing the shop
- Wants to see all chats in one place
- Needs AI to respond when busy
- **Goal**: See all incoming chats, let AI help, respond only to urgent ones

### Persona 2: Shop Manager
- Manages team of 3-5 staff members
- Assigns chats to team members
- Needs alerts when chats are slow to respond
- **Goal**: Monitor team response time, see SLA violations, ensure good customer service

### Persona 3: Sales Staff
- Handles assigned chats only
- Responds to customers on their assigned chats
- Uses AI suggestions to close orders
- **Goal**: Quick access to assigned chats, AI help for upsells, easy order creation

---

## Business Value

| Metric | Target | Impact |
|--------|--------|--------|
| **Response time** | < 5 min average | Happy customers = higher conversion |
| **AI handoff accuracy** | > 80% correct handoffs | Reduces back-and-forth |
| **SLA compliance** | > 85% (< 15 min first response) | Professional service = trust |
| **Message grouping** | 100% (no duplicates) | Clean inbox = better UX |
| **Team utilization** | Round-robin fair distribution | Fair workload = staff happiness |

---

## Feature Flow

### Overview: Inbox Layout

```
┌──────────────────────────────────────────────────────────┐
│ 📬 Inbox                          🔔 SLA Alert: 2 chats  │
├──────────────────────────────────────────────────────────┤
│ Filter: [All] [Unread] [AI] [Assigned to me] [Pinned]  │
├──────────────────────────────────────────────────────────┤
│ Chat List:                                               │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 📌 Jane Smith (Pinned)         🔴 15 min ago      │  │
│ │    "ไม่สั่งแล้ว ลองแบบอื่นหรือไม่"                │  │
│ │    [💬 Chat] [📱 Call] [Pin]                      │  │
│ └─────────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ John Doe (Your Chat)           ⏳ 1 hour ago      │  │
│ │    "ช่ายยังไม่ส่ง"                                │  │
│ │    [💬] [📱] [⭐ Star] [Pin]                      │  │
│ └─────────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 🤖 AI Chat: Mike (AI responding)  👍 Just now    │  │
│ │    Mike: "ได้ครับ 😊 ส่ง Link ให้แล้ว"             │  │
│ │    AI: "ขอบคุณค่ะ 🎉"                             │  │
│ │    [👤 Takeover] [⭐] [Pin]                       │  │
│ └─────────────────────────────────────────────────────┘  │
│ ...more chats...                                         │
└──────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Multi-channel Message Routing

**How it works:**
```
Customer sends message:
  LINE: "สนใจสินค้า A ไหม"
  Facebook: "มีสต็อกไหม"
  Instagram DM: "ราคาเท่าไหร่"

    ↓ (All arrive within 1-2 seconds)

Inbox shows all in ONE list (not separate tabs)
  ✅ [LINE - Jane] "สนใจสินค้า A ไหม"
  ✅ [FB - John] "มีสต็อกไหม"
  ✅ [IG - Mike] "ราคาเท่าไหร่"
```

**Rules**:
- ✅ All channels merge into single Inbox
- ✅ Channel icon shows which platform message came from
- ✅ Channel name displayed (LINE / Facebook / Instagram / etc.)
- ✅ Messages arrive in real-time (< 2 seconds)
- ✅ If channel offline → messages queue, process when online
- ✅ No duplicate chats (same customer on 2 channels = 2 separate threads)
- ✅ **[LOCKED — GAP 2]** Channel integration limit is a hard cap. When workspace reaches its channel limit, the system rejects new channel connections with error `CHANNEL_LIMIT_EXCEEDED`. No partial integrations allowed.

---

### 2. Message Assignment

**Automatic Assignment (Round-robin)**
```
New message arrives:
  → System finds next available staff member in rotation
  → Assign to: Agent A
  → Message routed to their "Assigned to me" filter
  → Notification sent: 📬 "Jane Smith: ลองสินค้า A หรือไม่"

If Agent A is offline:
  → Skip to next available Agent B
  → If no one online → Message stays in queue
  → First person to come online gets it
```

**Manual Reassignment (Manager only)**
```
Manager sees chat assigned to Agent A
  → Long press (mobile) or right-click (desktop)
  → "Reassign to..."
  → Select Agent B
  → Chat moves to Agent B's queue
  → System logs: "Manager X reassigned John's chat from A to B"
```

**Rules**:
- ✅ New chats use round-robin (fair distribution)
- ✅ Existing chats stay with assigned agent
- ✅ Manager/Super Admin can reassign anytime
- ✅ Agent/Staff cannot reassign (only manager can)
- ✅ If no staff online → message waits in queue (doesn't bounce)

---

### 3. SLA (Response Time) Alerts

**SLA Thresholds** (configurable in Settings):
- 🟢 **0-15 min**: Normal (agent has time)
- 🟡 **15-30 min**: Caution (notify agent)
- 🔴 **30-60 min**: Urgent (notify manager)
- 🚨 **60+ min**: Critical (notify Super Admin, tag "URGENT")

**Alert Display**:
```
Chat List:
┌─────────────────────────────────────────────────┐
│ Jane Smith                    🔴 45 min no reply│
│ "สนใจสินค้า A ไหม"             ⬆️ escalated     │
│ Assigned to: Agent A (offline)                 │
│ [👤 Takeover] [Message Manager]                │
└─────────────────────────────────────────────────┘

Notifications:
  15 min: 🟡 "Jane's chat waiting 15 min" (to Agent A)
  30 min: 🔴 "Jane's chat 30 min overdue" (to Manager)
  60 min: 🚨 "URGENT: Jane waiting 60 min" (to Super Admin + Tag urgent)
```

**Rules**:
- ✅ SLA timer starts when message arrives
- ✅ SLA timer stops when agent replies
- ✅ If AI responds → SLA continues (human response still needed)
- ✅ Manager can manually "Take over" chat to reset SLA
- ✅ Super Admin can adjust SLA thresholds in Settings
- ✅ **[LOCKED — GAP 6]** Escalation notifications go to the immediate next level only, not to all levels simultaneously. 15-min alert goes only to the assigned agent. 30-min alert goes only to that agent's direct manager. 60-min alert goes only to Super Admin. No mass broadcasting up the chain.

---

### 4. AI Handoff

**Chat Collision Prevention — [LOCKED — GAP 3]**:
```
When AI is actively responding:
  → Agent input box is DISABLED (grayed out, not just hidden)
  → Banner shown: "🤖 AI is responding — Click [Take Control] to type"
  → Chat has internal field: controlled_by (null = AI, agent_id = agent)

When agent clicks [Take Control]:
  → controlled_by set to agent_id immediately
  → AI stops sending any further messages to this chat
  → Input box becomes active for agent
  → Chat label changes from "🤖 AI responding" to "👤 [Agent Name]"

This prevents message overlap where both AI and agent send simultaneous replies to customer.
```

**When AI Engages**:
```
Message arrives:
  → AI reads: "Confidence in answering?"

  IF confidence > 70%:
    ✅ AI responds automatically
    Chat label: "🤖 AI responding"
    Agent sees it in "AI handling" filter

  IF confidence < 70%:
    ⏳ Mark "Needs human"
    Assign to Agent immediately
    Show Agent: "⚠️ AI not confident - check this one"
```

**Manual Handoff (Agent to AI or AI to Agent)**:
```
Agent sees:
  🤖 "Let AI take over?" [✅] [❌]
  → Click ✅ → AI takes over this chat
  → Chat moves to "AI handling" list
  → Agent can still monitor

AI sees escalation trigger:
  "Customer asked: Can we do custom order?"
  → AI confidence: 40% (too low)
  → Hands off to Agent
  → Agent sees: "🤖 AI handed off - customer asking special request"
```

**Admin Take Control** (Priority):
```
Manager/Super Admin can take over ANY chat at any time:
  Chat options: [👤 Take Control] [Pin] [Archive]
  → Click [👤 Take Control]
  → Chat reassigned to admin immediately
  → Previous agent notified: "Manager took over Jane's chat"
  → Admin now handles chat directly
  → Can reassign back to original agent anytime
```

**Rules**:
- ✅ AI never forces takeover (agent can reject)
- ✅ Agent can return chat to AI anytime
- ✅ If customer says "talk to human" → AI stops immediately
- ✅ Handoff history shown in chat (transparent)
- ✅ Agent's last message reviewed by human before AI continues
- ✅ **[LOCKED — GAP 3]** Agent input is disabled while AI has control. Agent must click [Take Control] before typing. This is enforced at the UI layer (input disabled) and backend layer (controlled_by check before message write).
- ✅ **[LOCKED — GAP 3]** Only one party controls a chat at a time. If AI has control, no agent can type until they explicitly take control.

---

### 5. Pinned Chats

**Why Pin**: Mark important customers (VIP, At-risk, Order waiting) for quick access

**How to Pin**:
```
Chat options: [⭐ Star] [Pin] [Archive]
  → Click [Pin]
  → Chat moves to top of Inbox (stays there)
  → Shows 📌 icon
  → Pinned chats appear before regular chats

Unpin:
  → Click [Pin] again
  → Moves back to normal list
```

**Rules**:
- ✅ Pin is PER-ADMIN (Agent A's pinned list ≠ Agent B's)
- ✅ Manager/Super Admin see their own pins only
- ✅ Maximum 10 pinned chats per admin
- ✅ If try to pin 11th → "Remove one first" message
- ✅ Pins persist until manually unpinned (not time-based)
- ✅ Pinned order: by most recent activity (newest first)

---

### 6. Rapid-fire Message Debounce

**Problem**: Customer sends 5 messages in 3 seconds
**Solution**: AI waits 3 seconds, then responds once

```
Customer:
  T=0: "สนใจสินค้า A"
  T=1: "หรือสินค้า B"
  T=2: "ราคาเท่าไหร่"
  T=3: "ยังมีสต็อกไหม"

AI:
  T=3: Sees 4 messages arrive
  T=3-6: Waits (debounce 3 seconds)
  T=6: Responds ONCE with answer to all 4 messages

Result: Customer sees 1 response, not 4 separate replies ✅
```

**Rules**:
- ✅ Debounce window: 3 seconds (configurable in Settings)
- ✅ Max wait: 30 seconds (if customer keeps typing, respond after 30s)
- ✅ Agent responses not debounced (respond immediately)
- ✅ Only applies to AI, not human agents

---

### 7. Canned Responses

**Personal Canned Responses** (Agent-only):
```
Agent A saves:
  "สินค้า A: [ราคา/สต็อก/ลิงก์]"
  "ขอบคุณค่ะ! 🙏"
  "ส่งให้ศรีษฐ์ 2-3 วัน ค่ะ"

Agent A can use anytime in their chats
Other agents don't see Agent A's responses
```

**Team Canned Responses** (Shared by all):
```
Manager saves:
  "นโยบายคืนเงิน: ..."
  "เวลาทำการ: 09:00-21:00"
  "ติดต่อฝ่ายขาย: ..."

All agents see and can use
Only Manager/Super Admin can create/edit team responses
```

**How to Use**:
```
In chat, type "/" to see suggestions:
  /สินค้า A → Auto-fills: "สินค้า A: ราคา/สต็อก..."
  /ขอบคุณ → "ขอบคุณค่ะ! 🙏"
```

**Rules**:
- ✅ Personal responses: Only creator can edit/delete
- ✅ Team responses: Only Manager+ can edit
- ✅ Responses searchable by keyword
- ✅ Agent can edit on-the-fly before sending (template, not lock)

---

### 8. Chat Threading & Context

**Thread Structure**:
```
Jane Smith (Contact)
├─ Thread 1: Jan 5 - Jan 8 (ended, order completed)
└─ Thread 2: Jan 15 - Present (active)
    Jan 15, 14:30: Jane "สินค้า A มีไหม"
    Jan 15, 14:35: Agent "มีค่ะ ฿199"
    Jan 15, 15:00: Jane "ขอ 2 ชิ้น"
    Jan 15, 15:02: Agent "ดีค่ะ! [Payment Link]"
    Jan 15, 15:30: Jane "ชำระแล้วค่ะ"
    Jan 15, 15:31: AI "ขอบคุณค่ะ! 🎉 ส่ง 2-3 วัน"

    Reply: [________] [Send] [Emoji] [+]
```

**Internal Notes — [LOCKED — GAP 1]**:
```
Agents and managers can leave internal notes inside a chat thread:
  → Note marked as "Internal only"
  → Displayed inline in thread with distinct style (e.g., yellow background, lock icon 🔒)
  → Visible only to: Agent, Manager, Super Admin (role-based filter)
  → Customer CANNOT see internal notes — ever

Use cases:
  → "Customer is a repeat complainer — be careful with refund"
  → "Manager: closing this chat, agent to follow up in 24h"
  → Handoff context between agents
```

**Rules**:
- ✅ Each new incoming conversation = new Thread
- ✅ Same customer, 1 week gap = new Thread
- ✅ Threads show chronologically (oldest first)
- ✅ Agent can see all past threads with customer
- ✅ Search within threads: "สินค้า A" finds all mentions
- ✅ **[LOCKED — GAP 1]** Internal notes are visible to admins/managers only. Notes table has `is_internal` flag. UI renders them only when role is Agent, Manager, or Super Admin. Customer-facing view never exposes internal notes.
- ✅ **[LOCKED — GAP 5]** When a chat is reassigned, the original agent retains read access to the full thread (for context). The reassigned agent is also able to respond. Both agents can see thread history; only the currently assigned agent shows as "active handler" in the header.

---

### 9. Contact → Customer Transition in Chat

**[LOCKED — GAP 4]** A person chatting with the shop starts as a "Contact" (unverified buyer). They become a "Customer" when their order reaches "Pending Payment" status.

**What changes in Inbox when transition occurs**:
```
Before transition (Contact):
  Chat thread header: "Jane Smith (Contact)"
  No order history panel
  AI treats as prospective buyer

After transition (Customer):
  Chat thread header: "Jane Smith (Customer)" [badge updated]
  Order history panel appears in right sidebar
  AI has access to order context for this chat
  Full CRM profile unlocked
```

**Rules**:
- ✅ **[LOCKED — GAP 4]** Transition trigger: order status changes to "Pending Payment"
- ✅ Contact record moves to customers table; full message and thread history is preserved
- ✅ No chat interruption during transition — active conversation continues unbroken
- ✅ Agent sees the label change in real-time (no page refresh needed)
- ✅ AI state is preserved through transition (AI does not restart or re-greet)

---

## Acceptance Criteria

### Multi-channel Routing
- [ ] Messages from LINE, Facebook, Instagram, WhatsApp all appear in Inbox
- [ ] Channel icon shown (LINE icon / FB icon / etc.)
- [ ] Messages arrive within 2 seconds
- [ ] Duplicate check: same customer on 2 channels = 2 separate threads
- [ ] If system offline → messages queue, no data loss
- [ ] Channel Account linked to only 1 Workspace (enforced)
- [ ] **[GAP 2]** Channel limit reached → return `CHANNEL_LIMIT_EXCEEDED` error, block new channel integration
- [ ] **[GAP 2]** UI shows clear error message when channel limit is hit (not a silent failure)

### Message Assignment
- [ ] New message auto-assigned round-robin to next available agent
- [ ] If agent offline → skip to next, queue if all offline
- [ ] Manager can reassign chat manually
- [ ] Agent cannot reassign
- [ ] Reassignment logged in audit
- [ ] Assigned agent gets notification immediately

### SLA & Alerts
- [ ] SLA timer starts on message arrival
- [ ] Alert at 15 min (agent notified)
- [ ] Alert at 30 min (manager notified)
- [ ] Alert at 60 min (super admin notified + tag URGENT)
- [ ] Timer resets when agent replies
- [ ] Manager can adjust thresholds in Settings
- [ ] AI response doesn't stop SLA (still needs human reply)
- [ ] **[GAP 6]** 15-min alert sent only to assigned agent — not to manager or super admin
- [ ] **[GAP 6]** 30-min alert sent only to direct manager of assigned agent — not to super admin
- [ ] **[GAP 6]** 60-min alert sent only to Super Admin — not re-sent to lower levels

### AI Handoff
- [ ] AI confidence < 70% → assign to agent instead
- [ ] AI confidence > 70% → respond automatically
- [ ] Agent can force AI to takeover
- [ ] AI can hand back to agent if confused
- [ ] Handoff reason shown (transparent)
- [ ] Chat shows who's currently handling (🤖 AI or 👤 Agent)
- [ ] **[GAP 3]** Agent input box is disabled when AI has `controlled_by = null` (AI in control)
- [ ] **[GAP 3]** [Take Control] button visible and clickable when AI is in control
- [ ] **[GAP 3]** Clicking [Take Control] sets `controlled_by = agent_id` and enables input immediately
- [ ] **[GAP 3]** AI sends no new messages after agent takes control
- [ ] **[GAP 3]** Both UI (input disabled) and backend (write check) enforce single-controller rule

### Pinned Chats
- [ ] User can pin/unpin chats
- [ ] Pinned appear at top of list
- [ ] Max 10 pins per admin
- [ ] If trying to pin 11th → error message
- [ ] Pins are per-admin (not shared)
- [ ] Unpinned goes back to normal list

### Rapid-fire Debounce
- [ ] AI waits 3 seconds after last message before responding
- [ ] If customer sends 5 messages in 3 seconds → AI responds once to all
- [ ] If no new messages for 3 seconds → AI responds
- [ ] Max wait 30 seconds (don't delay forever)
- [ ] Agent responses NOT debounced (instant)

### Canned Responses
- [ ] Agent can create personal canned response
- [ ] Manager can create team canned response
- [ ] Type "/" in chat to search/use responses
- [ ] Can edit on-the-fly before sending
- [ ] Personal responses: only creator can edit
- [ ] Team responses: only Manager+ can edit
- [ ] Search by keyword works

### Chat Context & Internal Notes
- [ ] Show all past messages with customer
- [ ] Show all threads with customer (separate list)
- [ ] Messages labeled with sender (Agent name / AI / Customer)
- [ ] Timestamps on each message
- [ ] Search within chat history
- [ ] Show who handled message (for audit)
- [ ] **[GAP 1]** Internal notes visible only to Agent, Manager, Super Admin (role-filtered)
- [ ] **[GAP 1]** Internal notes have distinct visual style (e.g., yellow/amber background, lock icon)
- [ ] **[GAP 1]** Customer-facing chat view never renders internal notes
- [ ] **[GAP 1]** Internal notes stored with `is_internal = true` flag in notes table
- [ ] **[GAP 5]** Previous agent retains read access to thread after reassignment
- [ ] **[GAP 5]** Chat header shows currently assigned agent as active handler
- [ ] **[GAP 5]** Reassigned agent can respond; original agent can view but is no longer primary handler

### Contact → Customer Transition
- [ ] **[GAP 4]** Contact label in chat header updates to "Customer" when order reaches "Pending Payment"
- [ ] **[GAP 4]** No conversation interruption during label transition
- [ ] **[GAP 4]** Order history panel appears in chat sidebar after transition
- [ ] **[GAP 4]** Full thread and message history preserved after transition
- [ ] **[GAP 4]** AI state (controlled_by, debounce, context) preserved through transition

### Mobile UX
- [ ] All screens readable without zoom
- [ ] Buttons minimum 44×44px
- [ ] Chat input doesn't hide behind keyboard
- [ ] Pinning, assignment, canned responses accessible via long-press
- [ ] Notifications work on iOS and Android

### Error Handling
- [ ] Network error → "Connection lost, retrying..."
- [ ] Message send failure → "Couldn't send, tap to retry"
- [ ] Assignment failure → "Couldn't assign, try again"
- [ ] No data loss on refresh
- [ ] Offline messages sync when reconnected

---

## Key User Flows

### Happy Path: Agent Receives Chat
```
1. Jane sends message: "สนใจสินค้า A"
2. System receives webhook
3. Finds Customer: Jane Smith
4. Assigns round-robin → Agent A
5. Agent A gets notification: 📬 "Jane Smith: สนใจสินค้า A"
6. Agent opens Inbox
7. Sees: [Jane Smith] with message
8. Types reply: "มีค่ะ ฿199"
9. Message sent to Jane (through original channel - LINE/FB/IG)
10. Jane sees reply
```

### AI Takes Over (High Confidence)
```
1. Jane: "ขอสินค้า A 2 ชิ้น"
2. System assigns to Agent B
3. AI evaluates confidence: 95% (clear order request)
4. AI responds: "ได้ค่ะ! 2 ชิ้น [Link]"
5. Chat labeled: 🤖 "AI responding"
6. Agent B can see it in "AI handling" filter
7. If Jane says "talk to human" → Agent B takes over
```

### Escalation (SLA Timeout)
```
1. John: "ยังไม่ได้รับสินค้า" (complaint)
2. Assigned to Agent A (offline)
3. 15 min: 🟡 Alert to Agent A (when online)
4. 30 min: 🔴 Alert to Manager
5. Manager sees: "John waiting 30 min"
6. Manager clicks: [👤 Takeover]
7. Manager replies personally
8. SLA resets
```

### Pinning VIP Customer
```
1. Jane is VIP (LTV ฿50k)
2. Manager pinning: [📌 Pin]
3. Jane's chat moves to top
4. Manager sees Jane first in Inbox
5. Quick access for priority response
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|---|
| **Customer blocks app** | Messages stop arriving, status shown to agent |
| **Channel disconnects** | Notification to Super Admin, stop receiving messages from that channel |
| **Agent goes offline mid-chat** | Chat reassigned if SLA timer hits 15 min |
| **Message sent but no response** | Shows as "pending" until agent replies |
| **AI misunderstands intent** | Agent can edit AI's message before sending or takeover |
| **Chat assigned to offline agent** | Waits in queue, first online agent gets it |
| **Customer unblocks after blocking** | Resumes normal flow when message received |
| **Double message (platform delay)** | Deduplicate by message ID + timestamp |
| **Chat reassigned while agent is typing** | [GAP 5] Original agent input is blocked; new assignee takes over as active handler. Original agent retains read access. |
| **Agent and AI both try to respond at same time** | [GAP 3] Only the controller (agent_id or null=AI) can write. Backend rejects write from non-controller. |
| **Channel limit reached during new channel setup** | [GAP 2] Hard reject at DB level. UI shows `CHANNEL_LIMIT_EXCEEDED` error. No partial integration stored. |
| **Contact becomes Customer mid-conversation** | [GAP 4] Thread continues unbroken. Header updates in real-time. AI state preserved. |
| **Agent reads internal note by mistake as customer message** | [GAP 1] Internal notes have distinct visual treatment (locked icon + amber background) to prevent confusion. |
| **60-min SLA fires — should manager also be notified again?** | [GAP 6] No. Only Super Admin is notified at 60 min. Manager was already notified at 30 min. No re-notify. |

---

## Success Metrics

| Metric | Target | Check Period |
|--------|--------|---|
| **Avg response time** | < 5 min | Daily |
| **SLA compliance (15 min)** | > 85% | Daily |
| **Message arrival latency** | < 2 sec | Hourly |
| **Chat assignment fairness** | ±10% deviation | Weekly |
| **AI handoff accuracy** | > 80% (no wrong transfers) | Weekly |
| **Canned response adoption** | > 60% of staff using | Monthly |
| **Pinned chat usage** | > 30% of agents pinning | Monthly |

---

## Questions for Review

Before Feature #3, please confirm:

1. ✅ **SLA thresholds reasonable?** (15/30/60 min)
2. ✅ **AI confidence threshold ok?** (70%)
3. ✅ **Debounce timing right?** (3 seconds + 30 sec max)
4. ✅ **Should chat assignment show to customer?** (or hidden backend-only)
5. ✅ **Pin limit ok?** (max 10 per admin)
6. ✅ **Canned responses format?** (template with editable placeholders?)

**Ready for Feature #3: CRM (Customer Management)?** 👇

---

## Locked Decisions

All decisions below are final. Do not reopen without a documented rationale and sign-off from the product owner.
**Source**: MASTER_PROTOTYPE_SPECIFICATION.md — Locked April 8, 2026

---

### GAP 1: Internal Notes Visibility

**Decision**: Internal notes are visible to Agents, Managers, and Super Admins only. Customers cannot see internal notes under any circumstances.

**Scope**: All chat threads across all channels.

**Implementation details**:
- Notes table has `is_internal` boolean flag
- UI filters notes by role + `is_internal` flag before rendering
- Customer-facing chat view has zero access to `is_internal = true` records
- Internal notes display with distinct visual treatment: amber/yellow background, lock icon indicator

**Impacts**:
- Chat Threading section: internal note style defined above
- Acceptance Criteria: role-gated visibility tested before shipping
- Audit trail: internal notes appear in admin audit log but never in customer export

---

### GAP 2: Channel Integration Limits

**Decision**: Channel limits are a hard cap. When a workspace reaches its channel integration limit, no additional channels can be connected. The system rejects the attempt at the database level.

**Scope**: All channel types (LINE, Facebook, Instagram, WhatsApp, Lazada, TikTok).

**Implementation details**:
- Hard limit enforced at DB level (count check before insert)
- Error code returned: `CHANNEL_LIMIT_EXCEEDED`
- UI must surface this error with a clear message — no silent failure
- Limit value is configurable per workspace plan (set in workspace settings)

**Impacts**:
- Multi-channel Routing section updated with this rule
- Settings page must display current channel count vs. limit
- Onboarding flow must check limit before allowing channel connection step

---

### GAP 3: Chat Collision — Simultaneous AI and Agent Responses

**Decision**: Only one party can control a chat at any time. When AI is responding, the agent's input box is disabled. The agent must click [Take Control] to type. This prevents overlapping messages reaching the customer.

**Scope**: All AI-handled chats.

**Implementation details**:
- Chat record has `controlled_by` field: `null` = AI in control, `agent_id` = specific agent in control
- UI disables message input when `controlled_by` does not match the current agent's ID
- Backend rejects message write attempts from non-controllers (double enforcement)
- [Take Control] button is always visible when AI has control; clicking it sets `controlled_by = agent_id` atomically
- AI stops sending new messages immediately upon `controlled_by` being set to an agent
- Chat label updates in real-time: "🤖 AI responding" changes to "👤 [Agent Name]"

**Impacts**:
- AI Handoff section: [Take Control] button behavior redefined
- "Return to AI" button: clears `controlled_by` back to `null`; AI resumes from where it left off
- Multi-agent conflict: if two agents click [Take Control] simultaneously, first write wins (last-write protection at DB transaction level)

---

### GAP 4: Contact to Customer Transition in Chat

**Decision**: A Contact becomes a Customer when their associated order reaches "Pending Payment" status. This transition is triggered automatically by an order status change event.

**Scope**: All contacts who initiate an order within a chat conversation.

**Implementation details**:
- Trigger fires on `order.status` changing to `pending_payment`
- Contact record migrated to customers table; all message history, thread history, and metadata preserved
- Chat thread header updates in real-time to show "Customer" badge (no page reload required)
- AI state (`controlled_by`, debounce window, conversation context) is fully preserved through the transition
- Order history panel appears in the chat right sidebar after transition

**Impacts**:
- Chat Threading section: Contact → Customer label change happens mid-conversation
- AI Handoff section: AI must not reset or re-greet after transition
- CRM feature: Customer record created from Contact data at this moment (see CRM user story GAP 4 cross-reference)

---

### GAP 5: Agent Visibility After Chat Reassignment

**Decision**: When a chat is reassigned from Agent A to Agent B, Agent A retains read-only access to the full conversation thread. Agent B becomes the active handler. Both can view thread history; only Agent B can send new messages as the assigned agent.

**Scope**: All manual and automatic reassignments.

**Implementation details**:
- Chat visibility query: `assigned_to` (current agent, full access) + `historical_assignments` (past agents, read-only access)
- Chat header always shows the currently assigned agent as the active handler
- Agent A's view: chat appears in a "Previously handled" or filtered view (not in primary "Assigned to me" inbox)
- Agent B's view: chat appears normally in "Assigned to me" with full response capability
- Audit log captures every reassignment: who reassigned, from whom, to whom, at what time

**Impacts**:
- Message Assignment section: original agent retains context access
- Edge Cases table updated with reassignment-while-typing scenario
- Manager reassignment flow: original agent notified of reassignment via in-app notification

---

### GAP 6: Multi-Agent Escalation Notification Scope

**Decision**: SLA escalation notifications go to the immediate next level only. Each threshold notifies exactly one level in the chain. No cascading or broadcasting to all levels simultaneously.

**Scope**: All SLA escalation events.

**Escalation chain**:
- 15 minutes: Notify assigned Agent only
- 30 minutes: Notify direct Manager of the assigned agent only (not Super Admin)
- 60 minutes: Notify Super Admin only (not re-notify Manager or Agent)

**Implementation details**:
- Escalation routing table defines `next_level_id` for each role
- Notification job reads `next_level_id` at each threshold; sends to that role only
- No "CC all levels" behavior — each escalation is a single targeted notification
- If assigned agent has no direct manager configured, 30-min notification escalates to Super Admin as fallback

**Impacts**:
- SLA & Alerts section: notification rules updated to reflect single-level targeting
- Edge Cases table: 60-min scenario clarified — manager not re-notified
- Notification delivery system: must support targeted delivery by role + chat assignment chain
