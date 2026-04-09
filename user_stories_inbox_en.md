# User Story — Inbox & Chat Management
## Onebear Phase 1

---

# 🟥 Pain

Admins handling customer conversations across multiple social channels have no visibility into how long it takes them to respond. Many businesses use **response time as a KPI** — for example, an internal benchmark of "reply within 4 minutes." Without a live timer, admins only discover they have breached their SLA after the fact, which hurts customer satisfaction and team accountability.

Additionally, the current chat list card layout surfaces low-value information (owner name) and has incorrect behavior (badge disappearing on open without a reply). There is also no real-time awareness of which colleagues are currently viewing the same conversation, nor any structured way to identify chats that have been handed off and are waiting for action.

---

# 🟩 Business

## 1. Feature: Inbox Layout

### 1.1 Thread Sort Order — Applies to Both Desktop and Mobile

The chat list uses the **same sort logic** across all platforms:

1. **Pinned chats** — always at the top, ordered by most recently pinned first
2. **Non-pinned chats** — ordered by most recent incoming message; new messages push the thread to the top instantly

### 1.2 Desktop — 3-Panel Layout

- **Left panel**: Chat list — search, filters, sort, thread cards
- **Center panel**: Message area — the active conversation
- **Right panel**: Customer info — profile, order history, activity log
- All three panels are visible simultaneously; no page navigation required
- The left panel thread list uses the same sort order as mobile

### 1.3 Mobile — Full-screen Navigation

- Default screen = **Inbox list** showing all threads, using the same sort order as desktop
- Tapping a thread → opens full-screen Message Area
- **Swipe left** from Message Area → returns to Inbox list
- **Swipe right** from Message Area → opens Customer Info panel (slides in from right)
- Swipe back from Customer Info → returns to Message Area

---

## 2. Feature: Thread Card & Chat List Grouping

### 2.1 Three-Section Layout

The chat list is divided into **3 sections** in priority order:

```
┌──────────────────────────────┐
│  📌 Pinned                   │  ← sorted by most recently pinned first
├──────────────────────────────┤
│  🔀 Assigned to Me           │  ← chats handed off by AI or another admin
│                              │     sorted by most recently assigned first
├──────────────────────────────┤
│  💬 All Chats                │  ← all other chats, sorted by latest message
└──────────────────────────────┘
```

**Section rules:**
- A section with no chats → its header is hidden entirely; no empty headings shown
- A chat that is both pinned and assigned to the current admin → appears in **Pinned** only
- Once an admin replies to a chat in "Assigned to Me" → it moves to "All Chats" automatically
- The "Assigned to Me" section is **per-user** — only the admin who was assigned sees it; other admins do not

**Cards in "Assigned to Me" section:**
- Display a badge showing the source: **"Handed off from AI"** or **"Handed off from [admin name]"**
- Show the time the handoff occurred
- Admin Session FRT timer starts immediately on handoff — the admin sees the live timer on the card

### 2.2 Unread Badge Behavior

The badge on each card shows the number of **unanswered messages** from the customer:

| Unanswered count | Display |
|---|---|
| 0 messages | No badge — thread name normal weight, preview in muted color |
| 1 message | No badge — message preview shown in **bold** |
| 2 or more messages | Badge showing count e.g. **"2 new messages"**, **"5 new messages"** + thread name **bold** |

- Badge does **not** clear when an admin opens the thread — it clears only when a reply is sent
- AI replies do not clear the badge — only a human admin reply does
- Example: customer sends 3 messages, admin opens the thread but does not reply → badge still shows "3 new messages"

### 2.3 Card Visual Design

- Badge count, Follow-up / Noted / Reply / Done icons: reduced to **16px**
- **Owner field removed** from the card
  - Card with an assigned owner → **white background**
  - Card with no assigned owner → **gray background**

### 2.4 Admin Presence Indicator (Real-time)

Shows which admins are currently viewing that conversation — similar to Figma's "who's in the file" indicator.

