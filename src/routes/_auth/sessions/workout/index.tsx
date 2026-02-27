import { createFileRoute } from '@tanstack/react-router'
import { WorkoutPage } from '@/features/sessions/workout/workout-page'

export const Route = createFileRoute('/_auth/sessions/workout/')({
  component: WorkoutPage,
})
