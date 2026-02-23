import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkoutStore } from './workout.store'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'

// Mocks
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
  },
}))

vi.mock('@/lib/db/repositories/workout-exercise.repository', () => ({
  workoutExerciseRepository: {
    getById: vi.fn(),
  },
}))

vi.mock('@/lib/db/repositories/pain-note.repository', () => ({
  painNoteRepository: {
    create: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/db/repositories/workout-session.repository', () => ({
  workoutSessionRepository: {
    completeSession: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/db/repositories/workout-series.repository', () => ({
  workoutSeriesRepository: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

describe('WorkoutStore - Story 3.4 - Actions exercices et notes de douleur', () => {
  beforeEach(() => {
    // Reset store avant chaque test
    useWorkoutStore.getState().resetStore()
    vi.clearAllMocks()
  })

  describe('addExerciseToSession', () => {
    it('devrait ajouter un exercice à la séance en cours', async () => {
      const { workoutExerciseRepository } = await import(
        '@/lib/db/repositories/workout-exercise.repository'
      )

      const mockExercise: WorkoutExercise = {
        id: 'exercise-123',
        userId: 'test-user-id',
        name: 'Développé couché',
        muscleGroup: 'chest',
        description: 'Exercice pour les pectoraux',
        createdAt: '2026-02-17T10:00:00.000Z',
        updatedAt: '2026-02-17T10:00:00.000Z',
        isDeleted: false,
        deletedAt: null,
      }

      vi.mocked(workoutExerciseRepository.getById).mockResolvedValue(mockExercise)

      // Initialiser une séance active
      useWorkoutStore.getState().startSession('session-123', [])

      // Ajouter l'exercice
      await useWorkoutStore.getState().addExerciseToSession('exercise-123')

      const state = useWorkoutStore.getState()

      expect(state.exercises).toHaveLength(1)
      expect(state.exercises[0].exercise).toEqual(mockExercise)
      expect(state.exercises[0].series).toHaveLength(1)
      expect(state.exercises[0].series[0]).toMatchObject({
        userId: 'test-user-id',
        sessionId: 'session-123',
        exerciseId: 'exercise-123',
        order: 0,
        reps: 10,
        weight: 0,
        restTime: 90,
        completed: false,
      })
    })

    it('ne devrait rien faire si aucune séance n\'est active', async () => {
      await useWorkoutStore.getState().addExerciseToSession('exercise-123')

      const state = useWorkoutStore.getState()
      expect(state.exercises).toHaveLength(0)
    })

    it('ne devrait rien faire si l\'exercice n\'existe pas', async () => {
      const { workoutExerciseRepository } = await import(
        '@/lib/db/repositories/workout-exercise.repository'
      )

      vi.mocked(workoutExerciseRepository.getById).mockResolvedValue(undefined)

      useWorkoutStore.getState().startSession('session-123', [])
      await useWorkoutStore.getState().addExerciseToSession('invalid-id')

      const state = useWorkoutStore.getState()
      expect(state.exercises).toHaveLength(0)
    })
  })

  describe('removeExerciseFromSession', () => {
    it('devrait retirer un exercice de la séance en cours', () => {
      const mockExercises = [
        {
          exercise: {
            id: 'ex1',
            name: 'Exercice 1',
          } as WorkoutExercise,
          series: [],
        },
        {
          exercise: {
            id: 'ex2',
            name: 'Exercice 2',
          } as WorkoutExercise,
          series: [],
        },
      ]

      useWorkoutStore.getState().startSession('session-123', mockExercises)

      // Retirer le premier exercice
      useWorkoutStore.getState().removeExerciseFromSession(0)

      const state = useWorkoutStore.getState()
      expect(state.exercises).toHaveLength(1)
      expect(state.exercises[0].exercise.id).toBe('ex2')
    })

    it('devrait ajuster currentExerciseIndex si nécessaire', () => {
      const mockExercises = [
        {
          exercise: { id: 'ex1' } as WorkoutExercise,
          series: [],
        },
        {
          exercise: { id: 'ex2' } as WorkoutExercise,
          series: [],
        },
      ]

      useWorkoutStore.getState().startSession('session-123', mockExercises)

      // Naviguer au deuxième exercice
      useWorkoutStore.getState().nextExercise()
      expect(useWorkoutStore.getState().currentExerciseIndex).toBe(1)

      // Retirer le deuxième exercice
      useWorkoutStore.getState().removeExerciseFromSession(1)

      // L'index devrait être ajusté à 0
      const state = useWorkoutStore.getState()
      expect(state.currentExerciseIndex).toBe(0)
    })
  })

  describe('addPainNote', () => {
    it('devrait ajouter une note de douleur', async () => {
      const { painNoteRepository } = await import(
        '@/lib/db/repositories/pain-note.repository'
      )

      const mockExercise = {
        exercise: {
          id: 'exercise-123',
        } as WorkoutExercise,
        series: [],
      }

      useWorkoutStore.getState().startSession('session-123', [mockExercise])

      const painNoteData = {
        sessionId: 'session-123',
        exerciseId: 'exercise-123',
        zone: 'shoulder' as const,
        intensity: 7,
        note: 'Douleur aiguë pendant l\'exercice',
      }

      await useWorkoutStore.getState().addPainNote(0, painNoteData)

      const state = useWorkoutStore.getState()

      expect(state.painNotes).toHaveLength(1)
      expect(state.painNotes[0]).toMatchObject({
        sessionId: 'session-123',
        exerciseId: 'exercise-123',
        zone: 'shoulder',
        intensity: 7,
        note: 'Douleur aiguë pendant l\'exercice',
        userId: 'test-user-id',
        isDeleted: false,
      })
      expect(state.painNotes[0].id).toBeDefined()
      expect(state.painNotes[0].createdAt).toBeDefined()
      expect(state.painNotes[0].updatedAt).toBeDefined()

      // Vérifier que la note a été persistée dans IndexedDB
      expect(painNoteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(painNoteData),
      )
    })

    it('ne devrait rien faire si aucune séance n\'est active', async () => {
      const painNoteData = {
        sessionId: 'session-123',
        exerciseId: 'exercise-123',
        zone: 'shoulder' as const,
        intensity: 7,
      }

      await useWorkoutStore.getState().addPainNote(0, painNoteData)

      const state = useWorkoutStore.getState()
      expect(state.painNotes).toHaveLength(0)
    })

    it('ne devrait rien faire si l\'exercice n\'existe pas', async () => {
      useWorkoutStore.getState().startSession('session-123', [])

      const painNoteData = {
        sessionId: 'session-123',
        exerciseId: 'exercise-123',
        zone: 'shoulder' as const,
        intensity: 7,
      }

      await useWorkoutStore.getState().addPainNote(0, painNoteData)

      const state = useWorkoutStore.getState()
      expect(state.painNotes).toHaveLength(0)
    })
  })

  describe('removePainNote', () => {
    it('devrait retirer une note de douleur', async () => {
      const { painNoteRepository } = await import(
        '@/lib/db/repositories/pain-note.repository'
      )

      const mockExercise = {
        exercise: { id: 'exercise-123' } as WorkoutExercise,
        series: [],
      }

      useWorkoutStore.getState().startSession('session-123', [mockExercise])

      const painNoteData = {
        sessionId: 'session-123',
        exerciseId: 'exercise-123',
        zone: 'shoulder' as const,
        intensity: 7,
      }

      // Ajouter une note
      await useWorkoutStore.getState().addPainNote(0, painNoteData)

      const state1 = useWorkoutStore.getState()
      expect(state1.painNotes).toHaveLength(1)
      const painNoteId = state1.painNotes[0].id

      // Retirer la note
      await useWorkoutStore.getState().removePainNote(painNoteId)

      const state2 = useWorkoutStore.getState()
      expect(state2.painNotes).toHaveLength(0)

      // Vérifier que le soft delete a été appelé
      expect(painNoteRepository.softDelete).toHaveBeenCalledWith(painNoteId)
    })

    it('ne devrait rien faire si la note n\'existe pas', async () => {
      await useWorkoutStore.getState().removePainNote('non-existent-id')

      const state = useWorkoutStore.getState()
      expect(state.painNotes).toHaveLength(0)
    })
  })

  describe('resetStore', () => {
    it('devrait réinitialiser painNotes lors du reset', async () => {
      const mockExercise = {
        exercise: { id: 'exercise-123' } as WorkoutExercise,
        series: [],
      }

      useWorkoutStore.getState().startSession('session-123', [mockExercise])

      const painNoteData = {
        sessionId: 'session-123',
        exerciseId: 'exercise-123',
        zone: 'shoulder' as const,
        intensity: 7,
      }

      await useWorkoutStore.getState().addPainNote(0, painNoteData)

      expect(useWorkoutStore.getState().painNotes).toHaveLength(1)

      useWorkoutStore.getState().resetStore()

      const state = useWorkoutStore.getState()
      expect(state.painNotes).toHaveLength(0)
      expect(state.activeSession).toBeNull()
      expect(state.exercises).toHaveLength(0)
    })
  })
})
