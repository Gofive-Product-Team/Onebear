import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FollowUpItem {
  id: string
  customerId: string
  customerName: string
  channelPlatform: string
  scheduledAt: number
  status: 'Queued' | 'Sent' | 'Failed' | 'Stopped'
  templateId: string | null
  message: string
  roomId: string | null
}

export interface FollowUpTemplate {
  id: string
  name: string
  message: string
  platform: string
}

interface FollowUpsResponse {
  data: FollowUpItem[]
  continuationToken: string | null
  hasMore: boolean
}

export interface CreateFollowUpBody {
  customerId: string
  customerName: string
  channelPlatform: string
  scheduledAt: number
  templateId?: string
  message: string
  roomId?: string
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useFollowUps(params?: Record<string, string>) {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['follow-ups', companyId, params],
    queryFn: () => api.followUps.list(companyId!, params) as Promise<FollowUpsResponse>,
    enabled: !!companyId,
  })
}

export function useCreateFollowUp() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateFollowUpBody) => api.followUps.create(companyId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    },
  })
}

export function useUpdateFollowUpStatus() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ followUpId, body }: { followUpId: string; body: { status: string } }) =>
      api.followUps.updateStatus(companyId!, followUpId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    },
  })
}

export function useFollowUpTemplates() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['follow-up-templates', companyId],
    queryFn: () => api.followUps.templates(companyId!) as Promise<FollowUpTemplate[]>,
    enabled: !!companyId,
  })
}
