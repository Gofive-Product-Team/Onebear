# 12. Settings & Permissions — User Story

**Status**: Ready for feedback
**Priority**: 🔴 Critical (Security + compliance)
**Target Users**: Super Admin, Managers, Admins
**Primary Device**: Desktop
**Time Target**: Permission checks < 100ms, audit log query < 2 sec

---

## Feature Overview

The **Settings & Permissions** system enforces role-based access control (RBAC) across all Onebear features. It defines what each user can see, edit, and delete based on their role, ensures workspace data isolation, and logs all actions for compliance.

**Goal**: Every user sees only what they should → Data secure → Audit trail complete → Compliance met.

---

## User Personas & Goals

### Persona 1: Super Admin (Owner/Co-founder)
- Full control over everything
- Manages team members and roles
- Wants to monitor all business activity
- **Goal**: Unrestricted access, audit visibility, team governance

### Persona 2: Manager (Team Lead)
- Oversees agents/staff
- Sets policies, reviews performance
- Cannot change anyone's role or access billing
- **Goal**: Team management + strategic visibility (no super-admin features)

### Persona 3: Agent/Staff (Team Member)
- Uses chat, manages chats, creates orders
- Sees own performance, team metrics
- Cannot see salary/billing, cannot manage team
- **Goal**: Do their job (help customers, manage chats)

### Persona 4: Viewer (Read-only User)
- Accountant, partner, consultant
- Reads reports, analyzes data
- Cannot make any changes
- **Goal**: View dashboards, export reports, analyze trends

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **Security compliance** | 100% | All access logged, audit trail complete |
| **Permission enforcement** | 100% | No unauthorized access attempts succeed |
| **Audit log coverage** | 100% | Every action (create, edit, delete) logged |
| **Role assignment accuracy** | 100% | Only super admin can assign roles |
| **Data isolation** | 100% | Multi-tenant: no data leakage between workspaces |
| **Access speed** | <100ms | Permission checks don't slow down UI |

---

## Role Definitions & Permissions Matrix

### Role 1: Super Admin (Owner/Co-founder)

```
PERMISSIONS MATRIX (Super Admin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INBOX & CHAT
  ✅ View all chats (all teams)
  ✅ Send messages (on behalf of team)
  ✅ Assign chats to agents
  ✅ Take control of any chat
  ✅ Manage AI settings (confidence, enable/disable)
  ✅ View SLA metrics
  ✅ Export chat history

ORDERS & PAYMENTS
  ✅ View all orders
  ✅ Create/edit orders
  ✅ Manage payment settings (gateway, refunds)
  ✅ Approve/reject slip verification
  ✅ View all customer payments
  ✅ Issue refunds/credits
  ✅ Configure payment modes (full, deposit, installment)

PRODUCTS
  ✅ Add/edit/delete all products
  ✅ Manage catalog settings
  ✅ Configure AI product recommendations
  ✅ Bulk import/export

CRM CUSTOMERS
  ✅ View all customers (no filtering)
  ✅ Edit customer profiles
  ✅ Merge duplicate customers
  ✅ Delete customers (with audit trail)
  ✅ View customer history (all chats, orders, interactions)
  ✅ Create custom fields

TEAM MANAGEMENT
  ✅ Add/remove team members
  ✅ Assign roles (Super Admin, Manager, Agent, Viewer)
  ✅ Change user passwords (force reset)
  ✅ Suspend/reactivate accounts
  ✅ View team activity (audit log)
  ✅ Manage permissions (custom role rules - future)

ANALYTICS & REPORTING
  ✅ View all KPIs (personal, team, business-wide)
  ✅ View calendar heatmap (all agents)
  ✅ View AI insights (all recommendations)
  ✅ Export all reports (PDF, CSV)
  ✅ Access raw analytics API

SETTINGS & CONFIGURATION
  ✅ Access all settings pages
  ✅ Manage workspace settings (name, timezone, currency)
  ✅ Manage integrations (Payso API keys, channel connections)
  ✅ Configure notifications & reminders
  ✅ Set up booking/appointment service
  ✅ Configure deposit/installment rules
  ✅ Manage follow-up settings
  ✅ View audit logs
  ✅ Manage data export/backup
  ✅ Billing & subscription management
  ✅ API key management (for integrations)

LEGAL & COMPLIANCE
  ✅ Download audit logs (full history)
  ✅ Export customer data (GDPR)
  ✅ Delete workspace (irreversible)

CANNOT DO (by design):
  ❌ Cannot undo any action (audit trail immutable)
  ❌ Cannot delete audit logs
  ❌ Cannot impersonate other users (see as, but not act as)
```

