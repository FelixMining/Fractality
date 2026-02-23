import { createFileRoute } from '@tanstack/react-router'
import { WorkSessionPage } from '@/features/sessions/work/work-session-page'

export const Route = createFileRoute('/_auth/sessions/work')({
  component: WorkSessionPage,
})
