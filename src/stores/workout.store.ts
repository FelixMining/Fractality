import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WorkoutSession } from '@/schemas/workout-session.schema'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'
import type { PainNote } from '@/schemas/pain-note.schema'
import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutSeriesRepository } from '@/lib/db/repositories/workout-series.repository'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { painNoteRepository } from '@/lib/db/repositories/pain-note.repository'
import { supabase } from '@/lib/supabase/client'

interface ExerciseWithSeries {
  exercise: WorkoutExercise
  series: WorkoutSeries[]
}

interface WorkoutState {
  // État séance en cours
  activeSession: WorkoutSession | null
  currentExerciseIndex: number
  exercises: ExerciseWithSeries[]
  painNotes: PainNote[]

  // Timer
  elapsedTime: number
  isTimerRunning: boolean
  isPaused: boolean

  // Actions séance
  startSession: (sessionId: string, exercises: ExerciseWithSeries[]) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => Promise<void>
  abandonSession: () => Promise<void>

  // Actions navigation
  nextExercise: () => void
  previousExercise: () => void

  // Actions exercices
  addExerciseToSession: (exerciseId: string) => Promise<void>
  removeExerciseFromSession: (exerciseIndex: number) => void

  // Actions séries
  addSeries: (exerciseIndex: number) => Promise<void>
  updateSeries: (
    exerciseIndex: number,
    seriesIndex: number,
    data: Partial<WorkoutSeries>,
  ) => void
  deleteSeries: (exerciseIndex: number, seriesIndex: number) => void
  completeSeries: (exerciseIndex: number, seriesIndex: number) => Promise<void>

  // Actions notes de douleur
  addPainNote: (
    exerciseIndex: number,
    painNote: Omit<PainNote, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
  ) => Promise<void>
  removePainNote: (painNoteId: string) => Promise<void>

