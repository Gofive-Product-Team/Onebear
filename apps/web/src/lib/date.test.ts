import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeTime, formatTime } from './date'

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
})
