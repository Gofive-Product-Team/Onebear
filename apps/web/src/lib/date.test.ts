import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeTime, formatTime, formatDate, formatDateSeparator } from './date'

describe('date utilities', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	describe('formatRelativeTime', () => {
		it('should return "just now" for dates less than a minute ago', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T12:00:30Z'))
			expect(formatRelativeTime('2024-01-15T12:00:00Z')).toBe('just now')
		})

		it('should return minutes ago for dates less than an hour ago', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T12:05:00Z'))
			expect(formatRelativeTime('2024-01-15T12:00:00Z')).toBe('5m ago')
		})

		it('should return hours ago for dates less than a day ago', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T15:00:00Z'))
			expect(formatRelativeTime('2024-01-15T12:00:00Z')).toBe('3h ago')
		})

		it('should return days ago for dates less than a week ago', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-18T12:00:00Z'))
			expect(formatRelativeTime('2024-01-15T12:00:00Z')).toBe('3d ago')
		})

		it('should return formatted date for dates a week or more ago', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-25T12:00:00Z'))
			const result = formatRelativeTime('2024-01-15T12:00:00Z')
			// toLocaleDateString() output varies by locale, just check it's not a relative format
			expect(result).not.toContain('ago')
			expect(result).not.toBe('just now')
		})

		it('should handle edge case of exactly 1 minute', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T12:01:00Z'))
			expect(formatRelativeTime('2024-01-15T12:00:00Z')).toBe('1m ago')
		})

		it('should handle edge case of exactly 1 hour', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T13:00:00Z'))
			expect(formatRelativeTime('2024-01-15T12:00:00Z')).toBe('1h ago')
		})

		it('should handle edge case of exactly 1 day', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-16T12:00:00Z'))
			expect(formatRelativeTime('2024-01-15T12:00:00Z')).toBe('1d ago')
		})
	})

	describe('formatTime', () => {
		it('should return a time string with hours and minutes', () => {
			const result = formatTime('2024-01-15T14:30:00Z')
			// Output depends on locale and timezone, but should contain hour/minute
			expect(result).toBeTruthy()
			expect(typeof result).toBe('string')
			// Should contain a colon separating hours and minutes
			expect(result).toContain(':')
		})

		it('should format different times correctly', () => {
			const morning = formatTime('2024-01-15T08:05:00Z')
			const evening = formatTime('2024-01-15T20:45:00Z')
			expect(morning).toBeTruthy()
			expect(evening).toBeTruthy()
			// Both should be non-empty time strings
			expect(morning.length).toBeGreaterThan(0)
			expect(evening.length).toBeGreaterThan(0)
		})
	})

	describe('formatDate', () => {
		it('should return date in "Jan 15, 2024" format', () => {
			// Use a UTC noon time to avoid timezone-boundary issues
			const result = formatDate('2024-01-15T12:00:00Z')
			// en-US locale: "Jan 15, 2024"
			expect(result).toMatch(/Jan\s+15,\s+2024/)
		})

		it('should format different months correctly', () => {
			expect(formatDate('2024-07-04T12:00:00Z')).toMatch(/Jul\s+4,\s+2024/)
			expect(formatDate('2024-12-25T12:00:00Z')).toMatch(/Dec\s+25,\s+2024/)
		})
	})

	describe('formatDateSeparator', () => {
		afterEach(() => {
			vi.useRealTimers()
		})

		it('should return "Today" when the date is today', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T10:00:00'))
			expect(formatDateSeparator('2024-01-15T08:00:00')).toBe('Today')
		})

		it('should return "Yesterday" when the date is yesterday', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T10:00:00'))
			expect(formatDateSeparator('2024-01-14T23:00:00')).toBe('Yesterday')
		})

		it('should return weekday name for dates 2-6 days ago', () => {
			vi.useFakeTimers()
			// 2024-01-15 is a Monday; 3 days ago is Friday 2024-01-12
			vi.setSystemTime(new Date('2024-01-15T10:00:00'))
			const result = formatDateSeparator('2024-01-12T10:00:00')
			expect(result).toBe('Friday')
		})

		it('should return formatted date for dates 7 or more days ago', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-01-15T10:00:00'))
			// 8 days ago
			const result = formatDateSeparator('2024-01-07T12:00:00')
			expect(result).toMatch(/Jan\s+7,\s+2024/)
		})

		it('should return "Today" when the date is later the same day', () => {
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-03-10T22:00:00'))
			expect(formatDateSeparator('2024-03-10T06:00:00')).toBe('Today')
		})
	})
})
