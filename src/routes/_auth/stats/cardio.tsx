import { createFileRoute } from '@tanstack/react-router'
import { CardioStats } from '@/features/stats/cardio-stats'

export const Route = createFileRoute('/_auth/stats/cardio')({
  component: CardioStats,
})