### Role 2: Manager (Team Lead)

```
PERMISSIONS MATRIX (Manager)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INBOX & CHAT
  ✅ View chats assigned to own team
  ✅ Send messages (own team)
  ✅ Assign chats within own team
  ✅ Take control of team member chats
  ✅ View team SLA metrics
  ❌ Cannot manage global AI settings
  ❌ Cannot take control of other teams' chats

ORDERS & PAYMENTS
  ✅ View orders from own team
  ✅ View payment status
  ❌ Cannot issue refunds (must escalate to Super Admin)
  ❌ Cannot approve slip verification (escalates to admin)

PRODUCTS
  ✅ View product catalog
  ✅ View product performance (own team)
  ❌ Cannot add/edit/delete products (read-only)
  ❌ Cannot manage AI recommendations

CRM CUSTOMERS
  ✅ View customers interacting with own team
  ✅ View customer history (for own team interactions)
  ✅ Add notes to customer profiles
  ❌ Cannot delete customers
  ❌ Cannot merge customers
  ❌ Cannot edit customer profile (view-only)

TEAM MANAGEMENT
  ✅ View team members (own team)
  ✅ View team activity
  ❌ Cannot add/remove team members
  ❌ Cannot assign roles
  ❌ Cannot suspend accounts
  ❌ Cannot change passwords

ANALYTICS & REPORTING
  ✅ View team KPIs (own team)
  ✅ View team calendar heatmap
  ✅ View AI insights (for own team)
  ✅ Export team reports
  ❌ Cannot view Super Admin activity
  ❌ Cannot view billing/financial data

SETTINGS & CONFIGURATION
  ✅ View basic settings (read-only)
  ❌ Cannot change any settings
  ❌ Cannot manage integrations
  ❌ Cannot access billing

LEGAL & COMPLIANCE
  ❌ Cannot access audit logs
  ❌ Cannot export customer data
```

### Role 3: Agent/Staff (Team Member)

```
PERMISSIONS MATRIX (Agent/Staff)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INBOX & CHAT
  ✅ View assigned chats (own)
  ✅ Send messages (own chats)
  ✅ Request handoff to AI
  ✅ View own response time
  ❌ Cannot assign chats to others
  ❌ Cannot take control of other's chats

ORDERS & PAYMENTS
  ✅ Create orders (own chats)
  ✅ View own orders
  ❌ Cannot edit orders
  ❌ Cannot view other agents' orders
  ❌ Cannot manage payments

PRODUCTS
  ✅ View product catalog (for selling)
  ✅ View product pricing
  ❌ Cannot add/edit/delete products
  ❌ Cannot manage inventory

CRM CUSTOMERS
  ✅ View customers assigned to own (if assigned)
  ✅ View interaction history (own chats)
  ✅ Add notes (own interactions)
  ❌ Cannot view other agents' customers
  ❌ Cannot edit customer profiles
  ❌ Cannot delete/merge

TEAM MANAGEMENT
  ❌ Cannot access team management
  ❌ Cannot view other team members' activity

ANALYTICS & REPORTING
  ✅ View own KPIs (personal dashboard)
  ✅ View own performance metrics
  ✅ View personal insights (daily/weekly)
  ❌ Cannot view team metrics
  ❌ Cannot view revenue data
  ❌ Cannot view other agents' metrics

SETTINGS & CONFIGURATION
  ✅ Change own password
  ✅ Update own profile (name, phone, email)
  ❌ Cannot access any settings
  ❌ Cannot change any configurations

LEGAL & COMPLIANCE
  ❌ Cannot access audit logs
  ❌ Cannot export any data
```

### Role 4: Viewer (Read-only, no write access)