- Displays avatar stack of admins currently viewing the thread
- Maximum **3 avatars** shown, stacked and overlapping
- If more than 3 admins → show first 3 avatars + **"+N"** e.g. `+2`
- **Hovering the avatar stack** → tooltip lists all admins currently in the thread, each with their profile photo and name
- If no one else is viewing → avatar stack is not shown at all
- Updates in real-time via WebSocket

### 2.5 Typing Indicator on Card (Internal Team Awareness)

- If another admin is composing a reply in that thread → a typing indicator appears on the card
- The content being typed is **not visible** — only the fact that someone is typing (similar to Microsoft Teams)
- Typing Indicator is **admin-side only** — customers do not see it
- Transmitted via WebSocket; expires after 5 seconds of no input

---

## 3. Feature: First Response Time (FRT)

**Definition**: The elapsed time between the moment the customer sends their **first message** in a session and the moment the **first reply** (by AI or admin) is sent.

> FRT measures **customer experience** — how long the customer waited for any response.
> For team performance measurement, see Admin Session FRT in the Dashboard Note below.

### 3.1 Timer Start Conditions

- Timer starts immediately when a **customer message arrives**
- If the admin initiates the conversation first (outbound), the timer does **not** start until the customer replies
- If the customer sends multiple messages before any reply → timer is calculated from the **first message only**, not the most recent
- Timer is displayed live (counting up) in two locations:
  - Left panel — next to the thread in the chat list
  - Next to the **"Done" button** inside the Message Area

### 3.2 Timer Stop Conditions

- Timer stops immediately when:
  - **AI sends the first reply** ✅
  - **Admin sends the first reply** (including replies sent via Facebook or Instagram integrations) ✅
  - Admin presses the **"Done" button** ✅
- **Auto Reply does NOT stop FRT** — automated rule-based responses are not counted as a real reply
- Once stopped, the label transitions from **First Response Time → Resolved Time**

### 3.3 Transition: FRT → Resolved Time

- After the first reply (AI or admin), the timer label changes from **First Response Time → Resolved Time**
- The counter **continues from where FRT stopped** — it does not reset to zero
- FRT display is replaced by Resolved Time in both locations

---

## 4. Feature: Resolved Time (RT)

**Definition**: The elapsed time between the customer's first message in a session and the moment the **"Done" button** is pressed.

### 4.1 Timer Behavior

- Resolved Time continues counting from where FRT ended
- Displayed in the same two locations: left panel and next to the Done button
- Stops immediately when the admin presses **"Done"**
- After Done is pressed:
  - Timer is removed from the left panel
  - Timer is removed from next to the Done button
  - A **summary is shown in the right panel** (Customer Info)

### 4.2 Summary Display (Right Panel — after Done)

- Shows the **most recent** FRT and RT for this session
- If the conversation has been opened and closed **multiple times**, the summary also shows:
  - **Average FRT** = sum of all FRT values ÷ number of sessions
  - **Average RT** = sum of all RT values ÷ number of sessions
- Both the latest values and averages are shown together

### 4.3 Time Display Format

| Duration | Format | Example |
|---|---|---|
| < 60 seconds | `Xs` | `42s` |
| < 60 minutes | `Xm Ys` | `4m 12s` |
| ≥ 60 minutes | `Xh Ym` | `1h 23m` |

---

## 5. Feature: Smart Timestamp on Messages

Timestamp shown on each message bubble, formatted based on how long ago it was sent. All timestamps use the Workspace timezone.

| Condition | Format | Example |
|---|---|---|
| Sent today | `HH:mm` | `14:32` |
| Sent this week (not today) | Thai day name | `จันทร์` |
| Sent this year (> 7 days ago) | Day + Thai month | `12 ม.ค.` |
| Sent last year or earlier | Day + month + 2-digit year | `12 ม.ค. 67` |

- Hovering a timestamp (desktop) → tooltip shows full datetime
- Format: `Monday 6 Jan 2568 at 14:32`

---

## 6. Feature: Pinned Chats

