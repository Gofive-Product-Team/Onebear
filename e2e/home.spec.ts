import { test, expect } from '@playwright/test'

test('homepage shows One Bear title', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator('h1')).toContainText('One Bear Platform')
})

test('navigation links are visible', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByText('Chat')).toBeVisible()
	await expect(page.getByText('Dashboard')).toBeVisible()
	await expect(page.getByText('Settings')).toBeVisible()
})

test('chat page shows TODO placeholder', async ({ page }) => {
	await page.goto('/chat')
	await expect(page.locator('h1')).toContainText('TODO: Chat')
})
