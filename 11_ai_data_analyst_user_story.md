# 11. AI Data Analyst — User Story

**Status**: Ready for feedback
**Priority**: 🟡 High (Actionable business intelligence)
**Target Users**: Managers, Owners (strategic decisions)
**Primary Device**: Desktop (read), Mobile (quick check)
**Time Target**: Insights generated daily < 2 min, PDF export < 5 sec

---

## Feature Overview

The **AI Data Analyst** system automatically generates intelligent business insights from shop data, identifies trends, and suggests actionable recommendations. Daily insights appear in the dashboard, with deeper weekly/monthly reports available for download.

**Goal**: Shop owner sees insights → Understands what's happening → Knows what to do next → Takes action → Revenue grows.

---

## User Personas & Goals

### Persona 1: Manager (Daily User)
- Checks insights every morning
- Wants to know: "What happened yesterday? What should I do today?"
- **Goal**: 2-min read, clear actions, confidence to make decisions

### Persona 2: Owner (Strategic Planner)
- Reviews weekly/monthly reports
- Wants to know: "Where are we heading? Should I hire more staff? Which channel is most profitable?"
- **Goal**: Data-driven strategic decisions, PDF reports for board meetings

### Persona 3: Agent/Staff (Optional)
- Wants personal performance insights
- **Goal**: "How did I perform? How can I improve?"

---

## Business Value

| Metric | Target | Why |
|--------|--------|-----|
| **Insight accuracy** | 95%+ | Wrong insights = wrong decisions |
| **Actionability** | 80%+ of insights have clear action | Insights without action = useless |
| **Adoption rate** | 80%+ of managers read daily | Must be valuable to read daily |
| **Decision impact** | 30%+ of actions improve metrics | ROI on using insights |
| **Time to insight** | <2 min to read, <5 min to act | Fast = decision = results |

---

## Insight Categories

### Daily Insights (Morning Report)

```
Delivered: 08:00 AM each day (configurable)

INSIGHT #1: Sales Performance Yesterday
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Revenue: ฿15,250 (vs avg ฿12,500)
Status: 📈 +22% above average

Breakdown:
  • LINE: ฿6,840 (45%) - trending ↑
  • Facebook: ฿4,575 (30%) - stable
  • Instagram: ฿2,280 (15%) - trending ↓
  • WhatsApp: ฿1,555 (10%) - trending ↓

Insight: LINE channel performing best. Instagram lagging.

🎯 ACTION: [Boost Instagram with promotions] [View analytics]


INSIGHT #2: Customer Behavior
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 New customers: 8 (vs avg 6)
Status: 📈 +33% above normal

First-time conversion rate: 62% (vs avg 55%)
Status: ✅ Above target

Insight: More new customers converting than usual. Good sign!

🎯 ACTION: [Review new customer messages] [Improve onboarding flow]


INSIGHT #3: Chat Response Time
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Avg response time: 3.2 min
Status: ⚠️ Slow (target: 2 min)

SLA compliance: 87% (target: 95%)
Status: ⚠️ Below target

Peak wait time: 5.1 min (11 AM - 1 PM)

Insight: Response time slowing down during lunch hours.

🎯 ACTION: [Add staff during 11-1 PM] [View chat queue] [Check AI handoff]


INSIGHT #4: Product Insights
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 Top product: Haircut (18 orders)
💰 Revenue: ฿5,400

🔔 Low stock alerts:
  • Hair gel (5 units left, reorder soon)
  • Scissors set (2 units left, critical!)

🔴 Dead inventory:
  • Treatment XYZ (0 orders in 30 days)
  • Color A (0 orders in 45 days)

Insight: Scissors running out! Treatment XYZ isn't selling.

🎯 ACTION: [Reorder scissors NOW] [Adjust pricing for Treatment] [Hide dead stock]


INSIGHT #5: AI Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI closure rate: 35% (vs target 30%)
Status: ✅ Exceeding target

Avg AI order value: ฿4,200 (vs manual ฿3,800)
Status: ✅ Higher than manual

AI handed off to human: 8 times
Handoff reasons:
  • Customer requested human (4)
  • Low confidence (3)
  • Payment issue (1)

Insight: AI performing above expectations. Good confidence calibration.

🎯 ACTION: [Review low-confidence cases] [Celebrate team! 🎉]
```

### Weekly Report (Summary)

