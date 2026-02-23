import { createFileRoute } from '@tanstack/react-router'
import { EventStats } from '@/features/stats/event-stats'

export const Route = createFileRoute('/_auth/stats/events')({
  component: EventStats,
})
