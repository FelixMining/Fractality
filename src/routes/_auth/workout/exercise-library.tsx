import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/workout/exercise-library')({
  component: lazyRouteComponent(
    () => import('@/features/workout/exercise-library/exercise-library-page'),
    'ExerciseLibraryPage'
  ),
})
