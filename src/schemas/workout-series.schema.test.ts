import { describe, it, expect } from 'vitest'
import { workoutSeriesSchema, type WorkoutSeries } from './workout-series.schema'

describe('WorkoutSeriesSchema', () => {
  const validSeries: WorkoutSeries = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    exerciseId: crypto.randomUUID(),
    order: 0,
    reps: 10,
    weight: 50,
    restTime: 90,
    rpe: 7,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
  }

  describe('champs requis', () => {
    it('devrait valider une série complète', () => {
      const result = workoutSeriesSchema.safeParse(validSeries)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter si reps manquant', () => {
      const series = { ...validSeries, reps: undefined }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(false)
    })
  })

  describe('validation reps', () => {
    it('devrait accepter reps entre 1 et 100', () => {
      const series1 = { ...validSeries, reps: 1 }
      expect(workoutSeriesSchema.safeParse(series1).success).toBe(true)

      const series100 = { ...validSeries, reps: 100 }
      expect(workoutSeriesSchema.safeParse(series100).success).toBe(true)
    })

    it('devrait rejeter reps < 1', () => {
      const series = { ...validSeries, reps: 0 }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter reps > 100', () => {
      const series = { ...validSeries, reps: 101 }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(false)
    })
  })

  describe('validation weight (optionnel)', () => {
    it('devrait accepter weight undefined', () => {
      const series = { ...validSeries, weight: undefined }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(true)
    })

    it('devrait accepter weight entre 0 et 500', () => {
      const series0 = { ...validSeries, weight: 0 }
      expect(workoutSeriesSchema.safeParse(series0).success).toBe(true)

      const series500 = { ...validSeries, weight: 500 }
      expect(workoutSeriesSchema.safeParse(series500).success).toBe(true)
    })

    it('devrait rejeter weight < 0', () => {
      const series = { ...validSeries, weight: -1 }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter weight > 500', () => {
      const series = { ...validSeries, weight: 501 }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(false)
    })
  })

  describe('validation rpe (optionnel)', () => {
    it('devrait accepter rpe undefined', () => {
      const series = { ...validSeries, rpe: undefined }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(true)
    })

    it('devrait accepter rpe entre 1 et 10', () => {
      for (let i = 1; i <= 10; i++) {
        const series = { ...validSeries, rpe: i }
        const result = workoutSeriesSchema.safeParse(series)
        expect(result.success).toBe(true)
      }
    })

    it('devrait rejeter rpe < 1', () => {
      const series = { ...validSeries, rpe: 0 }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter rpe > 10', () => {
      const series = { ...validSeries, rpe: 11 }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(false)
    })
  })

  describe('validation completed', () => {
    it('devrait avoir false comme valeur par défaut', () => {
      const series = { ...validSeries }
      delete (series as Partial<WorkoutSeries>).completed
      const result = workoutSeriesSchema.parse(series)
      expect(result.completed).toBe(false)
    })

    it('devrait accepter true', () => {
      const series = { ...validSeries, completed: true }
      const result = workoutSeriesSchema.safeParse(series)
      expect(result.success).toBe(true)
    })
  })
})