```
PERMISSIONS MATRIX (Viewer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRM CUSTOMERS
  ✅ View all customer profiles (read-only)
  ✅ View customer history (read-only)
  ❌ Cannot edit, delete, or add notes

ORDERS & PAYMENTS
  ✅ View all orders (read-only)
  ✅ View payment status (read-only)
  ❌ Cannot create or edit orders

PRODUCTS
  ✅ View product catalog (read-only)
  ✅ View product sales & performance (read-only)
  ❌ Cannot add/edit/delete

ANALYTICS & REPORTING
  ✅ View all dashboards (read-only)
  ✅ View KPIs (read-only)
  ✅ View calendar heatmap (read-only)
  ✅ Export reports (PDF, CSV)
  ❌ Cannot create custom reports
  ❌ Cannot access raw API

SETTINGS
  ✅ View basic workspace info (read-only)
  ❌ Cannot change anything

CANNOT DO
  ❌ No chat/message access
  ❌ No team management
  ❌ No audit logs
  ❌ No customer data export (GDPR)
```

---

## Permission Enforcement

### API Gateway (Request Level)

```
Every API request is checked:

1. Authentication: Is user logged in? (JWT token valid)
2. Authorization: Does user have permission for this action?
3. Resource Scoping: Is resource within user's allowed scope?
4. Audit Log: Log the action (success or denial)

Example: Agent requests to view customer profile
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request: GET /api/customers/{customer_id}
User role: Agent
Customer scope: Is this customer assigned to agent?

Check:
  1. Agent can view customers? ✅ (yes, assigned customers)
  2. Is this customer assigned to agent? ?
     - If YES: Allow, return customer data
     - If NO: Deny 403 Forbidden, log denied access

Audit log entry:
  {
    "timestamp": "2026-04-07T14:30:00Z",
    "user_id": "agent_123",
    "action": "GET /api/customers/customer_456",
    "resource": "customer_456",
    "result": "ALLOWED",
    "ip_address": "192.168.1.100"
  }
```

### UI Permission Rendering

```
Frontend checks permissions BEFORE rendering:

Example: Chat management page
┌─────────────────────────────────┐
│ Chat Management                 │
├─────────────────────────────────┤
│ Super Admin or Manager: Sees    │
│ [ Assign to Agent ▼]  [Take Control]
│ [ View SLA ]                    │
│                                 │
│ Agent: Sees                     │
│ [Can't assign] (disabled)       │
│ [Can't take control] (disabled) │
│ [View SLA] (own SLA only)       │
│                                 │
│ Viewer: Sees                    │
│ [All buttons hidden]            │
│ (read-only mode)                │
└─────────────────────────────────┘

Logic:
  if (user.role == "Super Admin" || user.role == "Manager") {
    show: [Assign], [Take Control], [SLA dashboard]
  } else if (user.role == "Agent") {
    show: [View own SLA]
    disable: [Assign], [Take Control]
  } else if (user.role == "Viewer") {
    hide: all action buttons
  }
```

---

## Workspace Data Isolation

### Multi-tenant Architecture

```
Every request filtered by workspace:

Workspace 1: Bangkok Hair Shop
  • Super Admin: Niran
  • Agents: Somchai, Ploy
  • Customers: 500 (workspace 1 only)
  • Orders: 2,000 (workspace 1 only)

Workspace 2: Bangkok Flower Shop
  • Super Admin: Samart
  • Agents: Can, Noi
  • Customers: 800 (workspace 2 only)
  • Orders: 3,500 (workspace 2 only)

Data isolation rule:
  Niran (Workspace 1 Super Admin) CANNOT:
    ❌ See Workspace 2 customers (Can't access)
    ❌ See Workspace 2 orders (Can't access)
    ❌ See Workspace 2 agents' activity (Can't access)
    ❌ Even in database: Query filtered by workspace_id

Database query example:
  SELECT * FROM customers
  WHERE workspace_id = {current_user.workspace_id}

  Niran's query:
    workspace_id = 1 → Returns Workspace 1 customers only

  Samart's query:
    workspace_id = 2 → Returns Workspace 2 customers only

Even if Niran tries SQL injection:
  SELECT * FROM customers WHERE workspace_id <> 1

  System response: 403 Forbidden (workspace isolation enforced)
```

---

## Audit Logging

### Complete Action Tracking