- Admins can pin any thread to keep it at the top of the chat list
- Pinned chats and sort order logic is **identical on both desktop and mobile**
- Pin is **per-user** — does not affect other admins' views
- Maximum **10 pinned threads** per user
- Pinned order = most recently pinned first
- Unpinning moves the thread back to its natural sort position in "All Chats"

---

## 7. Feature: Pinned Messages (within a thread)

- Admins can pin specific messages inside a conversation
- Pin Bar appears above the Message Area showing the most recently pinned message preview
- Multiple pins → Pin Bar shows `"📌 N pinned messages"` — tap to view all
- Tapping Pin Bar → scrolls to that message in the thread
- Pins are **per-user** — maximum 20 pins per thread
- Pinned message survives edits; removed only if the message is deleted
- Uses Optimistic UI — rolls back on API failure

---

## 8. Feature: SLA & Escalation

SLA clock runs only on chats held by a human admin — AI-handled chats are excluded.

| Level | Default Threshold | Notifies |
|---|---|---|
| Level 1 | 15 minutes | Assigned agent |
| Level 2 | 30 minutes | Manager |
| Level 3 | 60 minutes | Super Admin + tags thread "Urgent" |

- All thresholds configurable by Super Admin in Settings
- Notifications delivered via In-app Notification and Push Notification

---

## 9. Feature: AI Handoff

- If AI confidence drops below threshold (default 70%) → AI hands off to admin automatically
- AI stops replying to that thread immediately
- Admin receives notification with full conversation context
- Handed-off thread appears in the admin's **"Assigned to Me"** section
- Admin can return the thread to AI by pressing **"Return to AI"**

---

## 10. Feature: Spam Detection

- All incoming messages are scanned before entering the Inbox
- High confidence spam → moved to Spam Folder automatically; team is not notified
- Suspected spam → tagged "may be spam" in Inbox; waits for admin review
- Admin marks "Not Spam" → moves back to Inbox; AI learns from this action
- Silent Block: blocked senders are unaware they are blocked
- Spam Folder auto-deletes after 30 days (configurable in Settings)

---

## 11. Feature: Loading & Performance

| Action | Target (p95) |
|---|---|
| Chat list first load | < 1.5s |
| Open thread (Message Area) | < 800ms |
| Send message (optimistic bubble) | < 100ms |
| Infinite scroll load | < 500ms |
| Search results | < 1s |

- All loading states use **Skeleton Cards** — no center-screen spinners
- `sendMessage` uses Optimistic UI — bubble appears immediately before API responds
- API failure on send → roll back bubble + show error state with Retry option

---

# 🟧 Discussion

| # | Topic | Status | Decision |
|---|---|---|---|
| 1 | **AI Reply & FRT** — Does an AI reply stop FRT? | ✅ Resolved | **Yes — AI replies stop FRT.** FRT measures customer experience (how long they waited), not team performance. See Dashboard Note below for team metrics. |
| 2 | **Auto Reply & FRT** — Does an Auto Reply stop FRT? | ✅ Resolved | No — rule-based automated responses are not counted as a real reply by AI or human. |
| 3 | **Outbound FRT** — If admin messages first, when does FRT start? | ✅ Resolved | FRT starts when the customer replies back, not when the admin initiates. |
| 4 | **Multiple messages before reply** — Which message starts the FRT clock? | ✅ Resolved | Always the first message from the customer in that session. |
| 5 | **Session-based Timing Logic** | ✅ Resolved | Separate AI Session and Admin Session timers. See 📌 Dashboard Note below. |
| 6 | **Typing Indicator — customer side** | ✅ Resolved | Customers do not see the typing indicator — admin-side only. |
| 7 | **Pinned Messages** — Per-user or shared? | ✅ Resolved | Per-user. |
| 8 | **Message Reactions** (👍 ❤️) | ✅ Resolved | Not in Phase 1 — each platform has a different Reaction API; high risk of inconsistency across channels. Deferred to Phase 2 pending channel API research. |

---