```
Generated: Sunday 6:00 PM (weekly digest)

WEEK OF APRIL 7-13, 2026

📊 EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Weekly Revenue: ฿87,500
Avg Daily: ฿12,500
vs Last Week: +18% ↑
vs Last Year: +45% ↑

Orders Completed: 22
Avg Order Value: ฿3,977
New Customers: 42
Customer Satisfaction: 4.6/5

💡 KEY INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. LINE channel surged +28% (excellent performance)
2. Instagram struggling (-12% vs last week) - needs attention
3. Team SLA improved to 91% (target: 95%, almost there!)
4. AI closure rate 35% (above 30% target)
5. New customer retention rate up to 68% (good sign!)

🎯 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Priority 1: Boost Instagram (low engagement, sales down)
  → Run promotion campaign
  → Post more frequently (3x/week)
  → Expected impact: +15% revenue

Priority 2: Optimize chat response time (SLA 91%, target 95%)
  → Add 1 agent during 11am-1pm
  → Expected: +4% SLA improvement

Priority 3: Remove dead inventory (Treatment XYZ, etc.)
  → Clear shelf space
  → Reduce storage costs
  → Expected: +฿2k inventory savings

✅ WHAT'S WORKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• AI system performing above target (35% vs 30%)
• New customer quality up (68% retention)
• LINE channel strength growing
• Team morale/satisfaction high

[Export as PDF] [Share Report] [Schedule Weekly Reports]
```

### Monthly Report (Strategic)

```
Generated: Last day of month (monthly strategic report)

MONTH OF APRIL 2026

📊 FINANCIAL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Revenue: ฿1,250,000
Target: ฿1,500,000
Achievement: 83.3% (⚠️ Below target)

Orders: 315
Avg Order Value: ฿3,968
New Customers: 165
Repeat Customers: 150

YoY Growth: +45% (April 2025 vs April 2026)

📈 CHANNEL PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINE: ฿562,500 (45%) - STRONG ↑
Facebook: ฿375,000 (30%) - STABLE
Instagram: ฿187,500 (15%) - WEAK ↓
WhatsApp: ฿125,000 (10%) - EMERGING

👥 CUSTOMER INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New Customers: 165 (avg ฿3,200 first order)
Retention Rate: 72% (good, target 70%)
Repeat Purchase Rate: 45% (within 30 days)
Avg Customer Lifetime Value: ฿12,500

🎯 STRATEGIC RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. HIRE 1 ADDITIONAL AGENT
   Reason: SLA dropped to 91% (target 95%), peak hours overloaded
   Expected impact: +4% SLA, +₿15k revenue (faster service)
   ROI: Payback in 2 months

2. INVEST IN INSTAGRAM MARKETING
   Reason: Revenue down 12% MoM, engagement low
   Recommended: ฿5,000/month budget for influencer partnerships
   Expected impact: +฿50k additional revenue by June

3. CONSOLIDATE PRODUCT LINE
   Reason: 15% of inventory not selling, taking up space
   Action: Remove 8 products, focus on top 20
   Expected impact: -฿10k inventory costs, simpler operations

4. EXPAND LINE CHANNEL
   Reason: Best performing (45% revenue), high margin
   Action: Add LINE-exclusive promotions
   Expected impact: +฿75k additional revenue by Q3

📊 TEAM PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent A (Niran): ฿180,000 (35% of team revenue) 🏆
Agent B (Somchai): ฿150,000 (29% of team revenue)
Agent C (Ploy): ฿120,000 (23% of team revenue)
AI System: ฿175,000 (35% of team revenue) 🤖

Top Performer: Niran (highest AOV ฿4,200)
Most Improved: Ploy (+28% vs March)
Best Customer Satisfaction: Somchai (4.8/5)

🎓 SKILL GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Ploy needs training on upsells (AOV ฿3,200 vs team avg ฿3,968)
• Team needs Instagram social media skills
• Consider AI prompt optimization workshop

[Export as PDF] [Share with Team] [Schedule Monthly Reports]
```

---

## Daily Insights Dashboard

### Mobile View (Quick Check)

