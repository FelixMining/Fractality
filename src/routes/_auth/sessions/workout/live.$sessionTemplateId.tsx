import { createFileRoute } from '@tanstack/react-router'
import { WorkoutLivePage } from '@/features/sessions/workout/workout-live-page'

/**
 * Route TanStack Router pour la séance de musculation live.
 * URL: /sessions/workout/live/$sessionTemplateId
 * Respecte AC1, AC2, AC3: "lancement séance, saisie temps réel, complétion".
 * Story 3.3 : Séance musculation live
 */
function WorkoutLivePageRoute() {
  const params = Route.useParams() as { sessionTemplateId: string }
  const { sessionTemplateId } = params

  return <WorkoutLivePage sessionTemplateId={sessionTemplateId} />
}

export const Route = createFileRoute(
  '/_auth/sessions/workout/live/$sessionTemplateId',
)({
  component: () => <WorkoutLivePageRoute />,
})
