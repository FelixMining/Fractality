import { describe, it, expect } from 'vitest'
import {
  workoutSessionSchema,
  workoutSessionStatusEnum,
  type WorkoutSession,
} from './workout-session.schema'

describe('WorkoutSessionSchema', () => {
  const validSession: WorkoutSession = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    programId: crypto.randomUUID(),
    sessionTemplateId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    initialFatigue: 5,
    totalDuration: 3600,
    totalVolume: 1500,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
  }

  describe('champs requis', () => {
    it('devrait valider un objet session complet', () => {
      const result = workoutSessionSchema.safeParse(validSession)
      expect(result.success).toBe(true)
    })

    it('devrait accepter programId optionnel', () => {
      const session = { ...validSession, programId: undefined }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('devrait accepter sessionTemplateId optionnel', () => {
      const session = { ...validSession, sessionTemplateId: undefined }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })
  })

  describe('validation status enum', () => {
    it('devrait accepter status "in-progress"', () => {
      const session = { ...validSession, status: 'in-progress' as const }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('devrait accepter status "completed"', () => {
      const session = { ...validSession, status: 'completed' as const }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('devrait accepter status "abandoned"', () => {
      const session = { ...validSession, status: 'abandoned' as const }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un status invalide', () => {
      const session = { ...validSession, status: 'invalid' }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(false)
    })
  })

  describe('validation initialFatigue', () => {
    it('devrait accepter fatigue entre 1 et 10', () => {
      for (let i = 1; i <= 10; i++) {
        const session = { ...validSession, initialFatigue: i }
        const result = workoutSessionSchema.safeParse(session)
        expect(result.success).toBe(true)
      }
    })

    it('devrait rejeter fatigue < 1', () => {
      const session = { ...validSession, initialFatigue: 0 }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter fatigue > 10', () => {
      const session = { ...validSession, initialFatigue: 11 }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(false)
    })
  })

  describe('validation totalDuration', () => {
    it('devrait accepter durée >= 0', () => {
      const session = { ...validSession, totalDuration: 0 }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter durée négative', () => {
      const session = { ...validSession, totalDuration: -1 }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(false)
    })
  })

  describe('validation totalVolume', () => {
    it('devrait accepter volume >= 0', () => {
      const session = { ...validSession, totalVolume: 0 }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter volume négatif', () => {
      const session = { ...validSession, totalVolume: -1 }
      const result = workoutSessionSchema.safeParse(session)
      expect(result.success).toBe(false)
    })
  })
})

describe('WorkoutSessionStatusEnum', () => {
  it('devrait contenir les 3 statuts', () => {
    expect(workoutSessionStatusEnum.options).toEqual([
      'in-progress',
      'completed',
      'abandoned',
    ])
  })
})
