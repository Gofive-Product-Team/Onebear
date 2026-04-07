#!/usr/bin/env node
/**
 * Debug SignalR Realtime — Playwright script
 *
 * 1. Opens browser → http://localhost:5173
 * 2. Logs in with dev credentials
 * 3. Navigates to chat room
 * 4. Sends a webhook via API
 * 5. Watches if message appears in realtime (no F5)
 *
 * Usage: node scripts/debug-signalr.mjs
 */

import { chromium } from 'playwright'

const API = 'http://localhost:5000'
const APP = 'http://localhost:5173'
const COMPANY = 'dev-company-001'
const ROOM = 'dev-room-001'

async function main() {
	console.log('🚀 Launching browser...')
	const browser = await chromium.launch({ headless: false, slowMo: 300 })
	const context = await browser.newContext()
	const page = await context.newPage()

	// Collect console logs
	page.on('console', (msg) => {
		const text = msg.text()
		if (text.includes('SignalR') || text.includes('ChatLayout') || text.includes('JoinRoom') || text.includes('useRoomConnection')) {
			console.log(`🖥️  [Browser] ${text}`)
		}
	})

	// Step 1: Navigate to app
	console.log('📱 Opening app...')
	await page.goto(APP)
	await page.waitForTimeout(1000)

	// Step 2: Login
	console.log('🔑 Logging in...')
	// Fill login form
	const userIdInput = page.locator('input[placeholder*="user" i], input[name*="user" i], input').first()
	await userIdInput.fill('dev-user-001')

	const companyIdInput = page.locator('input').nth(1)
	await companyIdInput.fill(COMPANY)

	// Click login button
	const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")')
	await loginBtn.click()
	await page.waitForTimeout(2000)

	// Step 3: Navigate to chat via SPA routing (click sidebar + room)
	console.log('💬 Navigating to chat...')
	// Click Chat nav item in sidebar
	const chatNav = page.locator('a[href="/chat"], button:has-text("Chat"), nav >> text=Chat').first()
	await chatNav.click()
	await page.waitForTimeout(2000)

	// Click first room card in the list
	console.log('🏠 Clicking first room card...')
	const firstRoom = page.locator('button').filter({ hasText: /สมชาย|Anon|Nattaya|Buyer|Ploy|วิชัย/ }).first()
	if (await firstRoom.count() > 0) {
		await firstRoom.click()
	} else {
		// Fallback: click any room card
		const anyRoom = page.locator('[class*="border-b"][class*="border-gray"]').first()
		await anyRoom.click()
	}
	await page.waitForTimeout(3000)

	// Step 4: Check SignalR status
	console.log('📡 Checking SignalR status...')
	const signalrDot = page.locator('[title*="SignalR"]')
	if (await signalrDot.count() > 0) {
		const title = await signalrDot.getAttribute('title')
		const classList = await signalrDot.getAttribute('class')
		const isGreen = classList?.includes('bg-green')
		console.log(`📡 SignalR indicator: ${title} (${isGreen ? '🟢 GREEN' : '🔴 RED'})`)
	} else {
		console.log('⚠️  No SignalR indicator found')
	}

	// Count current messages
	const msgCountBefore = await page.locator('[class*="rounded-2xl"][class*="px-3"]').count()
	console.log(`📨 Messages before webhook: ${msgCountBefore}`)

	// Step 5: Take screenshot BEFORE webhook
	await page.screenshot({ path: '/tmp/signalr-before.png', fullPage: true })
	console.log('📸 Screenshot saved: /tmp/signalr-before.png')

	// Step 6: Send webhook
	console.log('🎯 Sending LINE webhook...')
	const testMessage = `Realtime test ${new Date().toLocaleTimeString()}`
	const webhookBody = JSON.stringify({
		events: [{
			type: 'message',
			replyToken: 'dev-reply-token',
			source: { userId: 'Uf001', type: 'user' },
			timestamp: Date.now(),
			message: {
				id: `test-${Date.now()}`,
				type: 'text',
				text: testMessage,
			},
		}],
	})

	const res = await fetch(`${API}/api/v1/webhooks/line/${COMPANY}/dev-int-line`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Webhook-Dev-Bypass': 'true',
		},
		body: webhookBody,
	})
	console.log(`📤 Webhook response: ${res.status}`)

	// Step 7: Wait and check for realtime update
	console.log('⏳ Waiting 5 seconds for realtime update...')
	await page.waitForTimeout(5000)

	// Count messages after
	const msgCountAfter = await page.locator('[class*="rounded-2xl"][class*="px-3"]').count()
	console.log(`📨 Messages after webhook: ${msgCountAfter}`)

	// Check if the test message appeared
	const testMsgVisible = await page.locator(`text="${testMessage}"`).count()

	if (testMsgVisible > 0) {
		console.log(`✅ REALTIME WORKS! Message "${testMessage}" appeared without refresh!`)
	} else if (msgCountAfter > msgCountBefore) {
		console.log(`⚠️  Message count increased (${msgCountBefore} → ${msgCountAfter}) but test message text not found`)
	} else {
		console.log(`❌ REALTIME NOT WORKING — message count unchanged (${msgCountBefore})`)
		console.log('   Possible causes:')
		console.log('   1. SignalR not connected (check red/green dot)')
		console.log('   2. JoinRooms not called')
		console.log('   3. Event name mismatch')
	}

	// Step 8: Take screenshot AFTER
	await page.screenshot({ path: '/tmp/signalr-after.png', fullPage: true })
	console.log('📸 Screenshot saved: /tmp/signalr-after.png')

	// Step 9: Dump browser console for SignalR logs
	console.log('\n📋 Checking WebSocket connections...')
	const wsInfo = await page.evaluate(() => {
		// Check if signalr connection exists on window
		const perf = performance.getEntriesByType('resource')
			.filter((r) => r.name.includes('hubs/chat') || r.name.includes('negotiate'))
			.map((r) => ({ name: r.name, status: r.responseStatus }))
		return { wsEntries: perf }
	})
	console.log('WebSocket/negotiate entries:', JSON.stringify(wsInfo, null, 2))

	console.log('\n🏁 Done! Browser stays open for manual inspection.')
	console.log('   Press Ctrl+C to close.')

	// Keep browser open
	await new Promise(() => {})
}

main().catch((err) => {
	console.error('❌ Error:', err)
	process.exit(1)
})