```
┌─────────────────────────────────────┐
│ 🤖 AI Insights          Today 08:23 │
├─────────────────────────────────────┤
│                                     │
│ 💰 Yesterday: ฿15,250              │
│    +22% vs average                  │
│                                     │
│ ⚠️ 3 Alerts:                        │
│    • Instagram down 12%             │
│    • Chat response slow (3.2 min)   │
│    • Scissors reorder urgently      │
│                                     │
│ ✅ 2 Wins:                          │
│    • New customers +33% ↑           │
│    • AI exceeding target            │
│                                     │
│ 🎯 Top Action:                      │
│    [Run Instagram promotion]        │
│    [Reorder scissors NOW]           │
│                                     │
│ [See Full Report]                   │
│ [Export PDF]                        │
└─────────────────────────────────────┘
```

### Desktop View (Detailed)

```
┌─────────────────────────────────────────────────┐
│ 🤖 AI Insights Dashboard       Export PDF  ⚙️  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Today's Performance                             │
│ ┌──────────────────────────────────────────┐  │
│ │ Revenue: ฿15,250  │ Orders: 5            │  │
│ │ +22% vs avg       │ +1 vs avg            │  │
│ │                                          │  │
│ │ New Customers: 8  │ Avg Order: ฿3,050   │  │
│ │ +33% vs avg       │ -3% vs avg           │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ 🎯 TODAY'S ACTION ITEMS                         │
│ ┌──────────────────────────────────────────┐  │
│ │ 1. [Boost Instagram] Revenue down 12%   │  │
│ │    Expected impact: +฿2,000 this week   │  │
│ │                                          │  │
│ │ 2. [Reorder scissors NOW] Stock: 2 left │  │
│ │    Estimated cost: ฿1,500               │  │
│ │                                          │  │
│ │ 3. [Add agent 11-1 PM] SLA: 87% (↓)    │  │
│ │    Expected impact: +4% SLA              │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ 💡 INSIGHTS                                     │
│                                                 │
│ Sales Performance                              │
│ └─ LINE strong at 45% revenue (+28% week)     │
│ └─ Instagram weak at 15% revenue (-12% week)  │
│                                                 │
│ Customer Insights                              │
│ └─ New customer conversion up 62%              │
│ └─ Repeat rate stable at 45%                  │
│                                                 │
│ AI System                                       │
│ └─ Closure rate 35% (target 30%) ✅           │
│ └─ AOV ฿4,200 (vs manual ฿3,800) ✅          │
│                                                 │
│ [View Weekly Report] [View Monthly Report]   │
└─────────────────────────────────────────────────┘
```

---

## Insight Generation Logic

### Data Sources

```
System analyzes real-time data from:
  ✅ Order Management (revenue, orders, payment status)
  ✅ Inbox Chat (response time, SLA, handoff rate)
  ✅ Product Catalog (sales by product, stock levels)
  ✅ CRM (customer behavior, retention, lifetime value)
  ✅ Booking & Appointments (no-show rate, capacity)
  ✅ AI Sales Agent (closure rate, confidence, handoff rate)
  ✅ Follow-up Management (follow-up conversion rate)
  ✅ Team performance (sales per agent, satisfaction)

Data freshness:
  • Real-time for current metrics
  • 24h delay for historical comparisons
  • 7d rolling averages for trends
```

### Calculation Logic (Detailed Formulas)

#### 1. Revenue Anomaly Detection

```
FORMULA 1.1: Daily Revenue Variance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Variance % = ((Today's Revenue - 30-Day Average) / 30-Day Average) × 100

Example:
  Today's revenue: ฿15,250
  30-day average: ฿12,500

  Calculation:
  ((15,250 - 12,500) / 12,500) × 100 = (2,750 / 12,500) × 100 = 22%

  Output: "Revenue 22% above average ✅"

  Threshold: ±20% triggers insight


FORMULA 1.2: Channel Performance Breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Channel % = (Channel Revenue / Total Daily Revenue) × 100

Example:
  Daily breakdown:
  • LINE: ฿6,840 / ฿15,250 × 100 = 44.8% ≈ 45%
  • Facebook: ฿4,575 / ฿15,250 × 100 = 30%
  • Instagram: ฿2,280 / ฿15,250 × 100 = 15%
  • WhatsApp: ฿1,555 / ฿15,250 × 100 = 10%

  Output: Channel breakdown visualization


FORMULA 1.3: Revenue Status Classification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IF Variance > +20%: ✅ "Above average"
IF -20% ≤ Variance ≤ +20%: ⚠️ "Within expected range"
IF Variance < -20%: 🔴 "Below average - investigate"

Priority for insight:
  • Variance > ±30%: HIGH priority (urgent action)
  • Variance ±20-30%: MEDIUM priority (monitor)
  • Variance < ±20%: LOW priority (informational)
```

