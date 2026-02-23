import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutSeriesRepository } from '@/lib/db/repositories/workout-series.repository'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'

export interface PrefillExerciseData {
  exerciseId: string
  defaultSeries: Array<{
    reps: number
    weight?: number
    restTime?: number
    rpe?: number
  }>
}

export interface PrefillData {
  exercises: PrefillExerciseData[]
}

export async function getPrefillDataForSession(
  templateId: string,
  exerciseIds: string[],
): Promise<PrefillData> {
  // Charger la dernière session complétée pour ce template
  const lastSession = await workoutSessionRepository.getLastSessionForTemplate(
    templateId,
  )

  if (!lastSession) {
    // Pas de session précédente, retourner des valeurs par défaut vides
    return {
      exercises: exerciseIds.map((exerciseId) => ({
        exerciseId,
        defaultSeries: [],
      })),
    }
  }

  // Charger toutes les séries de la dernière session
  const allSeries = await workoutSessionRepository.getSessionSeries(lastSession.id)

  // Grouper les séries par exercice
  const seriesByExercise = exerciseIds.map((exerciseId) => {
    const exerciseSeries = allSeries.filter((s) => s.exerciseId === exerciseId)

    return {
      exerciseId,
      defaultSeries: exerciseSeries.map((s) => ({
        reps: s.reps,
        weight: s.weight,
        restTime: s.restTime,
        rpe: s.rpe,
      })),
    }
  })

  return {
    exercises: seriesByExercise,
  }
}

export async function getLastSeriesForExercise(
  sessionId: string,
  exerciseId: string,
): Promise<WorkoutSeries[]> {
  return workoutSeriesRepository.getLastSeriesForExercise(sessionId, exerciseId)
}
