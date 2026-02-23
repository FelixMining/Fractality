import { createFileRoute } from '@tanstack/react-router'
import { WorkoutSessionEditPage } from '@/features/sessions/workout/workout-session-edit-page'

/**
 * Route TanStack Router pour l'édition d'une séance de musculation passée.
 * URL: /sessions/workout/$sessionId/edit
 * Respecte AC1 et AC2 : formulaire pré-rempli, sauvegarde + undo.
 * Story 3.5 : Modification et création rétroactive de séances
 */
function WorkoutSessionEditRoute() {
  const { sessionId } = Route.useParams()
  return <WorkoutSessionEditPage sessionId={sessionId} />
}

export const Route = createFileRoute('/_auth/sessions/workout/$sessionId/edit')({
  component: WorkoutSessionEditRoute,
})