```
Every action logged with full context:

Audit Log Entry Structure:
{
  "audit_id": "AUD-2026-0407-000123",
  "timestamp": "2026-04-07T14:30:25.123Z",
  "workspace_id": 1,
  "user_id": "user_456",
  "user_name": "Niran",
  "user_role": "Super Admin",
  "action": "create_order",
  "resource_type": "order",
  "resource_id": "ORD-2026-001234",
  "details": {
    "customer": "Aom S.",
    "amount": 5000,
    "items": ["Haircut", "Color treatment"],
    "payment_mode": "full"
  },
  "result": "SUCCESS",
  "ip_address": "203.12.45.67",
  "user_agent": "Mozilla/5.0...",
  "change_summary": {
    "before": null,
    "after": {
      "status": "NEW",
      "customer_id": "cust_123",
      "amount": 5000
    }
  }
}


Actions logged:
  ✅ CREATE: New order, product, customer, team member
  ✅ UPDATE: Edit order, customer, product, settings
  ✅ DELETE: Remove order, customer, product
  ✅ VIEW: Access sensitive data (orders, payments, audit logs)
  ✅ EXPORT: Export reports, data, audit logs
  ✅ PERMISSION_CHANGE: Role assigned, permissions changed
  ✅ DENIED: Access attempt denied (with reason)
  ✅ LOGIN: User login with success/failure
  ✅ LOGOUT: User logout
  ✅ ROLE_CHANGE: User role changed
  ✅ INTEGRATION: Connect channel, API key created
  ✅ SETTINGS_CHANGE: Workspace settings, payment settings changed
  ✅ REFUND: Payment refunded or reversed
```

### Audit Log Dashboard (Super Admin Only)

```
⚙️ Audit Logs

Filters:
  Date range: [Apr 1 - Apr 7 ▼]
  User: [All users ▼]
  Action: [All actions ▼]
  Result: [All ✓ Failed ✓ ▼]

Results (example):
┌──────────────────────────────────────────────┐
│ Time      │ User   │ Action       │ Resource │
├──────────────────────────────────────────────┤
│ 14:30:25  │ Niran  │ CREATE order │ ORD-001  │
│ 14:28:12  │ Somchai│ DENIED: edit │ cust-50  │
│ 14:25:00  │ Ploy   │ VIEW order   │ ORD-002  │
│ 13:45:33  │ Niran  │ UPDATE cust  │ cust-45  │
│ 13:42:10  │ Unknown│ DENIED: login│ N/A      │
└──────────────────────────────────────────────┘

Click entry → See full details:
  Audit ID: AUD-2026-0407-000123
  Timestamp: 2026-04-07 14:30:25
  User: Niran (Super Admin)
  Action: Create Order
  Resource: ORD-2026-001234
  Details: {customer: Aom S., amount: ฿5000}
  Result: SUCCESS
  IP: 203.12.45.67

  [Export as PDF] [Delete (if <24h)]
```

---

## Role Change Management

### Changing User Role (Super Admin Only)

```
Super Admin changes Agent to Manager:

Before:
  User: Somchai
  Role: Agent
  Permissions: View own chats, create orders

Super Admin action:
  Settings → Team → Somchai → Change Role

  Current role: [Agent ▼]
  New role: [Manager ▼]

  Reason (required): "Promoted, managing 3 agents now"
  Effective date: [Immediately ▼] or [Scheduled ▼]

  [Save] [Cancel]

System response:
  ✅ Role changed
  ✅ New permissions applied immediately
  ✅ Session refresh (if logged in)
  ✅ Audit log entry created
  ✅ Email sent: "Your role has been changed to Manager"

If Somchai is logged in:
  • Sidebar updates immediately (real-time)
  • New menu items appear (Team management)
  • Old menu items disappear (nothing visible)
  • No disruption to current work

Audit log:
  {
    "action": "update_user_role",
    "user_id": "user_somchai",
    "old_role": "Agent",
    "new_role": "Manager",
    "changed_by": "user_niran",
    "timestamp": "2026-04-07T14:30:00Z",
    "reason": "Promoted, managing 3 agents now"
  }
```

---

## Settings Pages (Super Admin Only)

### Workspace Settings