#### 2. Trend Analysis

```
FORMULA 2.1: Week-over-Week Growth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WoW Growth % = ((This Week Revenue - Last Week Revenue) / Last Week Revenue) × 100

Example:
  This week (Apr 7-13): ฿87,500
  Last week (Mar 31-Apr 6): ฿74,050

  Calculation:
  ((87,500 - 74,050) / 74,050) × 100 = (13,450 / 74,050) × 100 = 18.2%

  Output: "Weekly revenue +18% ↑"


FORMULA 2.2: Channel Trend (Linear Regression)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trend = (Sum of (Day × Revenue)) / (Sum of Days²) - Average
Slope calculation for 7-day trend

Example (LINE channel daily revenue):
  Days:      1      2      3      4      5      6      7
  Revenue: 4000   4200   4500   4800   5200   5600   5900

  7-day average: (4000+4200+4500+4800+5200+5600+5900) / 7 = ฿4,885

  Linear trend: +257/day (upward trend)
  WoW change: (5900-4000) / 4000 × 100 = +47.5%

  Output: "LINE trending up +28% ↑"


FORMULA 2.3: Trend Classification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IF Slope > +10%: 📈 "Strong uptrend"
IF Slope +2% to +10%: ↗️ "Moderate uptrend"
IF Slope -2% to +2%: → "Stable"
IF Slope -10% to -2%: ↘️ "Moderate downtrend"
IF Slope < -10%: 📉 "Strong downtrend"
```

#### 3. Product Intelligence

```
FORMULA 3.1: Product Performance Score
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score = (Units Sold × Price + Customer Satisfaction × 10) / Time Period (days)

Example (Haircut service):
  Units sold: 18
  Price: ฿300
  Customer satisfaction: 4.8/5
  Time period: 30 days

  Score = (18 × 300 + 4.8 × 10) / 30 = (5400 + 48) / 30 = 184.8

  Ranking: Top product (highest score)


FORMULA 3.2: Dead Stock Detection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Days Since Last Sale = Current Date - Last Order Date

IF Days > Threshold (30 days): DEAD STOCK
Severity = Days / Threshold × 100

Example:
  Treatment XYZ:
  • Last sold: 45 days ago
  • Threshold: 30 days
  • Status: DEAD STOCK
  • Severity: (45 / 30) × 100 = 150% (red flag)

  Output: "Treatment XYZ not selling, remove to free shelf space"


FORMULA 3.3: Stock Reorder Alert
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IF Current Stock < Reorder Level: ALERT
Urgency = (Reorder Level - Current Stock) / Reorder Level × 100

Example:
  Scissors set:
  • Current stock: 2 units
  • Reorder level: 5 units
  • Urgency: (5 - 2) / 5 × 100 = 60% (HIGH urgency)

  Output: "Scissors critical! Only 2 units left, reorder NOW"


FORMULA 3.4: Stockout Projection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Daily Sales Velocity = (Total Sold Last 7 Days) / 7
Days Until Stockout = Current Stock / Daily Sales Velocity

Example:
  Hair gel:
  • Current stock: 15 units
  • Sold last 7 days: 14 units
  • Daily velocity: 14 / 7 = 2 units/day
  • Days to stockout: 15 / 2 = 7.5 days

  Output: "Hair gel will run out in 7.5 days, reorder by day 5"
```

#### 4. Customer Behavior

```
FORMULA 4.1: New Customer Conversion Rate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Conversion % = (New Customers Who Ordered / New Customer Contacts) × 100

Example (daily):
  New customer contacts: 13
  New customers who ordered: 8

  Conversion = (8 / 13) × 100 = 61.5% ≈ 62%

  Benchmark: Target 55%, actual 62% = ✅ Above target


FORMULA 4.2: Customer Retention Rate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Retention % = (Customers Repeat Purchase / Customers First 30 Days Ago) × 100

Example (monthly):
  Customers from 30 days ago: 165
  Repeat purchases within 30 days: 119

  Retention = (119 / 165) × 100 = 72.1%

  Status: ✅ Above target (70%)


FORMULA 4.3: Customer Lifetime Value (CLV)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLV = Average Order Value × Average Purchase Frequency × Customer Lifespan

Example:
  Average order: ฿3,200
  Repeat rate: 45% within 30 days
  Estimated lifespan: 36 months (3 years)

  CLV = 3,200 × (45% × 12 months / 12) × 3 = 3,200 × 5.4 = ฿17,280

  Output: "Avg customer lifetime value: ฿17,280"
```

