/**
 * OneBear Mock API Server
 * Runs on port 5000 to satisfy the Vite proxy (target: http://localhost:5000)
 * Handles all /api/v1/companies/:companyId/* endpoints with realistic mock data
 */

const express = require('express')
const app = express()

app.use(express.json())

// CORS (Vite proxy handles it but just in case)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Correlation-Id')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ok(res, data) {
  return res.json({ success: true, data })
}

function paged(res, data, total) {
  return res.json({ data, total: total ?? data.length, continuationToken: null, hasMore: false })
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function thbAmount(min, max) {
  return rand(min, max) * 100
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const COMPANY_ID = 'dev-company'

// Rooms match ChatRoom interface exactly
// contactType mapping rules:
// - 'Lead'     → contact has no orders yet (New/Unassigned state = สร้าง Lead ถ้ายังไม่มี)
// - 'Customer' → contact has placed at least one order (Order + Pending Payment → auto convert)
// - Agent picks up chat (InProgress) → Lead: New → Contacted
// - Done/Resolved room + Customer sends new message → room goes back to InProgress
const ROOMS = [
  { id: 'r1', platform: 'LINE',      contactType: 'Customer', state: 'InProgress', assignToUserId: 'u1',   unreadCount: 2, customerName: 'สมชาย ใจดี',  customerAvatar: null, lastMessage: 'อยากทราบราคาครีมบำรุงผิวครับ',  createdTimestamp: Date.now() - 86400000,     lastMessageTimestamp: Date.now() - 180000,   isPinned: true,  pinnedTimestamp: Date.now() - 86400000, handoffSource: null, handoffSourceName: null, handoffTimestamp: null, isAiMuted: false, attendedUserIds: ['u1'], frtStartTimestamp: Date.now() - 300000,  frtEndTimestamp: Date.now() - 240000,  frtDurationMs: 60000, isFrtStopped: true,  isResolved: false, rtEndTimestamp: null,              rtDurationMs: null,   sessionTimings: [], followupTimestamp: null, followupContent: null, isSpam: false, spamScore: null },
  { id: 'r2', platform: 'Facebook',  contactType: 'Lead',     state: 'New',        assignToUserId: null,   unreadCount: 1, customerName: 'Jane Smith',   customerAvatar: null, lastMessage: 'Hi, I need help!',                createdTimestamp: Date.now() - 7200000,      lastMessageTimestamp: Date.now() - 600000,   isPinned: false, pinnedTimestamp: null,                  handoffSource: null, handoffSourceName: null, handoffTimestamp: null, isAiMuted: false, isAiHandling: true,  attendedUserIds: [],      frtStartTimestamp: Date.now() - 600000,   frtEndTimestamp: null,                 frtDurationMs: null,  isFrtStopped: false, isResolved: false, rtEndTimestamp: null,              rtDurationMs: null,   sessionTimings: [], followupTimestamp: null, followupContent: null, isSpam: false, spamScore: null },
  { id: 'r3', platform: 'Instagram', contactType: 'Customer', state: 'InProgress', assignToUserId: 'u1',   unreadCount: 0, customerName: 'นิดา รักสวย', customerAvatar: null, lastMessage: 'ครีม SPF50 ราคา 890 บาทค่ะ',    createdTimestamp: Date.now() - 86400000 * 2, lastMessageTimestamp: Date.now() - 1140000,  isPinned: false, pinnedTimestamp: null,                  handoffSource: null, handoffSourceName: null, handoffTimestamp: null, isAiMuted: false, attendedUserIds: [],      frtStartTimestamp: Date.now() - 1200000,  frtEndTimestamp: Date.now() - 1140000, frtDurationMs: 60000, isFrtStopped: true,  isResolved: false, rtEndTimestamp: null,              rtDurationMs: null,   sessionTimings: [], followupTimestamp: null, followupContent: null, isSpam: false, spamScore: null },
  { id: 'r4', platform: 'WhatsApp',  contactType: 'Customer', state: 'Resolved',   assignToUserId: 'u2',   unreadCount: 0, customerName: 'John Doe',     customerAvatar: null, lastMessage: 'Thank you!',                      createdTimestamp: Date.now() - 86400000 * 3, lastMessageTimestamp: Date.now() - 3600000,  isPinned: false, pinnedTimestamp: null,                  handoffSource: null, handoffSourceName: null, handoffTimestamp: null, isAiMuted: false, attendedUserIds: [],      frtStartTimestamp: Date.now() - 3700000,  frtEndTimestamp: Date.now() - 3650000, frtDurationMs: 50000, isFrtStopped: true,  isResolved: true,  rtEndTimestamp: Date.now() - 3600000,  rtDurationMs: 100000, sessionTimings: [], followupTimestamp: null, followupContent: null, isSpam: false, spamScore: null },
  { id: 'r5', platform: 'LINE',      contactType: 'Lead',     state: 'New',        assignToUserId: null,   unreadCount: 1, customerName: 'มณี ทองดี',   customerAvatar: null, lastMessage: 'มีของในสต็อกไหมคะ',             createdTimestamp: Date.now() - 86400000,     lastMessageTimestamp: Date.now() - 7200000,  isPinned: false, pinnedTimestamp: null,                  handoffSource: null, handoffSourceName: null, handoffTimestamp: null, isAiMuted: false, attendedUserIds: [],      frtStartTimestamp: Date.now() - 7200000,  frtEndTimestamp: null,                 frtDurationMs: null,  isFrtStopped: false, isResolved: false, rtEndTimestamp: null,              rtDurationMs: null,   sessionTimings: [], followupTimestamp: null, followupContent: null, isSpam: false, spamScore: null },
]

const MESSAGES = {
  r1: [
    { id: 'm1', roomId: 'r1', senderId: 'c1', senderType: 'Customer', senderName: 'สมชาย ใจดี', type: 'Text', platform: 'LINE', content: 'สวัสดีครับ สนใจสินค้าอยู่นะครับ', timestamp: Date.now() - 300000, deliveryStatus: 'Delivered' },
    { id: 'm2', roomId: 'r1', senderId: 'u1', senderType: 'Agent', senderName: 'สมชาย ใจดี (Agent)', type: 'Text', platform: 'LINE', content: 'สวัสดีครับ มีอะไรให้ช่วยได้บ้างครับ?', timestamp: Date.now() - 240000, deliveryStatus: 'Delivered' },
    { id: 'm3', roomId: 'r1', senderId: 'c1', senderType: 'Customer', senderName: 'สมชาย ใจดี', type: 'Text', platform: 'LINE', content: 'อยากทราบราคาครีมบำรุงผิวครับ', timestamp: Date.now() - 180000, deliveryStatus: 'Delivered' },
  ],
  r2: [
    { id: 'm4', roomId: 'r2', senderId: 'c2', senderType: 'Customer', senderName: 'Jane Smith', type: 'Text', platform: 'Facebook', content: 'Hi, I need help!', timestamp: Date.now() - 600000, deliveryStatus: 'Delivered' },
    { id: 'm5', roomId: 'r2', senderId: 'u1', senderType: 'Agent', senderName: 'สมชาย ใจดี (Agent)', type: 'Text', platform: 'Facebook', content: 'Hello! How can I help you today?', timestamp: Date.now() - 540000, deliveryStatus: 'Delivered' },
  ],
  r3: [
    { id: 'm6', roomId: 'r3', senderId: 'c3', senderType: 'Customer', senderName: 'นิดา รักสวย', type: 'Text', platform: 'Instagram', content: 'ราคาเท่าไรคะ?', timestamp: Date.now() - 1200000, deliveryStatus: 'Delivered' },
    { id: 'm7', roomId: 'r3', senderId: 'u1', senderType: 'Agent', senderName: 'สมชาย ใจดี (Agent)', type: 'Text', platform: 'Instagram', content: 'ครีม SPF50 ราคา 890 บาทค่ะ เซรั่มวิตามินซี 1,290 บาทค่ะ', timestamp: Date.now() - 1140000, deliveryStatus: 'Delivered' },
  ],
  r4: [
    { id: 'm8', roomId: 'r4', senderId: 'c4', senderType: 'Customer', senderName: 'John Doe', type: 'Text', platform: 'WhatsApp', content: 'I ordered the cream, thank you!', timestamp: Date.now() - 3700000, deliveryStatus: 'Delivered' },
    { id: 'm9', roomId: 'r4', senderId: 'u2', senderType: 'Agent', senderName: 'วิไล รักษา (Manager)', type: 'Text', platform: 'WhatsApp', content: 'Thank you for your order! We will ship it soon.', timestamp: Date.now() - 3650000, deliveryStatus: 'Delivered' },
    { id: 'm10', roomId: 'r4', senderId: 'c4', senderType: 'Customer', senderName: 'John Doe', type: 'Text', platform: 'WhatsApp', content: 'Thank you!', timestamp: Date.now() - 3600000, deliveryStatus: 'Delivered' },
  ],
  r5: [
    { id: 'm11', roomId: 'r5', senderId: 'c5', senderType: 'Customer', senderName: 'มณี ทองดี', type: 'Text', platform: 'LINE', content: 'มีของในสต็อกไหมคะ', timestamp: Date.now() - 7200000, deliveryStatus: 'Delivered' },
  ],
}

// Customers match CustomerListItem interface exactly
const CUSTOMERS = [
  { id: 'c1', customerType: 'Individual', name: 'สมชาย ใจดี', phone: '081-234-5678', email: 'somchai@email.com', avatar: null, addresses: [], channels: [{ platform: 'LINE', displayName: 'สมชาย' }], tags: [{ name: 'VIP', isAiAssigned: false, reason: null }, { name: 'ขาประจำ', isAiAssigned: false, reason: null }], ltv: 58500, orderCount: 12, aov: 4875, lastOrderTimestamp: Date.now() - 86400000 * 2, lastActivityTimestamp: Date.now() - 180000, lastMessagePreview: 'สนใจสินค้าอยู่นะครับ', pinnedNote: null, isAtRisk: false, daysSinceLastPurchase: 2, suggestedAction: null, suggestedActionType: null },
  { id: 'c2', customerType: 'Individual', name: 'Jane Smith', phone: '089-987-6543', email: 'jane@email.com', avatar: null, addresses: [], channels: [{ platform: 'Facebook', displayName: 'Jane Smith' }], tags: [], ltv: 4200, orderCount: 3, aov: 1400, lastOrderTimestamp: Date.now() - 86400000 * 10, lastActivityTimestamp: Date.now() - 600000, lastMessagePreview: 'Hi, I need help!', pinnedNote: null, isAtRisk: false, daysSinceLastPurchase: 10, suggestedAction: 'ส่ง follow-up', suggestedActionType: 'followup' },
  { id: 'c3', customerType: 'Individual', name: 'นิดา รักสวย', phone: '086-543-2109', email: null, avatar: null, addresses: [], channels: [{ platform: 'Instagram', displayName: 'nida_raksway' }], tags: [{ name: 'สนใจ', isAiAssigned: true, reason: 'ถามราคาสินค้า' }], ltv: 9800, orderCount: 7, aov: 1400, lastOrderTimestamp: Date.now() - 86400000 * 5, lastActivityTimestamp: Date.now() - 1200000, lastMessagePreview: 'ราคาเท่าไรคะ?', pinnedNote: null, isAtRisk: false, daysSinceLastPurchase: 5, suggestedAction: null, suggestedActionType: null },
  { id: 'c4', customerType: 'Individual', name: 'John Doe', phone: null, email: 'john@email.com', avatar: null, addresses: [], channels: [{ platform: 'WhatsApp', displayName: 'John' }], tags: [], ltv: 1200, orderCount: 1, aov: 1200, lastOrderTimestamp: Date.now() - 86400000 * 200, lastActivityTimestamp: Date.now() - 3600000, lastMessagePreview: 'Thank you!', pinnedNote: null, isAtRisk: true, daysSinceLastPurchase: 200, suggestedAction: 'ส่ง welcome กลับ', suggestedActionType: 'welcome' },
  { id: 'c5', customerType: 'Individual', name: 'มณี ทองดี', phone: '082-111-2233', email: null, avatar: null, addresses: [], channels: [{ platform: 'LINE', displayName: 'มณี' }], tags: [], ltv: 7300, orderCount: 5, aov: 1460, lastOrderTimestamp: Date.now() - 86400000 * 20, lastActivityTimestamp: Date.now() - 7200000, lastMessagePreview: 'มีของในสต็อกไหมคะ', pinnedNote: null, isAtRisk: false, daysSinceLastPurchase: 20, suggestedAction: null, suggestedActionType: null },
]

// Products match Product interface exactly
const PRODUCTS = [
  { id: 'p1', name: 'ครีมบำรุงผิวหน้า SPF50', category: 'ครีม', description: 'ครีมกันแดดสูตรบำรุงผิว กันน้ำได้ดี', price: 890, stock: 142, effectiveStock: 142, allowPreOrder: false, status: 'Active', imageUrl: null, images: [], variants: [], upsells: [], crossSells: [], upsellMaxPrice: null, isSample: false, createdTimestamp: Date.now() - 86400000 * 30, updatedTimestamp: null },
  { id: 'p2', name: 'เซรั่มวิตามินซี', category: 'เซรั่ม', description: 'เซรั่มลดรอยด่างดำ เพิ่มความกระจ่างใส', price: 1290, stock: 87, effectiveStock: 87, allowPreOrder: false, status: 'Active', imageUrl: null, images: [], variants: [], upsells: [], crossSells: [], upsellMaxPrice: null, isSample: false, createdTimestamp: Date.now() - 86400000 * 25, updatedTimestamp: null },
  { id: 'p3', name: 'มาส์กหน้าลดสิว', category: 'มาส์ก', description: 'มาส์กดินเหนียวสูตรลดสิว ลดรูขุมขน', price: 699, stock: 215, effectiveStock: 215, allowPreOrder: false, status: 'Active', imageUrl: null, images: [], variants: [], upsells: [], crossSells: [], upsellMaxPrice: null, isSample: false, createdTimestamp: Date.now() - 86400000 * 20, updatedTimestamp: null },
  { id: 'p4', name: 'โลชั่นบำรุงผิวกาย', category: 'โลชั่น', description: 'โลชั่นผิวนุ่มใส กลิ่นหอม', price: 490, stock: 0, effectiveStock: 0, allowPreOrder: false, status: 'Inactive', imageUrl: null, images: [], variants: [], upsells: [], crossSells: [], upsellMaxPrice: null, isSample: false, createdTimestamp: Date.now() - 86400000 * 15, updatedTimestamp: null },
]

// Orders match OrderItem interface exactly
const ORDERS = [
  { id: 'o1', orderId: 'OB-001', customerId: 'c1', customerName: 'สมชาย ใจดี', roomId: 'r1', status: 'Paid', source: 'Chat', items: [{ productId: 'p1', productName: 'ครีมบำรุงผิวหน้า SPF50', variantId: null, variantLabel: null, quantity: 2, unitPrice: 890, lineTotal: 1780 }], subtotal: 1780, discount: 0, total: 1780, currency: 'THB', paymentMode: 'Transfer', paymentLink: null, paidAmount: 1780, paidTimestamp: Date.now() - 86400000, aiClosed: false, assignedToUserId: 'u1', internalNote: null, cancellationReason: null, createdTimestamp: Date.now() - 86400000 * 2, updatedTimestamp: Date.now() - 86400000 },
  { id: 'o2', orderId: 'OB-002', customerId: 'c2', customerName: 'Jane Smith', roomId: 'r2', status: 'PendingPayment', source: 'Chat', items: [{ productId: 'p2', productName: 'เซรั่มวิตามินซี', variantId: null, variantLabel: null, quantity: 1, unitPrice: 1290, lineTotal: 1290 }], subtotal: 1290, discount: 0, total: 1290, currency: 'THB', paymentMode: 'Transfer', paymentLink: { url: 'https://pay.example.com/mock', status: 'Active', expiresAtTimestamp: Date.now() + 86400000, createdTimestamp: Date.now() - 3600000 }, paidAmount: 0, paidTimestamp: null, aiClosed: false, assignedToUserId: null, internalNote: null, cancellationReason: null, createdTimestamp: Date.now() - 3600000, updatedTimestamp: null },
  { id: 'o3', orderId: 'OB-003', customerId: 'c3', customerName: 'นิดา รักสวย', roomId: 'r3', status: 'Shipped', source: 'Chat', items: [{ productId: 'p1', productName: 'ครีมบำรุงผิวหน้า SPF50', variantId: null, variantLabel: null, quantity: 1, unitPrice: 890, lineTotal: 890 }, { productId: 'p3', productName: 'มาส์กหน้าลดสิว', variantId: null, variantLabel: null, quantity: 1, unitPrice: 699, lineTotal: 699 }], subtotal: 1589, discount: 0, total: 1589, currency: 'THB', paymentMode: 'Transfer', paymentLink: null, paidAmount: 1589, paidTimestamp: Date.now() - 86400000 * 3, aiClosed: true, assignedToUserId: 'u2', internalNote: null, cancellationReason: null, createdTimestamp: Date.now() - 86400000 * 3, updatedTimestamp: Date.now() - 86400000 * 3 },
]

const INTEGRATIONS = [
  { id: 'i1', platform: 'LINE', channelName: 'OneBear Shop', channelId: 'U123abc', isActive: true, tokenStatus: 'Valid', connectedAt: Date.now() - 86400000 * 60 },
  { id: 'i2', platform: 'Facebook', channelName: 'OneBear Facebook', channelId: 'FB456def', isActive: true, tokenStatus: 'Valid', connectedAt: Date.now() - 86400000 * 45 },
  { id: 'i3', platform: 'Instagram', channelName: 'onebear_ig', channelId: 'IG789ghi', isActive: true, tokenStatus: 'Valid', connectedAt: Date.now() - 86400000 * 45 },
]

const USERS = [
  { id: 'u1', displayName: 'สมชาย ใจดี (Agent)', email: 'somchai@onebear.com', role: 'Agent', isActive: true, avatar: null },
  { id: 'u2', displayName: 'วิไล รักษา (Manager)', email: 'wilai@onebear.com', role: 'Manager', isActive: true, avatar: null },
  { id: 'dev-user', displayName: 'Dev User', email: 'dev@onebear.com', role: 'SuperAdmin', isActive: true, avatar: null },
]

const MEMBERS = [
  { id: 'u1', userId: 'u1', displayName: 'สมชาย ใจดี', email: 'somchai@onebear.com', roleId: 'role-agent', roleName: 'Agent', isActive: true },
  { id: 'u2', userId: 'u2', displayName: 'วิไล รักษา', email: 'wilai@onebear.com', roleId: 'role-manager', roleName: 'Manager', isActive: true },
  { id: 'u3', userId: 'dev-user', displayName: 'Dev User', email: 'dev@onebear.com', roleId: 'role-superadmin', roleName: 'Super Admin', isActive: true },
]

const ROLES = [
  { id: 'role-superadmin', name: 'Super Admin', description: 'Full access', permissions: [3001,3002,3003,3004,3005] },
  { id: 'role-manager', name: 'Manager', description: 'Team management', permissions: [3001,3002,3003,3004] },
  { id: 'role-agent', name: 'Agent', description: 'Chat operations', permissions: [3001,3002,3003] },
  { id: 'role-viewer', name: 'Viewer', description: 'Read only', permissions: [3001] },
]

const FOLLOW_UPS = [
  { id: 'f1', customerId: 'c1', customerName: 'สมชาย ใจดี', channelPlatform: 'LINE', message: 'สวัสดีครับ ยังสนใจสินค้าอยู่ไหมครับ?', scheduledAt: Date.now() + 3600000, status: 'Queued', templateId: null, roomId: 'r1' },
  { id: 'f2', customerId: 'c2', customerName: 'Jane Smith', channelPlatform: 'Facebook', message: 'Hi! We have a special offer just for you 🎁', scheduledAt: Date.now() - 3600000, status: 'Sent', templateId: null, roomId: 'r2' },
  { id: 'f3', customerId: 'c3', customerName: 'นิดา รักสวย', channelPlatform: 'Instagram', message: 'มีสินค้าใหม่มาแล้วนะคะ ลองดูได้เลย!', scheduledAt: Date.now() + 7200000, status: 'Queued', templateId: null, roomId: 'r3' },
]

// Booking services
const BOOKING_SERVICES = [
  { id: 's1', name: 'ปรึกษาผิว', price: 500, durationMinutes: 60, isActive: true, agentUserIds: ['u1', 'u2'], description: 'คำปรึกษาด้านผิวพรรณและการดูแลผิว' },
  { id: 's2', name: 'สปาหน้า', price: 990, durationMinutes: 90, isActive: true, agentUserIds: ['u2'], description: 'บำรุงผิวหน้า ลดริ้วรอย' },
  { id: 's3', name: 'นวดหน้า', price: 700, durationMinutes: 45, isActive: true, agentUserIds: ['u1', 'u2'], description: 'นวดผ่อนคลายใบหน้า' },
]

// Bookings match BookingItem interface exactly
const BOOKINGS = [
  { id: 'b1', bookingId: 'BK-001', customerId: 'c1', customerName: 'สมชาย ใจดี', status: 'Confirmed', serviceName: 'ปรึกษาผิว', servicePrice: 500, serviceDurationMinutes: 60, agentUserId: 'u1', agentName: 'สมชาย ใจดี (Agent)', dateTimestamp: new Date('2026-04-15T10:00:00+07:00').getTime(), endTimestamp: new Date('2026-04-15T11:00:00+07:00').getTime(), isRecurring: false, recurringInterval: null, customerNote: '', createdTimestamp: Date.now() - 86400000 * 2 },
  { id: 'b2', bookingId: 'BK-002', customerId: 'c3', customerName: 'นิดา รักสวย', status: 'Confirmed', serviceName: 'สปาหน้า', servicePrice: 990, serviceDurationMinutes: 90, agentUserId: 'u2', agentName: 'วิไล รักษา (Manager)', dateTimestamp: new Date('2026-04-16T14:00:00+07:00').getTime(), endTimestamp: new Date('2026-04-16T15:30:00+07:00').getTime(), isRecurring: false, recurringInterval: null, customerNote: 'แพ้น้ำหอม', createdTimestamp: Date.now() - 86400000 },
  { id: 'b3', bookingId: 'BK-003', customerId: 'c5', customerName: 'มณี ทองดี', status: 'Completed', serviceName: 'นวดหน้า', servicePrice: 700, serviceDurationMinutes: 45, agentUserId: 'u1', agentName: 'สมชาย ใจดี (Agent)', dateTimestamp: new Date('2026-04-08T09:00:00+07:00').getTime(), endTimestamp: new Date('2026-04-08T09:45:00+07:00').getTime(), isRecurring: false, recurringInterval: null, customerNote: null, createdTimestamp: Date.now() - 86400000 * 3 },
]

// ─── Dashboard data ───────────────────────────────────────────────────────────

function generateDashboardData(from, to) {
  const days = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
  return {
    stats: {
      totalRooms: 1021,
      activeRooms: 38,
      resolvedToday: 72,
      avgResponseTimeMs: 127000,
      totalRoomsChange: 5.2,
      activeRoomsChange: -3.1,
      resolvedTodayChange: 12.4,
      avgResponseTimeMsChange: -8.3,
    },
    orderKpi: {
      todayRevenue: 71400,
      periodRevenue: 456100,
      newOrders: 53,
      paidOrders: 345,
      pendingPayment: 28,
      pendingVerify: 12,
      avgOrderValue: 1321,
      aiClosedOrders: 178,
      aiClosureRate: 0.52,
    },
    platformDistribution: [
      { platform: 'LINE', count: 428 },
      { platform: 'Facebook', count: 312 },
      { platform: 'Instagram', count: 187 },
      { platform: 'WhatsApp', count: 94 },
    ],
    messageVolume: days.map((date, i) => ({
      date,
      inbound: [142, 168, 195, 184, 221, 247, 189][i],
      outbound: [118, 145, 171, 159, 198, 213, 162][i],
    })),
    responseTimeTrend: days.map((date, i) => ({
      date,
      avgMs: [185000, 162000, 143000, 158000, 127000, 134000, 119000][i],
    })),
    agentPerformance: [
      { userId: 'u1', name: 'สมชาย ใจดี', roomsHandled: 38, avgResponseTimeMs: 92000, satisfaction: 4.8, revenue: 182000, ordersClosed: 24 },
      { userId: 'u2', name: 'วิไล รักษา', roomsHandled: 31, avgResponseTimeMs: 105000, satisfaction: 4.6, revenue: 143000, ordersClosed: 19 },
      { userId: 'u3', name: 'ธนา พัฒน์', roomsHandled: 27, avgResponseTimeMs: 134000, satisfaction: 4.3, revenue: 118000, ordersClosed: 15 },
    ],
    calendarHeatmap: days.map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        date: d.toISOString().slice(0, 10),
        revenue: [48200, 52700, 61500, 58900, 74300, 89100, 71400][i],
        orderCount: [34, 41, 48, 44, 57, 68, 53][i],
      }
    }),
  }
}