```
⚙️ Settings

TAB 1: General
  Workspace name: [Bangkok Hair Shop]
  Description: [Professional salon in central Bangkok]
  Logo: [Upload logo]
  Time zone: [Asia/Bangkok ▼]
  Currency: [THB ▼]
  Language: [Thai ▼]

TAB 2: Team Management
  Members: 4

  Active members:
  ┌─────────────────────────────────────┐
  │ Name      │ Role      │ Status      │
  ├─────────────────────────────────────┤
  │ Niran     │ Super Admin│ Active      │
  │ Somchai   │ Manager   │ Active      │
  │ Ploy      │ Agent     │ Active      │
  │ Can       │ Viewer    │ Invited     │
  └─────────────────────────────────────┘

  [+ Invite Member] [Manage Roles]

TAB 3: Integration & API
  Connected channels:
  ✅ LINE: Connected (Jun 2024)
  ✅ Facebook: Connected (Jan 2024)
  ✅ Instagram: Connected (Feb 2024)

  Payso API:
  API Key: •••••••••••••••••
  Status: Active
  [Regenerate] [Revoke]

  Webhooks:
  ✅ Order created → Post to [webhook URL]
  ✅ Order paid → Post to [webhook URL]

  [Add webhook] [Test webhook]

TAB 4: Backup & Export
  Last backup: 2026-04-06 02:00 AM
  [Download backup]
  [Restore from backup]

  Data export:
  [Export all customers (CSV)]
  [Export all orders (CSV)]
  [Export audit logs (CSV)]

TAB 5: Billing
  Plan: Pro
  Cost: ฿2,990/month
  Next billing: 2026-05-07

  [Upgrade plan] [Downgrade] [Cancel subscription]

  [Payment methods] [Invoices]

TAB 6: Audit Logs
  [View audit logs] → Opens audit log dashboard
```

---

## Acceptance Criteria

### Permission Enforcement
- [ ] Every API endpoint checks user permission before returning data
- [ ] UI elements disabled/hidden based on user role (no "permission denied" errors)
- [ ] Denied access logged in audit trail
- [ ] Permission checks < 100ms latency
- [ ] No permission bypass via URL manipulation
- [ ] No permission bypass via API direct calls (without proper headers)

### Workspace Isolation
- [ ] Data queries filtered by workspace_id automatically
- [ ] No user can see data from other workspaces
- [ ] No user can create resources in other workspaces
- [ ] Even with SQL injection attempt: workspace isolation enforced

### Role Management
- [ ] Only Super Admin can assign roles
- [ ] Only Super Admin can remove team members
- [ ] Role change applies immediately (real-time sync)
- [ ] Role change logged in audit trail
- [ ] User gets notification of role change (email + in-app)

### Audit Logging
- [ ] All CRUD operations logged
- [ ] All denied access attempts logged (with reason)
- [ ] All role changes logged
- [ ] All login/logout logged
- [ ] All integration changes logged (channels connected, API keys created)
- [ ] Timestamp accurate (UTC, not local time)
- [ ] Cannot delete audit logs (immutable)
- [ ] Audit logs available to Super Admin via dashboard

### Settings Management
- [ ] Only Super Admin can access settings
- [ ] Settings changes logged in audit trail
- [ ] Workspace info editable (name, logo, timezone, currency)
- [ ] Team members manageable (invite, role change, suspend)
- [ ] Integrations configurable (channel connections, API keys)
- [ ] Backup & export available (customer data, orders, audit logs)
- [ ] Billing visible to Super Admin only

### Performance
- [ ] Permission checks don't slow down page load (< 100ms)
- [ ] Audit log queries < 2 sec (for 1 month data)
- [ ] Exporting audit logs < 5 sec (1 month data)
- [ ] Role change reflected immediately in UI

### Security
- [ ] Password hashing (bcrypt or better)
- [ ] Session timeout after 30 min inactivity
- [ ] Force password change (at first login, after admin reset)
- [ ] No passwords in audit logs or error messages
- [ ] API keys never shown in full (only last 4 chars)
- [ ] Rate limiting on failed login (5 attempts = locked 15 min)

---

## Edge Cases

### User Locked Out
```
Problem: Super Admin forgets password, no other admin

Solution:
  - Support team can reset via ticket (requires verification)
  - Alternative: Secondary super admin created at signup
  - Emergency: Workspace owner email recovery
  - All resets logged in audit trail
```