#### 5. Chat Response Time & SLA

```
FORMULA 5.1: Average Response Time
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avg Response Time = Sum of All Response Times / Number of Messages

Example (50 chats):
  Total response time: 160 minutes
  Messages: 50

  Avg = 160 / 50 = 3.2 minutes

  Target: 2 minutes
  Status: ⚠️ 60% above target (3.2 vs 2.0)


FORMULA 5.2: SLA Compliance (2 Min Target)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLA % = (Messages Answered < 2 Min / Total Messages) × 100

Example:
  Total messages: 100
  Messages answered < 2 min: 87

  SLA = (87 / 100) × 100 = 87%

  Target: 95%
  Status: ⚠️ Below target by 8%


FORMULA 5.3: Peak Hour Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Peak Hour = Hour with highest response time
Peak Response Time = Average during peak hour

Example:
  11:00-12:00 messages: 25, avg response: 5.1 min
  12:00-13:00 messages: 28, avg response: 4.8 min
  13:00-14:00 messages: 22, avg response: 3.2 min

  Peak: 11:00-13:00 (lunch hours)

  Recommendation: Add 1 agent during 11am-1pm (expected +4% SLA)
```

#### 6. AI Sales Agent Performance

```
FORMULA 6.1: AI Closure Rate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Closure % = (Orders Closed by AI / Total Orders AI Handled) × 100

Example (yesterday):
  Orders AI handled: 23
  Orders AI closed (no handoff): 8

  Rate = (8 / 23) × 100 = 34.8% ≈ 35%

  Target: 30%
  Status: ✅ Exceeding target by 5%


FORMULA 6.2: AI Average Order Value (AOV)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI AOV = Total Revenue from AI / Orders Closed by AI

Example:
  Total revenue (AI-closed): ฿33,600
  Orders closed: 8

  AI AOV = 33,600 / 8 = ฿4,200

  Manual AOV: ฿3,800
  Status: ✅ AI AOV ฿400 higher (+10.5%)


FORMULA 6.3: Handoff Rate Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Handoff % = (AI Handoffs / AI Total Interactions) × 100

Example (daily):
  AI interactions: 23
  AI handoffs: 8 (4 customer request, 3 low confidence, 1 payment issue)

  Rate = (8 / 23) × 100 = 34.8%

  Analysis by reason:
  • Customer requested: (4 / 8) × 100 = 50% (acceptable)
  • Low confidence: (3 / 8) × 100 = 37.5% (improve training)
  • Payment issue: (1 / 8) × 100 = 12.5% (edge case)

  Action: Train AI on payment scenarios
```

#### 7. Team Performance

```
FORMULA 7.1: Agent Sales Ranking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sales Score = (Agent Revenue / Total Team Revenue) × 100

Example (monthly):
  Team revenue: ฿515,000

  Niran: (180,000 / 515,000) × 100 = 34.95% = Rank #1 🏆
  Somchai: (150,000 / 515,000) × 100 = 29.13% = Rank #2
  Ploy: (120,000 / 515,000) × 100 = 23.30% = Rank #3
  AI: (65,000 / 515,000) × 100 = 12.62% = Rank #4


FORMULA 7.2: Month-over-Month Performance Change
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MoM Change % = ((This Month - Last Month) / Last Month) × 100

Example (Ploy):
  This month (April): ฿120,000
  Last month (March): ฿94,000

  Change = ((120,000 - 94,000) / 94,000) × 100 = 27.66% ≈ +28%

  Status: 📈 Ploy improving significantly


FORMULA 7.3: Customer Satisfaction Score
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Satisfaction = Sum of Agent Ratings / Number of Ratings

Example (Somchai):
  Reviews: 4.8, 4.9, 4.7, 4.8, 4.9
  Total: 23.1 / 5 = 4.62 ≈ 4.6/5

  Tier: ⭐ Excellent (4.5+)
```

#### 8. Recommendation Engine (Prioritization)