// ─── Daily insights ───────────────────────────────────────────────────────────

// DailyInsights interface shape (matches useInsights.ts)
const DAILY_INSIGHTS = {
  date: new Date().toISOString().slice(0, 10),
  sales: {
    revenue: 71400,
    avgRevenue: 58000,
    changePercent: 23.1,
    orderCount: 53,
    avgOrderValue: 1347,
    channelBreakdown: [
      { channel: 'LINE', revenue: 29988, percent: 42, trend: 'up' },
      { channel: 'Facebook', revenue: 17136, percent: 24, trend: 'up' },
      { channel: 'Instagram', revenue: 12852, percent: 18, trend: 'stable' },
      { channel: 'WhatsApp', revenue: 7140, percent: 10, trend: 'down' },
      { channel: 'Others', revenue: 4284, percent: 6, trend: 'stable' },
    ],
  },
  customers: {
    newCustomers: 12,
    avgNewCustomers: 9,
    atRiskCount: 5,
    hotCount: 18,
    conversionRate: 0.142,
  },
  chat: {
    totalMessages: 384,
    activeRooms: 47,
    avgResponseTimeMs: 135000,
    slaComplianceRate: 0.917,
    unansweredCount: 5,
  },
  ai: {
    aiMessagesHandled: 261,
    aiOrdersClosed: 14,
    handoffCount: 9,
    aiConfidenceAvg: 0.823,
  },
  recommendations: [
    {
      category: 'Follow-up',
      priority: 'high',
      title: 'ลูกค้า 5 รายรอ follow-up เกิน 48 ชม.',
      description: 'ลูกค้าเหล่านี้มีความเสี่ยงสูงที่จะหายไป ควรส่งข้อความหาพวกเขาวันนี้',
      actionUrl: '/customer',
    },
    {
      category: 'AI',
      priority: 'medium',
      title: 'AI confidence ต่ำใน 3 บทสนทนา',
      description: 'เพิ่ม FAQ เพื่อให้ AI ตอบได้แม่นยำขึ้น และลด handoff rate',
      actionUrl: null,
    },
  ],
}

