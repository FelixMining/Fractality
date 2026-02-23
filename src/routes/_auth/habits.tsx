import { createFileRoute } from '@tanstack/react-router'
import { HabitsPage } from '@/features/habits/habits-page'

export const Route = createFileRoute('/_auth/habits')({
  component: HabitsPage,
})
