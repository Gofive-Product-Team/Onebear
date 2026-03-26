import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@one-bear/shared-types': path.resolve(__dirname, '../../libs/shared-types/src'),
			'@one-bear/ui': path.resolve(__dirname, '../../libs/ui/src'),
			'@one-bear/i18n': path.resolve(__dirname, '../../libs/i18n/src'),
			'@one-bear/api-client': path.resolve(__dirname, '../../libs/api-client/src'),
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.ts'],
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.test.*', 'src/**/*.spec.*', 'src/test-setup.ts', 'src/main.tsx'],
		},
	},
})
