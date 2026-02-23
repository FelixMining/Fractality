import { createFileRoute } from '@tanstack/react-router'
import { WorkStats } from '@/features/stats/work-stats'

export const Route = createFileRoute('/_auth/stats/work')({
  component: WorkStats,
})