// ─── Calendar KPI ─────────────────────────────────────────────────────────────

// KpiData interface fields (role-based — return all, frontend picks what it needs)
const CALENDAR_KPI = {
  myRevenue: 71400,
  newOrders: 53,
  unansweredChats: 12,
  aiClosed: 27,
  pendingFollowUps: 8,
  pendingPayment: 28,
  teamRevenue: 456100,
  totalOrders: 345,
  responseRate: 87.3,
  monthRevenue: 1820000,
  slaBreach: 3,
  aiAdoption: 67.9,
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

const CHATBOT_CONFIG = {
  id: 'cb1',
  companyId: COMPANY_ID,
  isEnabled: true,
  name: 'OneBear AI Assistant',
  welcomeMessage: 'สวัสดีครับ/ค่ะ ยินดีให้บริการครับ มีอะไรให้ช่วยได้บ้าง?',
  handoffMessage: 'ขอโทษครับ ขอให้เจ้าหน้าที่ช่วยต่อนะครับ',
  confidenceThreshold: 0.75,
  maxTurns: 10,
  channels: ['LINE', 'Facebook', 'Instagram'],
  credit: { used: 12480, total: 50000, resetAt: new Date(Date.now() + 86400000 * 15).toISOString() },
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const BASE = '/api/v1/companies/:companyId'

// Dev token endpoint
app.post('/api/v1/dev/token', (req, res) => {
  res.json({ token: 'dev-jwt-token', expiresIn: 86400 })
})

// Badge count
app.get(`${BASE}/rooms/badge-count`, (req, res) => {
  res.json({ total: 7, unread: 5, mentioned: 1, followUp: 1 })
})

// Rooms
app.get(`${BASE}/rooms`, (req, res) => {
  const { status, search } = req.query
  let rooms = [...ROOMS]
  if (status) rooms = rooms.filter(r => r.state.toLowerCase() === status.toLowerCase())
  if (search) rooms = rooms.filter(r => r.customerName.toLowerCase().includes(search.toLowerCase()))
  paged(res, rooms, rooms.length)
})

app.get(`${BASE}/rooms/spam`, (req, res) => paged(res, []))

app.get(`${BASE}/rooms/:roomId`, (req, res) => {
  const room = ROOMS.find(r => r.id === req.params.roomId) ?? ROOMS[0]
  res.json(room)
})
app.get(`${BASE}/rooms/:roomId/order`, (req, res) => {
  const order = ORDERS.find(o => o.roomId === req.params.roomId)
  if (!order) return res.status(404).json({ success: false, message: 'No order for this room' })
  res.json(order)
})

app.post(`${BASE}/rooms/search`, (req, res) => paged(res, ROOMS))

// ── Chat state transitions + CRM mapping rules ────────────────────────────────
// Chat Done / Resolve → no CRM effect (agent decides)
app.post(`${BASE}/rooms/:roomId/resolve`, (req, res) => {
  const room = ROOMS.find(r => r.id === req.params.roomId)
  if (room) { room.state = 'Resolved'; room.isResolved = true; room.rtEndTimestamp = Date.now() }
  res.json({ success: true })
})
app.post(`${BASE}/rooms/:roomId/close`, (req, res) => {
  const room = ROOMS.find(r => r.id === req.params.roomId)
  if (room) { room.state = 'Closed' }
  res.json({ success: true })
})
app.post(`${BASE}/rooms/:roomId/done`, (req, res) => {
  const room = ROOMS.find(r => r.id === req.params.roomId)
  if (room) { room.state = 'Resolved'; room.isResolved = true }
  res.json({ success: true })
})
// Reopen / Customer messages again → InProgress
app.post(`${BASE}/rooms/:roomId/reopen`, (req, res) => {
  const room = ROOMS.find(r => r.id === req.params.roomId)
  if (room) { room.state = 'InProgress'; room.isResolved = false }
  res.json({ success: true })
})
// Agent picks up chat → state=InProgress; if Lead & status=New → CRM: New→Contacted
app.post(`${BASE}/rooms/:roomId/assign`, (req, res) => {
  const room = ROOMS.find(r => r.id === req.params.roomId)
  if (room) { room.state = 'InProgress'; room.assignToUserId = req.body.userId ?? 'u1' }
  res.json({ success: true })
})
app.post(`${BASE}/rooms/:roomId/pin`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/rooms/:roomId/pin`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/rooms/:roomId/return-to-ai`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/rooms/:roomId/not-spam`, (req, res) => res.json({ success: true }))
app.put(`${BASE}/rooms/:roomId/follow-up`, (req, res) => res.json({ success: true }))

// Messages
app.get(`${BASE}/rooms/:roomId/messages`, (req, res) => {
  const msgs = MESSAGES[req.params.roomId] ?? []
  paged(res, msgs)
})
app.post(`${BASE}/rooms/:roomId/messages`, (req, res) => {
  const room = ROOMS.find(r => r.id === req.params.roomId)
  // CRM Rule: Customer sends new message to Done/Resolved room → room goes InProgress
  if (room && (room.state === 'Resolved' || room.state === 'Closed') && req.body.senderType === 'Customer') {
    room.state = 'InProgress'
    room.isResolved = false
    room.unreadCount = (room.unreadCount ?? 0) + 1
  }
  if (room) {
    room.lastMessage = req.body.content ?? req.body.text ?? room.lastMessage
    room.lastMessageTimestamp = Date.now()
  }
  const msg = { id: 'm' + Date.now(), roomId: req.params.roomId, senderId: 'dev-user', senderType: 'Agent', senderName: 'Dev User', type: 'Text', platform: room?.platform ?? 'LINE', ...req.body, timestamp: Date.now(), deliveryStatus: 'Delivered' }
  res.json(msg)
})
app.get(`${BASE}/rooms/:roomId/messages/:messageId`, (req, res) => res.json({ id: req.params.messageId }))
app.get(`${BASE}/rooms/:roomId/pinned-messages`, (req, res) => ok(res, []))
app.post(`${BASE}/rooms/:roomId/messages/:messageId/pin`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/rooms/:roomId/messages/:messageId/pin`, (req, res) => res.json({ success: true }))

// Integrations
app.get(`${BASE}/integrations`, (req, res) => ok(res, INTEGRATIONS))
app.get(`${BASE}/integrations/:id`, (req, res) => {
  res.json(INTEGRATIONS.find(i => i.id === req.params.id) ?? INTEGRATIONS[0])
})
app.post(`${BASE}/integrations/:platform`, (req, res) => res.json({ id: 'i-new', platform: req.params.platform, ...req.body }))
app.put(`${BASE}/integrations/:id`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/integrations/:id`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/integrations/:id/greetings`, (req, res) => ok(res, []))
app.put(`${BASE}/integrations/:id/greetings`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/integrations/:id/auto-replies`, (req, res) => ok(res, []))
app.put(`${BASE}/integrations/:id/auto-replies`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/integrations/:id/auto-assignment`, (req, res) => res.json({ mode: 'RoundRobin', isEnabled: true }))
app.put(`${BASE}/integrations/:id/auto-assignment`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/integrations/:id/shortcuts`, (req, res) => ok(res, [{ id: 'sc1', keyword: '/discount', message: 'ส่วนลด 10% สำหรับลูกค้าใหม่ครับ' }]))
app.post(`${BASE}/integrations/:id/shortcuts`, (req, res) => res.json({ id: 'sc-new', ...req.body }))
app.put(`${BASE}/integrations/:id/shortcuts/:scId`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/integrations/:id/shortcuts/:scId`, (req, res) => res.json({ success: true }))
app.put(`${BASE}/integrations/:id/categories/:catId`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/integrations/:id/categories/:catId`, (req, res) => res.json({ success: true }))

// Users
app.get(`${BASE}/users/me`, (req, res) => {
  res.json(USERS.find(u => u.id === 'dev-user'))
})
app.get(`${BASE}/users/me/notifications`, (req, res) => res.json({ email: true, push: true, mentions: true }))
app.put(`${BASE}/users/me/notifications`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/users`, (req, res) => ok(res, USERS))

// Members
app.get(`${BASE}/members`, (req, res) => ok(res, MEMBERS))
app.post(`${BASE}/members`, (req, res) => res.json({ id: 'm-new', ...req.body }))
app.put(`${BASE}/members/:id`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/members/:id`, (req, res) => res.json({ success: true }))

// Roles
app.get(`${BASE}/roles`, (req, res) => ok(res, ROLES))
app.post(`${BASE}/roles`, (req, res) => res.json({ id: 'role-new', ...req.body }))
app.put(`${BASE}/roles/:id`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/roles/:id`, (req, res) => res.json({ success: true }))

// Prospects mock data
const PROSPECTS = [
  { id: 'pr1', name: 'อารีย์ สุขใจ', phone: '086-111-2233', email: null, channels: [{ platform: 'LINE', displayName: 'ary_sukjai' }], status: 'New', lastMessagePreview: 'สวัสดีค่ะ สนใจสินค้า', lastActivityTimestamp: Date.now() - 300000, assignedAgentId: null, assignedAgentName: null, tags: [], createdTimestamp: Date.now() - 3600000 },
  { id: 'pr2', name: 'Tanawat K.', phone: null, email: 'tanawat@email.com', channels: [{ platform: 'Facebook', displayName: 'Tanawat K.' }], status: 'Contacted', lastMessagePreview: 'ราคาเท่าไรครับ?', lastActivityTimestamp: Date.now() - 1800000, assignedAgentId: 'u1', assignedAgentName: 'สมชาย ใจดี', tags: [], createdTimestamp: Date.now() - 7200000 },
  { id: 'pr3', name: 'ปิยะ วงศ์ดี', phone: '089-333-4455', email: null, channels: [{ platform: 'Instagram', displayName: 'piyawong_d' }], status: 'Interested', lastMessagePreview: 'อยากสั่งซื้อค่ะ มีส่วนลดไหม', lastActivityTimestamp: Date.now() - 3600000, assignedAgentId: 'u1', assignedAgentName: 'สมชาย ใจดี', tags: [{ name: 'สนใจ', isAiAssigned: true }], createdTimestamp: Date.now() - 86400000 },
  { id: 'pr4', name: 'Somsri T.', phone: '081-555-6677', email: null, channels: [{ platform: 'LINE', displayName: 'somsri_t' }], status: 'Followed-up', lastMessagePreview: 'ติดต่อกลับหน่อยนะคะ', lastActivityTimestamp: Date.now() - 86400000, assignedAgentId: 'u2', assignedAgentName: 'วิไล รักษา', tags: [], createdTimestamp: Date.now() - 86400000 * 2 },
  { id: 'pr5', name: 'นคร เพชรดี', phone: null, email: 'nakorn@email.com', channels: [{ platform: 'WhatsApp', displayName: 'Nakorn' }], status: 'Not Interested', lastMessagePreview: 'ขอบคุณครับ ไม่สนใจแล้ว', lastActivityTimestamp: Date.now() - 86400000 * 3, assignedAgentId: null, assignedAgentName: null, tags: [], createdTimestamp: Date.now() - 86400000 * 5 },
  { id: 'pr6', name: 'มาลี ดอกไม้', phone: '083-777-8899', email: null, channels: [{ platform: 'LINE', displayName: 'mali_flower' }], status: 'New', lastMessagePreview: 'สินค้ามีสีอะไรบ้างคะ?', lastActivityTimestamp: Date.now() - 600000, assignedAgentId: null, assignedAgentName: null, tags: [], createdTimestamp: Date.now() - 1800000 },
  { id: 'pr7', name: 'Krit N.', phone: '087-000-1234', email: null, channels: [{ platform: 'Facebook', displayName: 'Krit N.' }], status: 'Contacted', lastMessagePreview: 'ขอบคุณสำหรับข้อมูลครับ', lastActivityTimestamp: Date.now() - 10800000, assignedAgentId: 'u2', assignedAgentName: 'วิไล รักษา', tags: [], createdTimestamp: Date.now() - 86400000 },
]

// Customers
app.get(`${BASE}/customers`, (req, res) => {
  const { search, segment } = req.query
  let custs = [...CUSTOMERS]
  if (search) custs = custs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  if (segment && segment !== 'All') custs = custs.filter(c => {
    if (segment === 'VIP') return c.tags.some(t => t.name === 'VIP')
    if (segment === 'NeedsAttention') return c.isAtRisk
    if (segment === 'Repeat') return c.orderCount >= 3
    if (segment === 'New') return c.orderCount <= 1
    if (segment === 'Churned') return c.daysSinceLastPurchase > 60
    return true
  })
  paged(res, custs)
})

// Prospects
app.get(`${BASE}/prospects`, (req, res) => {
  const { status } = req.query
  let prospects = [...PROSPECTS]
  if (status && status !== 'All') prospects = prospects.filter(p => p.status === status)
  paged(res, prospects)
})
app.get(`${BASE}/prospects/counts`, (req, res) => {
  const counts = { All: PROSPECTS.length, New: 0, Contacted: 0, Interested: 0, 'Followed-up': 0, 'Not Interested': 0 }
  PROSPECTS.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++ })
  res.json(counts)
})
app.patch(`${BASE}/prospects/:id/status`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/prospects/:id/convert`, (req, res) => res.json({ success: true, customerId: 'c-new' }))
app.get(`${BASE}/customers/segment-counts`, (req, res) => {
  res.json({
    all: CUSTOMERS.length,
    hot: 2,
    vip: 1,
    atRisk: 1,
    new: 2,
    cold: 1,
    organization: 0,
    repeat: 3,
    churned: 1,
    needsAttention: 1,
  })
})
app.get(`${BASE}/customers/kpi-snapshot`, (req, res) => {
  // Must match KpiSnapshot interface: { totalCustomers, atRiskCount, hotCount, newThisWeek, totalLtv, alertMessage }
  res.json({ totalCustomers: 5, atRiskCount: 1, hotCount: 2, newThisWeek: 2, totalLtv: 40800, alertMessage: null })
})
app.get(`${BASE}/customers/check-duplicate`, (req, res) => res.json({ duplicates: [] }))
app.get(`${BASE}/customers/:id`, (req, res) => {
  res.json(CUSTOMERS.find(c => c.id === req.params.id) ?? CUSTOMERS[0])
})
app.get(`${BASE}/customers/:id/contacts`, (req, res) => ok(res, []))
app.get(`${BASE}/customers/:id/activity`, (req, res) => paged(res, []))
app.post(`${BASE}/customers`, (req, res) => res.json({ id: 'c-new', ...req.body }))
app.put(`${BASE}/customers/:id`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/customers/:id`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/customers/:id/tags`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/customers/:id/tags/:tag`, (req, res) => res.json({ success: true }))
app.put(`${BASE}/customers/:id/pinned-note`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/customers/:id/pinned-note`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/customers/:id/promote`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/customers/:id/contacts`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/customers/:id/contacts/:cid`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/customers/bulk-followup`, (req, res) => res.json({ success: true, sent: req.body?.customerIds?.length ?? 0 }))
app.post(`${BASE}/customers/:id/snooze`, (req, res) => res.json({ success: true }))

// Company / Feature settings
app.get(`${BASE}/profile`, (req, res) => {
  res.json({ id: req.params.companyId, name: 'OneBear Shop', timezone: 'Asia/Bangkok', currency: 'THB', logoUrl: null })
})
app.put(`${BASE}/profile`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/feature-settings`, (req, res) => {
  res.json({ followUpEnabled: true, bookingsEnabled: true, slipVerificationEnabled: true, aiAgentEnabled: true })
})

