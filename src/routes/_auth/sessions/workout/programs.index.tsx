import { createFileRoute } from '@tanstack/react-router'
import { ProgramsPage } from '@/features/sessions/workout/programs-page'

export const Route = createFileRoute('/_auth/sessions/workout/programs/')({
  component: ProgramsPage,
})
