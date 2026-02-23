import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { WorkoutSessionEditForm } from './workout-session-edit-form'

interface WorkoutSessionEditPageProps {
  sessionId: string
}

/**
 * Page wrapper pour l'édition d'une séance de musculation passée.
 * Reçoit sessionId depuis les params de la route TanStack Router.
 * Respecte AC1 et AC2 : chargement et édition de la séance.
 * Story 3.5 : Modification et création rétroactive de séances
 */
export function WorkoutSessionEditPage({ sessionId }: WorkoutSessionEditPageProps) {
  const navigate = useNavigate()

  const handleBack = useCallback(() => {
    navigate({ to: '/sessions/workout/history' })
  }, [navigate])

  const handleSaved = useCallback(() => {
    navigate({ to: '/sessions/workout/history' })
  }, [navigate])

  return (
    <WorkoutSessionEditForm
      sessionId={sessionId}
      onBack={handleBack}
      onSaved={handleSaved}
    />
  )
}
