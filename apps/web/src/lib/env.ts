export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  signalRUrl: import.meta.env.VITE_SIGNALR_URL ?? '/hubs/chat',
  environment: import.meta.env.VITE_ENVIRONMENT ?? 'development',
} as const