```
FORMULA 8.1: Recommendation Priority Score
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Priority Score = (Revenue Impact × Urgency × Feasibility) / 100

Components:
  • Revenue Impact (0-100): How much revenue affected
  • Urgency (0-100): How quickly must act (100 = immediate)
  • Feasibility (0-100): How easy to implement (100 = very easy)

Example 1: Boost Instagram (low revenue, medium urgency)
  • Revenue Impact: 40 (Instagram only 15% of revenue)
  • Urgency: 60 (trending down, needs attention)
  • Feasibility: 80 (easy to run promotion)
  • Score = (40 × 60 × 80) / 100 = 1,920
  • Rank: #1 Priority


Example 2: Reorder scissors (high revenue, high urgency)
  • Revenue Impact: 90 (scissors essential, used daily)
  • Urgency: 95 (only 2 units left, will run out in 3 days)
  • Feasibility: 100 (one-click reorder)
  • Score = (90 × 95 × 100) / 100 = 8,550
  • Rank: #1 Priority (URGENT)


Example 3: Add agent (high revenue, high urgency, lower feasibility)
  • Revenue Impact: 85 (improve SLA = more orders)
  • Urgency: 80 (SLA 87% vs 95% target)
  • Feasibility: 40 (requires hiring, onboarding)
  • Score = (85 × 80 × 40) / 100 = 2,720
  • Rank: #2 Priority


FORMULA 8.2: Expected ROI Calculation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Expected ROI = (Revenue Increase - Implementation Cost) / Implementation Cost × 100

Example 1: Boost Instagram
  Expected additional revenue (1 week): ฿2,000
  Implementation cost (content, ads): ฿500

  ROI = (2,000 - 500) / 500 × 100 = 300%
  Payback period: 2-3 days


Example 2: Add 1 agent (full month)
  Expected revenue increase (SLA +4%): ฿15,000
  Agent cost (1 month salary + training): ฿12,000

  ROI = (15,000 - 12,000) / 12,000 × 100 = 25%
  Payback period: 48 days


FORMULA 8.3: Action Sequence (Dependency Order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actions ordered by:
  1. CRITICAL (must do immediately): Score > 8,000 OR revenue at risk
  2. HIGH (should do this week): Score 5,000-8,000
  3. MEDIUM (should do this month): Score 2,000-5,000
  4. LOW (nice to have): Score < 2,000

Daily example (sorted):
  Action 1: [Reorder scissors NOW] - Score 8,550 (CRITICAL)
  Action 2: [Boost Instagram] - Score 1,920 (HIGH)
  Action 3: [Add agent 11-1pm] - Score 2,720 (HIGH)
```

#### 9. Insight Generation Scheduling

```
FORMULA 9.1: Refresh Schedule Calculation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last 24 hours data = Orders from (Now - 24h) to (Now)
Last 7 days data = Orders from (Now - 7 days) to (Now)
Last 30 days data = Orders from (Now - 30 days) to (Now)
Month-to-date = Orders from (1st of this month) to (Now)
Year-to-date = Orders from (1st of this year) to (Now)

Calculation runs:
  • Hourly: Update real-time metrics (last 24h, current week, current month)
  • Daily 07:30: Prepare 08:00 AM daily insights (using yesterday's full 24h data)
  • Weekly Sunday 17:30: Prepare Sunday 18:00 weekly report (Mon-Sun)
  • Monthly [last day] 08:30: Prepare [last day] 09:00 monthly report (month 1-end)


FORMULA 9.2: Data Completeness Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Data % Complete = (Records with all required fields / Total expected records) × 100

IF Data % Complete < 85%: Skip insight generation
  Reason: Incomplete data leads to inaccurate insights

IF Data % Complete ≥ 85%: Generate insights
  Note: Include confidence level in insight
```



---

## Configuration & Settings

### Admin Setup

