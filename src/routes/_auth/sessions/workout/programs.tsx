import { createFileRoute } from '@tanstack/react-router'
import { ProgramsPage } from '@/features/sessions/workout/programs-page'

/**
 * Route TanStack Router pour la liste des programmes d'entraînement.
 * URL: /sessions/workout/programs
 * Respecte AC1: "accès à la liste des programmes".
 * Story 3.2 : Programmes et séances-types
 */
export const Route = createFileRoute('/_auth/sessions/workout/programs')({
  component: () => <ProgramsPage />,
})