### Role Conflicts
```
Problem: User assigned two roles (shouldn't happen, but check)

Solution:
  - Primary role: Only one active role per user
  - Fallback: Highest privilege role wins
  - Example: Both Agent + Manager → Treated as Manager
  - Logged as error in audit trail
```

### Deleted User Data
```
Problem: Super Admin deletes user, but user has open orders

Solution:
  - Cannot delete user with active resources
  - Must reassign orders, customers, chats first
  - OR: Suspend account instead of deleting
  - User data anonymized (soft delete, not hard delete)
  - Orders stay in system (for revenue tracking)
```

### Permission Cache Staleness
```
Problem: Super Admin changes agent's role, but cache not updated

Solution:
  - Cache invalidation on role change
  - Cache TTL: 5 minutes max (then refresh)
  - Real-time sync via WebSocket (role change event broadcast)
  - If offline: Permission checked on next request
```

---

## Integration Checklist

- [ ] **All Features**: Every feature enforces permission checks
- [ ] **Inbox Chat**: Agent sees only assigned chats, Manager sees team chats
- [ ] **Orders**: Agent sees own orders, Manager sees team orders, Super Admin sees all
- [ ] **Customers**: Role-based customer visibility
- [ ] **Products**: Agent views only (for selling), Manager/Admin can edit
- [ ] **Audit Log**: All features log actions (created by this feature)
- [ ] **Dashboard/KPI**: Role-based KPI visibility (Agent personal, Manager team, Admin all)
- [ ] **Analytics**: Role-based report access
- [ ] **Booking**: Role-based calendar access

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Permission accuracy** | 100% | No unauthorized access succeeds |
| **Audit log coverage** | 100% | All actions logged |
| **Permission check latency** | <100ms | Time from request to permission check |
| **Workspace isolation** | 100% | No cross-workspace data leakage |
| **Audit log query time** | <2 sec | Query 1 month of logs |
| **Role change adoption** | 100% | Changes applied immediately |
| **Compliance score** | 100% | Audit trail meets legal requirements |

---

## Configuration Defaults

| Setting | Default | Why | Range |
|---------|---------|-----|-------|
| **Session timeout** | 30 min | Security vs usability | 15-120 min |
| **Failed login lockout** | 5 attempts | Prevent brute force | 3-10 attempts |
| **Lockout duration** | 15 min | Balance security + UX | 5-60 min |
| **Audit log retention** | 2 years | Legal compliance | 1-7 years |
| **Password expiry** | Never | Modern approach (no expiry) | 30-180 days or Never |
| **API key expiry** | Never | Integration stability | 90-365 days or Never |
| **Session check interval** | 5 min | Resource efficiency | 1-10 min |

---

## Review Questions

1. **Custom roles**: Should Super Admin be able to create custom roles (not just predefined 4), or lock to standard roles?
2. **Delegation**: Should Manager be able to temporarily delegate their authority, or only Super Admin?
3. **Audit log access**: Should Managers see audit logs for their team, or only Super Admin?
4. **Password policy**: Should we enforce strong passwords (uppercase, numbers, symbols)?
5. **Two-factor authentication**: Should we support 2FA for additional security?
6. **IP whitelisting**: Should Super Admin be able to restrict access by IP range?
7. **Session per device**: Should we limit users to 1 active session, or allow multiple?
8. **Export sensitivity**: Should exporting customer data require additional authentication (2FA)?

---

## Summary: Complete Onebear Feature Set (12/12)

✅ **Features Completed**:
1. ✅ Onboarding Flow (3-step setup, <5 min, AI default-ON)
2. ✅ Inbox & Chat Management (multi-channel, SLA, AI handoff, Take Control)
3. ✅ CRM Customer Management (segment-first, current handler, hybrid UI)
4. ✅ Product Catalog (custom pricing, pre-orders, AI suggestions)
5. ✅ AI Sales Agent (order flow, upsell/cross-sell, 70% confidence handoff)
6. ✅ Follow-up Management (configurable per channel, real-time merge)
7. ✅ Order Management (NEW→INPROGRESS→PENDING_PAYMENT→PENDING_VERIFY→COMPLETED, Payso API)
8. ✅ Slip Verification (100% confidence auto-approve, manual review, blacklist)
9. ✅ Calendar & KPI (real-time updates, role-based visibility, professional dashboards)
10. ✅ Booking & Appointments (3-step flow, agent selection, reminders, no-show tracking)
11. ✅ AI Data Analyst (daily insights, weekly/monthly reports, detailed calculation logic)
12. ✅ Settings & Permissions (RBAC, workspace isolation, complete audit logging)

