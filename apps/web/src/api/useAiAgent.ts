import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiAgentConfig {
  isEnabled: boolean
  confidenceThreshold: number
  tone: 'casual' | 'formal' | 'cute'
  autoHandoffEnabled: boolean
}

export interface ChannelAiConfig {
  channelId: string
  platform: 'LINE' | 'Facebook' | 'Instagram' | 'WhatsApp'
  channelName: string
  aiEnabled: boolean
  overrideGlobal: boolean
  confidenceThreshold: number
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string
  updatedAt: number
}

export interface AiAgentStats {
  chatsHandledToday: number
  handoffRate: number
  avgConfidenceScore: number
  totalChatsToday: number
}

export interface HandoffQueueItem {
  id: string
  roomId: string
  customerName: string
  channelPlatform: string
  handoffReason: string
  confidenceScore: number
  waitingSince: number
}

export interface RecentAiConversation {
  id: string
  roomId: string
  customerName: string
  channelPlatform: string
  confidenceScore: number
  resolved: boolean
  startedAt: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAiAgentConfig() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['ai-agent-config', companyId],
    queryFn: () => api.aiAgent.getConfig(companyId!) as Promise<AiAgentConfig>,
    enabled: !!companyId,
    staleTime: 30_000,
  })
}

export function useUpdateAiAgentConfig() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Partial<AiAgentConfig>) => api.aiAgent.updateConfig(companyId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-config'] })
    },
  })
}

export function useAiAgentStats() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['ai-agent-stats', companyId],
    queryFn: () => api.aiAgent.getStats(companyId!) as Promise<AiAgentStats>,
    enabled: !!companyId,
    staleTime: 30_000,
  })
}

export function useAiHandoffQueue() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['ai-handoff-queue', companyId],
    queryFn: () => api.aiAgent.getHandoffQueue(companyId!) as Promise<HandoffQueueItem[]>,
    enabled: !!companyId,
    refetchInterval: 30_000,
  })
}

export function useRecentAiConversations() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['ai-recent-conversations', companyId],
    queryFn: () => api.aiAgent.getRecentConversations(companyId!) as Promise<RecentAiConversation[]>,
    enabled: !!companyId,
    staleTime: 60_000,
  })
}
