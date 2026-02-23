import { createFileRoute } from '@tanstack/react-router'
import { CardioSessionPage } from '@/features/sessions/cardio/cardio-session-page'

export const Route = createFileRoute('/_auth/sessions/cardio')({
  component: CardioSessionPage,
})