// Products
app.get(`${BASE}/products`, (req, res) => {
  const { search, categoryName, isActive } = req.query
  let prods = [...PRODUCTS]
  if (search) prods = prods.filter(p => p.name.includes(search))
  if (categoryName) prods = prods.filter(p => p.categoryName === categoryName)
  if (isActive !== undefined) prods = prods.filter(p => p.isActive === (isActive === 'true'))
  paged(res, prods)
})
app.get(`${BASE}/products/categories`, (req, res) => {
  // api-client auto-unwraps { data: array } when no continuationToken/hasMore
  res.json({ data: [...new Set(PRODUCTS.map(p => p.category))] })
})
app.get(`${BASE}/products/:id`, (req, res) => {
  res.json(PRODUCTS.find(p => p.id === req.params.id) ?? PRODUCTS[0])
})
app.post(`${BASE}/products`, (req, res) => res.json({ id: 'p-new', ...req.body, createdAt: Date.now() }))
app.put(`${BASE}/products/:id`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/products/:id`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/products/import`, (req, res) => res.json({ imported: 0, errors: [] }))

// Orders
app.get(`${BASE}/orders`, (req, res) => {
  const { status } = req.query
  let orders = [...ORDERS]
  if (status) orders = orders.filter(o => o.status === status)
  paged(res, orders)
})
app.get(`${BASE}/orders/summary`, (req, res) => {
  // Must match OrderSummary: { totalOrders, newOrders, pendingPayment, pendingVerify, completed, cancelled, todayRevenue }
  res.json({ totalOrders: 3, newOrders: 1, pendingPayment: 1, pendingVerify: 0, completed: 1, cancelled: 0, todayRevenue: 71400 })
})
app.get(`${BASE}/orders/:id`, (req, res) => {
  res.json(ORDERS.find(o => o.id === req.params.id) ?? ORDERS[0])
})
app.post(`${BASE}/orders`, (req, res) => res.json({ id: 'o-new', orderNumber: 'OB-999', ...req.body, status: 'PendingPayment', createdAt: Date.now() }))
app.put(`${BASE}/orders/:id/status`, (req, res) => res.json({ success: true }))

