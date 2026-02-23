import { createFileRoute } from '@tanstack/react-router'
import { RecurringStats } from '@/features/stats/recurring-stats'

export const Route = createFileRoute('/_auth/stats/recurring')({
  component: RecurringStats,
})
