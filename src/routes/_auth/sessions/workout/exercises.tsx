import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/sessions/workout/exercises')({
  component: lazyRouteComponent(
    () => import('@/features/workout/exercise-library/exercise-library-page'),
    'ExerciseLibraryPage'
  ),
})