> ### 📌 Note for Chat Dashboard User Story
>
> **Session-based Timing Logic — must be included in Chat Dashboard**
>
> Each conversation is composed of sequential sessions, each with its own set of timers, separated by who is responsible.
>
> ```
> Customer sends message
>     → [AI Session starts]
>         AI FRT    = time from first customer message → AI's first reply
>         AI RT     = time AI managed the chat until handoff
>     → Chat handed off to admin
>         → [Admin Session starts] (resets to zero)
>             Admin FRT = time from handoff → admin's first reply
>             Admin RT  = time from handoff → admin presses Done
> ```
>
> **3 scenarios to support:**
>
> | Scenario | AI Session | Admin Session | Dashboard Label |
> |---|---|---|---|
> | AI handles entirely — no handoff | FRT + RT ✅ | None (N/A) | "AI — fully handled" |
> | AI handles then hands off to admin | FRT + RT (until handoff) ✅ | FRT + RT (from handoff) ✅ | "AI + Handoff → Admin" |
> | Admin handles entirely from start | None (N/A) | FRT + RT ✅ | "Admin — fully handled" |
>
> **Metrics to display in Chat Dashboard:**
>
> | Metric | Description |
> |---|---|
> | AI Handle Rate | % of chats fully handled by AI with no handoff |
> | AI + Handoff Rate | % of chats where AI handled then handed off to admin |
> | Admin Only Rate | % of chats handled by admin from the start |
> | Average AI FRT | Average time for AI to send first reply |
> | Average Admin FRT | Average time for admin to reply after receiving handoff |
> | Average AI RT | Average time AI spent per session |
> | Average Admin RT | Average time admin spent per session |

---

# 🟦 Acceptance Criteria

## Feature 1: Inbox Layout

- [ ] Desktop renders 3 panels simultaneously: Chat List, Message Area, Customer Info
- [ ] Left panel on desktop uses the same sort order as mobile
- [ ] Mobile shows Inbox list as the default screen
- [ ] **Both desktop and mobile**: pinned chats always appear above all other chats
- [ ] **Both desktop and mobile**: within pinned section, sorted by most recently pinned first
- [ ] **Both desktop and mobile**: new incoming message pushes thread to top of "All Chats" section
- [ ] Tapping a thread on mobile → full-screen Message Area
- [ ] Swipe left from Message Area → returns to Inbox list
- [ ] Swipe right from Message Area → opens Customer Info panel

## Feature 2: Thread Card & Chat List Grouping

- [ ] Chat list has 3 sections: Pinned → Assigned to Me → All Chats
- [ ] Section with no chats → section header is hidden
- [ ] "Assigned to Me" section is per-user — only visible to the admin who was assigned
- [ ] Chat that is both pinned and assigned → appears in Pinned section only
- [ ] Cards in "Assigned to Me" show badge: "Handed off from AI" or "Handed off from [name]"
- [ ] Cards in "Assigned to Me" show the time the handoff occurred
- [ ] Admin Session FRT timer starts immediately on handoff and is visible on the card
- [ ] Once admin replies to a handed-off chat → moves to "All Chats" automatically
- [ ] Badge does not clear when admin opens thread — clears only on reply
- [ ] `unreadCount = 0` → no badge, normal weight thread name, muted preview
- [ ] `unreadCount = 1` → no badge, bold message preview
- [ ] `unreadCount ≥ 2` → badge showing count e.g. "3 new messages", bold thread name
- [ ] AI reply alone does not clear the unread badge
- [ ] Badge and Follow-up / Noted / Reply / Done icons render at 16px
- [ ] Owner field is not shown on the card
- [ ] Card with assigned owner → white background
- [ ] Card with no owner → gray background
- [ ] Admin presence avatar stack shows profile photos of admins currently viewing the thread
- [ ] Maximum 3 avatars shown stacked
- [ ] More than 3 admins → show first 3 + "+N" e.g. `+2`
- [ ] Hovering avatar stack → tooltip lists all admins with profile photo and name
- [ ] No admins viewing → avatar stack not shown
- [ ] Avatar stack updates in real-time via WebSocket
- [ ] Typing indicator appears on card when another admin is composing a reply
- [ ] Typing content is not visible — indicator only
- [ ] Typing indicator is admin-side only — customers never see it