// Slips
app.get(`${BASE}/slips/pending`, (req, res) => ok(res, []))
app.get(`${BASE}/slips/order/:orderId`, (req, res) => res.json({ slip: null }))
app.post(`${BASE}/slips`, (req, res) => res.json({ id: 'sl-new', status: 'Pending', ...req.body }))
app.put(`${BASE}/slips/:id/review`, (req, res) => res.json({ success: true }))

// Follow-ups
app.get(`${BASE}/follow-ups`, (req, res) => {
  const { status } = req.query
  let fups = [...FOLLOW_UPS]
  if (status) fups = fups.filter(f => f.status === status)
  paged(res, fups)
})
app.post(`${BASE}/follow-ups`, (req, res) => res.json({ id: 'f-new', ...req.body, status: 'Queued' }))
app.patch(`${BASE}/follow-ups/:id/status`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/follow-ups/templates`, (req, res) => ok(res, []))

// Bookings
app.get(`${BASE}/bookings`, (req, res) => paged(res, BOOKINGS))
app.get(`${BASE}/bookings/services`, (req, res) => ok(res, BOOKING_SERVICES))
app.get(`${BASE}/bookings/:id`, (req, res) => res.json(BOOKINGS.find(b => b.id === req.params.id) ?? BOOKINGS[0]))
app.post(`${BASE}/bookings`, (req, res) => res.json({ id: 'b-new', ...req.body, status: 'Pending', createdAt: Date.now() }))
app.put(`${BASE}/bookings/:id/status`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/bookings/services`, (req, res) => res.json({ id: 's-new', ...req.body }))