---

## Ready for Implementation?

**All 12 features documented with**:
- ✅ Feature overview & business value
- ✅ User personas & goals
- ✅ Detailed flows (step-by-step)
- ✅ Acceptance criteria (100+ per feature)
- ✅ Edge cases & error handling
- ✅ Configuration options
- ✅ Integration points
- ✅ Success metrics
- ✅ Review questions (for feedback)
- ✅ Calculation logic (Feature #11)
- ✅ UI mockups (Feature #10)
- ✅ Permission matrix (Feature #12)

**Next steps**:
1. Review all 12 features for feedback/revisions
2. Prioritize features for development phase
3. Assign 1 agent per feature (architecture recommended)
4. Begin implementation sprint

---

## Prototype Updates (April 2026)

### Settings Sidebar Reorganization

The Settings sidebar is now grouped into 5 sections:

| Group | Items |
|-------|-------|
| ทั่วไป (General) | ทั่วไป (Workspace), Team, Notifications |
| Messaging | Integrations, Greeting Messages, Auto Reply, Auto Assignment, Shortcuts, AI Chatbot, **AI Sales Agent** |
| **CRM** (new group) | **Custom Fields** |
| Payments | การชำระเงิน |
| Admin | Billing, Audit Log |

### AI Sales Agent Moved to Settings > Messaging (new)

AI Sales Agent configuration (previously a standalone page concept) is now in Settings under the Messaging group. Accessible to Super Admins and Managers. See `5_ai_sales_agent_user_story.md` Prototype Updates for full spec.

### Custom Fields Moved to Settings > CRM (new)

Customer custom field management has been relocated from the CRM page to Settings → CRM → Custom Fields. This aligns with the principle that field schema is a configuration concern (admin), not a daily CRM operation.

**Custom Fields Settings UI:**
- Table listing all custom fields: name, type badge, required indicator, scope
- Type badges: Text (blue), Date (teal), Dropdown (purple), Textarea (gray), Number (orange), Checkbox (green)
- Add/Edit modal: name input, type select, conditional Dropdown options textarea, Required toggle, scope radio group (ลูกค้าทุกคน / LINE เท่านั้น / Facebook เท่านั้น / เฉพาะบางช่องทาง)
- Delete with window.confirm

**Role access:** Super Admin only can add/edit/delete custom fields. Agents/Staff see fields when editing customer profiles but cannot modify field schema.

### Workspace Settings — Multi-store Support (new)

WorkspaceSettings now shows a "ร้านค้าที่เชื่อมต่อ" (Connected Stores) section at the bottom. Each workspace/store connection card shows:
- Store name, current user's role in that store, status badge (ใช้งานอยู่ / ไม่ได้ใช้งาน / สลับไปร้านนี้ button)
- "สลับไปยัง [ชื่อร้าน] สำเร็จ" success toast appears 3 seconds after switching
- "สร้างร้านค้าใหม่" link for adding a new workspace

**Rule:** User can be member of multiple workspaces with different roles per workspace (e.g., Owner in Store A, Manager in Store B).

### Payment Config — Bank Account Management (new)

PaymentConfigSettings now includes a bank account section (shown BEFORE any Payso integration, since Payso is deferred for Phase 1).

**Bank Account UI:**
- Cards showing: bank color dot, bank abbreviation, bank name, account number, account name, QR badge (มี QR / ไม่มี QR)
- Add/Edit modal: Thai bank dropdown (KBank, SCB, Bangkok Bank, Krungthai, TTB, GSB, Bay, ISBT), account number, account name, QR image upload with preview
- Multiple accounts supported (for different payment options)
- Default mock: KBank account with QR

**Note:** Bank account is the primary payment collection method for Phase 1. Payso API integration is planned for Phase 2 and currently shown as "เร็วๆ นี้" (coming soon).

