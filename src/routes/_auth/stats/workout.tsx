import { createFileRoute } from '@tanstack/react-router'
import { WorkoutStats } from '@/features/stats/workout-stats'

export const Route = createFileRoute('/_auth/stats/workout')({
  component: WorkoutStats,
})
