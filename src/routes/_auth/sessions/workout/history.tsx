import { createFileRoute } from '@tanstack/react-router'
import { WorkoutHistoryPage } from '@/features/sessions/workout/workout-history-page'

/**
 * Route TanStack Router pour l'historique des séances de musculation.
 * URL: /sessions/workout/history
 * Respecte AC1, AC3, AC4 : liste historique, ajout rétroactif, ordre chronologique.
 * Story 3.5 : Modification et création rétroactive de séances
 */
export const Route = createFileRoute('/_auth/sessions/workout/history')({
  component: WorkoutHistoryPage,
})