// Calendar KPI
app.get(`${BASE}/calendar/kpi`, (req, res) => res.json(CALENDAR_KPI))
app.get(`${BASE}/calendar/revenue`, (req, res) => {
  const { year, month } = req.query
  const y = parseInt(year) || new Date().getFullYear()
  const m = parseInt(month) || (new Date().getMonth() + 1)
  const daysInMonth = new Date(y, m, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    revenue: rand(15000, 95000),
  }))
  ok(res, days)
})

// Dashboard
app.get(`${BASE}/dashboard`, (req, res) => {
  const { from, to } = req.query
  res.json(generateDashboardData(from, to))
})

// AI Agent
app.get(`${BASE}/ai-agent/config`, (req, res) => {
  res.json({ isEnabled: true, name: 'OneBear AI', confidenceThreshold: 0.75, channels: ['LINE', 'Facebook'], maxTurns: 10 })
})
app.patch(`${BASE}/ai-agent/config`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/ai-agent/stats`, (req, res) => {
  res.json({ handledTotal: 914, handledToday: 131, handoffCount: 3, automationRate: 0.679, avgConfidence: 0.82, timeSavedHours: 4.2 })
})
app.get(`${BASE}/ai-agent/handoff-queue`, (req, res) => ok(res, [
  { id: 'hq1', customerName: 'Jane Smith', channel: 'LINE', reason: 'ลูกค้าขอคนช่วย', waitMin: 2, roomId: 'r2' },
  { id: 'hq2', customerName: 'John Doe', channel: 'Facebook', reason: 'ไม่เข้าใจคำถาม', waitMin: 5, roomId: null },
]))
app.get(`${BASE}/ai-agent/conversations/recent`, (req, res) => ok(res, []))

// Chatbot
app.get(`${BASE}/chatbot/configuration`, (req, res) => res.json(CHATBOT_CONFIG))
app.put(`${BASE}/chatbot/configuration`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/chatbot/knowledge-sources`, (req, res) => ok(res, []))
app.post(`${BASE}/chatbot/knowledge-sources`, (req, res) => res.json({ id: 'ks-new', ...req.body }))
app.delete(`${BASE}/chatbot/knowledge-sources/:id`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/chatbot/faq`, (req, res) => ok(res, [
  { id: 'faq1', question: 'สินค้าของคุณมีอะไรบ้าง?', answer: 'มีครีมบำรุง เซรั่ม มาส์ก และโลชั่นครับ' },
  { id: 'faq2', question: 'ส่งฟรีไหม?', answer: 'ส่งฟรีเมื่อซื้อครบ 999 บาทครับ' },
]))
app.post(`${BASE}/chatbot/faq`, (req, res) => res.json({ id: 'faq-new', ...req.body }))
app.put(`${BASE}/chatbot/faq/:id`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/chatbot/faq/:id`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/chatbot/faq/import-csv`, (req, res) => res.json({ imported: 0, errors: [] }))
app.post(`${BASE}/chatbot/test`, (req, res) => {
  res.json({ response: 'ขอบคุณที่ถามครับ ฉันคือ AI Assistant ของ OneBear ยินดีช่วยเหลือคุณครับ', confidence: 0.87, matched: true })
})
app.get(`${BASE}/chatbot/insights/unanswered`, (req, res) => ok(res, []))
app.post(`${BASE}/chatbot/insights/:id/add-to-faq`, (req, res) => res.json({ success: true }))
app.delete(`${BASE}/chatbot/insights/:id`, (req, res) => res.json({ success: true }))
app.get(`${BASE}/chatbot/credit`, (req, res) => res.json({ used: 12480, total: 50000, resetAt: new Date(Date.now() + 86400000 * 15).toISOString() }))
app.post(`${BASE}/chatbot/credit/topup`, (req, res) => res.json({ success: true }))

// Insights (AI Data Analyst)
app.get(`${BASE}/insights/daily`, (req, res) => res.json(DAILY_INSIGHTS))

// Onboarding
app.get(`${BASE}/onboarding`, (req, res) => {
  res.json({ currentStep: 3, isComplete: true, channels: [], hasProducts: true })
})
app.post(`${BASE}/onboarding/channels`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/onboarding/advance-step2`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/onboarding/complete-step2`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/onboarding/dismiss-tutorial`, (req, res) => res.json({ success: true }))