  // Reset
  resetStore: () => void
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    immer((set, get) => ({
      activeSession: null,
      currentExerciseIndex: 0,
      exercises: [],
      painNotes: [],
      elapsedTime: 0,
      isTimerRunning: false,
      isPaused: false,

      startSession: (sessionId, exercises) => {
        set((state) => {
          // Store minimal session info - full session loaded from DB when needed
          state.activeSession = { id: sessionId } as WorkoutSession
          state.exercises = exercises
          state.currentExerciseIndex = 0
          state.elapsedTime = 0
          state.isTimerRunning = true
          state.isPaused = false
        })
      },

      pauseSession: () => {
        set((state) => {
          state.isTimerRunning = false
          state.isPaused = true
        })
      },

      resumeSession: () => {
        set((state) => {
          state.isTimerRunning = true
          state.isPaused = false
        })
      },

      completeSession: async () => {
        const { activeSession } = get()
        if (!activeSession) return

        await workoutSessionRepository.completeSession(activeSession.id)
        set((state) => {
          state.activeSession = null
          state.isTimerRunning = false
        })
      },

      abandonSession: async () => {
        const { activeSession } = get()
        if (!activeSession) return

        await workoutSessionRepository.update(activeSession.id, {
          status: 'abandoned',
        })
        get().resetStore()
      },

      nextExercise: () => {
        set((state) => {
          if (state.currentExerciseIndex < state.exercises.length - 1) {
            state.currentExerciseIndex++
          }
        })
      },

      previousExercise: () => {
        set((state) => {
          if (state.currentExerciseIndex > 0) {
            state.currentExerciseIndex--
          }
        })
      },

      addSeries: async (exerciseIndex) => {
        // Get userId first
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        set((state) => {
          const exercise = state.exercises[exerciseIndex]
          const lastSeries = exercise.series[exercise.series.length - 1]

          const newSeries: WorkoutSeries = {
            id: crypto.randomUUID(),
            userId: user.id,
            sessionId: state.activeSession!.id,
            exerciseId: exercise.exercise.id,
            order: exercise.series.length,
            reps: lastSeries?.reps || 10,
            weight: lastSeries?.weight || 0,
            restTime: lastSeries?.restTime || 90,
            rpe: lastSeries?.rpe,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
            deletedAt: null,
          }

          exercise.series.push(newSeries)
        })
      },

      updateSeries: (exerciseIndex, seriesIndex, data) => {
        set((state) => {
          Object.assign(state.exercises[exerciseIndex].series[seriesIndex], data)
        })
      },

      deleteSeries: (exerciseIndex, seriesIndex) => {
        set((state) => {
          state.exercises[exerciseIndex].series.splice(seriesIndex, 1)
        })
      },

      completeSeries: async (exerciseIndex, seriesIndex) => {
        const series = get().exercises[exerciseIndex].series[seriesIndex]

        // Validation: reps doit être >= 1
        if (series.reps < 1) {
          throw new Error('Nombre de répétitions invalide (minimum 1)')
        }

        // Obtenir userId actuel
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Sauvegarder la série dans IndexedDB
        const seriesToSave = { ...series, userId: user.id, completed: true }

        // Vérifier si la série existe déjà, puis update ou create
        const existing = await workoutSeriesRepository.getById(series.id)

        try {
          if (existing) {
            await workoutSeriesRepository.update(series.id, {
              ...seriesToSave,
            })
          } else {
            await workoutSeriesRepository.create({
              ...seriesToSave,
            } as Omit<WorkoutSeries, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>)
          }
        } catch (error) {
          console.error('Failed to save series to IndexedDB:', error)
          throw error
        }

        // Mettre à jour le store
        set((state) => {
          state.exercises[exerciseIndex].series[seriesIndex].completed = true
          state.exercises[exerciseIndex].series[seriesIndex].userId = user.id
        })
      },

      addExerciseToSession: async (exerciseId) => {
        const { activeSession } = get()
        if (!activeSession) return

        // Charger l'exercice depuis la bibliothèque
        const exercise = await workoutExerciseRepository.getById(exerciseId)
        if (!exercise) return

        // Obtenir userId actuel
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        set((state) => {
          // Ajouter l'exercice avec une série vierge par défaut
          state.exercises.push({
            exercise,
            series: [
              {
                id: crypto.randomUUID(),
                userId: user.id,
                sessionId: activeSession.id,
                exerciseId: exercise.id,
                order: 0,
                reps: 10,
                weight: 0,
                restTime: 90,
                rpe: undefined,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false,
                deletedAt: null,
              },
            ],
          })
        })
      },

      removeExerciseFromSession: (exerciseIndex) => {
        set((state) => {
          // Retirer l'exercice de la séance en cours
          state.exercises.splice(exerciseIndex, 1)

          // Ajuster currentExerciseIndex si nécessaire
          if (state.currentExerciseIndex >= state.exercises.length) {
            state.currentExerciseIndex = Math.max(0, state.exercises.length - 1)
          }
        })
      },

      addPainNote: async (exerciseIndex, painNoteData) => {
        const { exercises, activeSession } = get()
        if (!activeSession) return

        const exercise = exercises[exerciseIndex]
        if (!exercise) return

        // Obtenir userId actuel
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const painNote: PainNote = {
          ...painNoteData,
          id: crypto.randomUUID(),
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
          deletedAt: null,
        }

        // Persister immédiatement dans IndexedDB
        await painNoteRepository.create(painNote)

        set((state) => {
          state.painNotes.push(painNote)
        })
      },

      removePainNote: async (painNoteId) => {
        await painNoteRepository.softDelete(painNoteId)

        set((state) => {
          const index = state.painNotes.findIndex((n) => n.id === painNoteId)
          if (index !== -1) {
            state.painNotes.splice(index, 1)
          }
        })
      },

      resetStore: () => {
        set({
          activeSession: null,
          currentExerciseIndex: 0,
          exercises: [],
          painNotes: [],
          elapsedTime: 0,
          isTimerRunning: false,
          isPaused: false,
        })
      },
    })),
    {
      name: 'fractality-workout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSession: state.activeSession,
        currentExerciseIndex: state.currentExerciseIndex,
        elapsedTime: state.elapsedTime,
      }),
    },
  ),
)