## Feature 3: First Response Time

- [ ] FRT timer starts immediately when a customer message arrives
- [ ] FRT is displayed in the left panel and next to the Done button
- [ ] Timer counts up live in real-time
- [ ] If admin messages first (outbound), FRT does not start until customer replies
- [ ] FRT is calculated from the first customer message in the session — not the most recent
- [ ] Auto Reply does NOT stop FRT
- [ ] AI reply stops FRT immediately ✅
- [ ] Admin reply (including via Facebook / Instagram) stops FRT immediately ✅
- [ ] Pressing Done stops FRT immediately
- [ ] After FRT stops, label changes to "Resolved Time"
- [ ] Timer counter continues from the same value — does not reset to zero

## Feature 4: Resolved Time

- [ ] Resolved Time continues counting from where FRT stopped
- [ ] Displayed in left panel and next to Done button
- [ ] Pressing Done stops Resolved Time immediately
- [ ] After Done: timer removed from left panel and Done button area
- [ ] After Done: summary shown in right panel with FRT and RT for this session
- [ ] Multiple sessions → average FRT and average RT also shown
- [ ] Average FRT = sum of all FRT values ÷ number of sessions
- [ ] Average RT = sum of all RT values ÷ number of sessions
- [ ] Time format: `Xs` for < 60s / `Xm Ys` for < 60m / `Xh Ym` for ≥ 60m

## Feature 5: Smart Timestamp

- [ ] Messages sent today show `HH:mm`
- [ ] Messages sent this week (not today) show Thai day name
- [ ] Messages sent this year (> 7 days ago) show day + Thai month abbreviation
- [ ] Messages sent last year or earlier show day + month + 2-digit year
- [ ] Hovering a timestamp (desktop) shows full datetime tooltip
- [ ] All timestamps calculated using Workspace timezone

## Feature 6: Pinned Chats

- [ ] Pinned chats appear at top of chat list on both desktop and mobile
- [ ] Pin logic and sort order identical on desktop and mobile
- [ ] Pin is per-user — does not affect other admins' views
- [ ] Maximum 10 pinned threads per user
- [ ] Within pinned: sorted by most recently pinned first
- [ ] Unpinning returns thread to natural sort order in "All Chats"

## Feature 7: SLA & Escalation

- [ ] SLA clock runs only on admin-held chats — AI-handled chats excluded
- [ ] 15 min: assigned agent notified via In-app + Push
- [ ] 30 min: Manager notified via In-app + Push
- [ ] 60 min: Super Admin notified + thread tagged "Urgent"
- [ ] All thresholds configurable by Super Admin in Settings

## Feature 8: AI Handoff

- [ ] AI hands off when confidence < 70%
- [ ] AI stops replying to that thread immediately on handoff
- [ ] Handed-off thread appears in receiving admin's "Assigned to Me" section
- [ ] Admin receives notification with full conversation context
- [ ] Admin can press "Return to AI" to hand back to AI

## Feature 9: Loading & Performance

- [ ] Chat list first load < 1.5s (p95)
- [ ] Opening a thread < 800ms (p95)
- [ ] Send message bubble appears < 100ms (Optimistic UI)
- [ ] Infinite scroll load < 500ms (p95)
- [ ] Skeleton Cards shown during all loading states — no center spinners
- [ ] Failed send → roll back bubble + Retry option shown

## Definition of Done

- [ ] Figma designs complete for all states: Default, Loading, Empty, Error, Mobile, Desktop
- [ ] Responsive at Mobile 375px and Desktop 1280px
- [ ] All interactive elements have ARIA labels
- [ ] WebSocket events for typing indicator, presence, and section updates tested under concurrent users
- [ ] FRT / RT timer logic unit-tested covering all edge cases (outbound, multi-message, AI reply, Auto Reply, Done button)
- [ ] Session-based timing logic (AI Session vs Admin Session) unit-tested for all 3 scenarios
- [ ] Tested with 3 real users before handoff to dev