// OAuth
app.get(`${BASE}/oauth/:platform/auth-url`, (req, res) => {
  res.json({ url: `https://auth.example.com/${req.params.platform}?state=mock-state` })
})
app.post(`${BASE}/oauth/:platform/callback`, (req, res) => res.json({ success: true, channelId: 'ch-mock' }))
app.post(`${BASE}/oauth/facebook/token`, (req, res) => res.json({ success: true }))
app.post(`${BASE}/oauth/whatsapp/token`, (req, res) => res.json({ success: true }))

// SignalR hub negotiate — only offer WebSockets (not LongPolling).
// WebSockets will fail to connect (no WS server), and SignalR will retry
// with exponential backoff (0,1,2,5,10,30s) — no tight polling loop.
app.post('/hubs/chat/negotiate', (req, res) => {
  res.json({
    negotiateVersion: 1,
    connectionId: 'mock-conn-' + Date.now(),
    connectionToken: 'mock-token-' + Date.now(),
    availableTransports: [
      { transport: 'WebSockets', transferFormats: ['Text', 'Binary'] },
    ],
  })
})

// 404 fallback
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.url}`)
  res.status(404).json({ error: 'Not found', path: req.url })
})

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = 5000
app.listen(PORT, () => {
  console.log(`✅  OneBear Mock API running on http://localhost:${PORT}`)
  console.log(`    Proxied via Vite at http://localhost:5173/api/v1/...`)
  console.log(`    Endpoints: rooms, messages, customers, products, orders, dashboard, insights...`)
})