```
⚙️ AI Data Analyst Settings

DAILY INSIGHTS:
  Enabled: [Toggle] ✅
  Delivery time: [08:00] AM
  Time zone: [Asia/Bangkok ▼]
  Recipients: [Managers, Owners ▼]

  Include sections:
  ☑ Sales Performance
  ☑ Customer Behavior
  ☑ Chat Response Time
  ☑ Product Insights
  ☑ AI Performance
  ☑ Team Performance

WEEKLY REPORT:
  Enabled: [Toggle] ✅
  Delivery day: [Sunday ▼]
  Delivery time: [18:00] (6 PM)
  Format: [PDF + Dashboard ▼]

  Include sections:
  ☑ Executive Summary
  ☑ Key Insights
  ☑ Recommendations
  ☑ Channel Performance
  ☑ Team Performance

MONTHLY REPORT:
  Enabled: [Toggle] ✅
  Delivery day: [Last day of month ▼]
  Delivery time: [09:00] (9 AM)
  Format: [PDF + Dashboard ▼]

  Include sections:
  ☑ Financial Summary
  ☑ Strategic Recommendations
  ☑ YoY Comparison
  ☑ Team Performance
  ☑ Skill Gaps

THRESHOLDS & ALERTS:
  Revenue anomaly threshold: [20] %
  Chat response target: [2] min
  SLA target: [95] %
  Inventory reorder level: [5] units
  Product dead stock threshold: [30] days
  AI closure target: [30] %

LANGUAGE:
  Insight language: [Thai ▼] (or English)
  Report language: [Thai ▼]
  Date format: [DD/MM/YYYY ▼]

NOTIFICATIONS:
  Delivery method: [Dashboard ▼] (or Email, Chat, Both)
  Urgent alerts: [Toggle] ✅ (real-time alerts for critical issues)
  Alert threshold: Issues impacting > [฿5,000] revenue
```

---

## Acceptance Criteria

### Daily Insights
- [ ] Generated automatically at configured time (default 8 AM)
- [ ] Covers 5+ categories (Sales, Customers, Chat, Products, AI, Team)
- [ ] Each insight shows: Metric + Status + Comparison + Action
- [ ] Status indicators: ✅ (good), ⚠️ (warning), 📈 (trend), 🎯 (action needed)
- [ ] At least 3 actionable recommendations daily
- [ ] Actions are clickable (e.g., [Boost Instagram] → Opens promotion page)
- [ ] Insights accurate (compared against raw data, 95%+ accuracy)
- [ ] Insights in Thai language (natural, professional tone)
- [ ] Delivered to dashboard and email simultaneously
- [ ] Mobile and desktop readable without scrolling excessively

### Weekly Report
- [ ] Generated automatically on configured day (default Sunday 6 PM)
- [ ] Contains executive summary, key insights, recommendations
- [ ] Data covers full week (Mon-Sun)
- [ ] Includes YoY and WoW comparisons
- [ ] 3-5 strategic recommendations with expected ROI
- [ ] Exportable as PDF (formatted, professional)
- [ ] Shareable via email link (requires login)

### Monthly Report
- [ ] Generated automatically on last day of month
- [ ] Strategic-level insights (hiring, budget allocation, marketing spend)
- [ ] Team performance rankings (individual agent KPIs)
- [ ] Skill gap identification (training needs)
- [ ] 3-5 major strategic recommendations
- [ ] Financial focus (revenue target achievement, profit optimization)
- [ ] Exportable as PDF (board-meeting ready)
- [ ] Includes 12-month trend analysis

### Action Items
- [ ] Each insight includes [Action] button(s)
- [ ] Clicking action takes user to relevant dashboard/page
- [ ] Actions pre-populate relevant filters (e.g., [Boost Instagram] → Instagram analytics)
- [ ] User can mark action as "Done" (tracked in audit log)
- [ ] Completed actions shown in next insight (e.g., "You boosted Instagram last week, impact +8%")

### PDF Export
- [ ] Export captures all insights/recommendations
- [ ] Professional formatting (logo, date, metrics)
- [ ] Readable on all devices (mobile, tablet, desktop)
- [ ] Includes action items
- [ ] Chart/graph visualizations where relevant
- [ ] Export time < 5 seconds
- [ ] File size < 5 MB

### Accuracy & Freshness
- [ ] Insights generated from current data (< 1 hour old)
- [ ] Metrics match KPI dashboard ±0.5% tolerance
- [ ] Anomalies correctly detected (test: inject test data → insight triggered)
- [ ] Trends correctly identified (test: create artificial trend → insight captured)
- [ ] Recommendations relevant to detected issues (not generic)

### Language & Tone
- [ ] Thai text professional, grammatically correct
- [ ] Numbers formatted correctly (฿12,500 not ฿12500)
- [ ] Tone encouraging (positive language, celebrate wins)
- [ ] Tone actionable (clear what to do next)
- [ ] No jargon or technical terms (accessible to all skill levels)

---

## Edge Cases

### No Data Available
```
Problem: New shop (no historical data)

Solution:
  - Skip comparisons (can't compare to "average")
  - Show baseline metrics only
  - Show "Not enough data yet" for trends
  - Focus on actionable insights (e.g., "Product A selling well!")
  - After 7 days: Show vs previous week
  - After 30 days: Show full monthly insights
```

### Insufficient Data for Insight
```
Problem: Only 1 order today (can't draw meaningful trends)

Solution:
  - Don't generate anomaly alerts
  - Show: "Too little data today, check back tomorrow"
  - Still show YTD/MTD insights (larger dataset)
  - Daily insights require minimum 3 data points
```

### Urgent Issue Detection
```
Problem: Scissors stock drops to 0 units (mid-day)

Solution:
  - Real-time alert (not just daily digest)
  - Send notification immediately: "Scissors out of stock!"
  - Alert only if impact > threshold (e.g., ฿5,000 revenue at risk)
  - Configurable alert threshold by admin
```

### Recommendation Conflicts
```
Problem: Two insights recommend contradictory actions

Solution:
  - Prioritize by revenue impact (highest first)
  - Show both, let manager decide
  - Example: "Budget limited, prioritize A over B"
  - Document assumption (e.g., "Based on revenue impact")
```

---

## Integration Checklist

- [ ] **Order Management**: Insights pull daily revenue, orders, payment status
- [ ] **Inbox Chat**: Insights include SLA, response time, handoff rate
- [ ] **Product Catalog**: Insights show product sales, stock, dead inventory
- [ ] **CRM**: Insights include customer retention, lifetime value, new customer quality
- [ ] **AI Sales Agent**: Insights track AI closure rate, confidence, handoff behavior
- [ ] **Booking & Appointments**: Insights include no-show rate, capacity utilization
- [ ] **Follow-up Management**: Insights track follow-up conversion rates
- [ ] **Team Performance**: Insights show per-agent KPIs, rankings, performance trends
- [ ] **Dashboard/KPI**: Insight actions link to relevant dashboards
- [ ] **Audit Log**: All insight generation, exports, and actions logged

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Insight accuracy** | 95%+ | Spot-check insights vs raw data |
| **Adoption rate** | 80%+ | % of managers reading daily insights |
| **Action completion rate** | 60%+ | % of recommended actions taken |
| **Revenue impact** | +10% attributed to insights | Compare revenue before/after insight adoption |
| **Decision speed** | <5 min from insight to action | Track time from insight read to action taken |
| **Actionability** | 80%+ | % of insights with clear action |
| **Report export time** | <5 sec | Measure PDF generation time |
| **Insight relevance** | 4.5+/5 | User rating of insight helpfulness |

---

## Configuration Defaults

| Setting | Default | Why | Range |
|---------|---------|-----|-------|
| **Daily insights time** | 08:00 AM | Morning briefing | Any hour |
| **Weekly report day** | Sunday | Planning day | Mon-Sun |
| **Monthly report day** | Last day | Month-end close | Any day |
| **Revenue anomaly threshold** | 20% | Meaningful variance | 10-50% |
| **SLA target** | 95% | Industry standard | 80-99% |
| **AI closure target** | 30% | Ambitious but achievable | 20-50% |
| **Reorder threshold** | 5 units | Reasonable buffer | 1-20 units |
| **Dead stock threshold** | 30 days | Clear signal | 7-90 days |
| **Language** | Thai | Primary market | Thai/English |

---

## Review Questions

1. **Insight frequency**: Should insights be generated daily, daily+weekly, or just weekly?
2. **AI tone**: Should insights be formal/professional or friendly/conversational?
3. **Recommendations depth**: Should each recommendation include ROI estimate (as shown)?
4. **Comparative data**: Should we show vs "Last Month" only, or also "Last Year" + "Last Week"?
5. **Personal insights**: Should agents/staff see personal performance insights, or only managers?
6. **Insight actions**: Should action buttons auto-execute (e.g., "Reorder now") or just navigate?
7. **Predictive vs descriptive**: Should insights include predictive recommendations ("You'll run out in 2 days")?
8. **Alert fatigue**: Should we limit daily alerts to top 3-5 items, or show all detected issues?

---

## Ready for Feature #12: Settings & Permissions?

✅ AI Data Analyst complete.

**Should I proceed to Feature #12: Settings & Permissions** (role-based access control, workspace configuration, audit logging)?

