import { describe, it, expect } from 'vitest'
import { workoutExerciseSchema, muscleGroupEnum, type WorkoutExercise } from './workout-exercise.schema'

describe('workoutExerciseSchema', () => {
  const validExercise: WorkoutExercise = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    createdAt: '2026-02-16T10:00:00.000Z',
    updatedAt: '2026-02-16T10:00:00.000Z',
    isDeleted: false,
    deletedAt: null,
    name: 'Développé couché',
    muscleGroup: 'chest',
  }

  it('should validate a valid exercise', () => {
    const result = workoutExerciseSchema.safeParse(validExercise)
    expect(result.success).toBe(true)
  })

  it('should validate an exercise with description', () => {
    const exerciseWithDescription = {
      ...validExercise,
      description: 'Exercice de base pour les pectoraux',
    }
    const result = workoutExerciseSchema.safeParse(exerciseWithDescription)
    expect(result.success).toBe(true)
  })

  it('should fail if name is missing', () => {
    const { name, ...exerciseWithoutName } = validExercise
    const result = workoutExerciseSchema.safeParse(exerciseWithoutName)
    expect(result.success).toBe(false)
    if (!result.success) {
      // Zod returns type error when field is completely missing
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('should fail if name is empty', () => {
    const exerciseWithEmptyName = { ...validExercise, name: '' }
    const result = workoutExerciseSchema.safeParse(exerciseWithEmptyName)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Le nom est requis')
    }
  })

  it('should fail if name exceeds 100 characters', () => {
    const exerciseWithLongName = { ...validExercise, name: 'a'.repeat(101) }
    const result = workoutExerciseSchema.safeParse(exerciseWithLongName)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum 100 caractères')
    }
  })

  it('should fail if muscleGroup is missing', () => {
    const { muscleGroup, ...exerciseWithoutGroup } = validExercise
    const result = workoutExerciseSchema.safeParse(exerciseWithoutGroup)
    expect(result.success).toBe(false)
  })

  it('should fail if muscleGroup is invalid', () => {
    const exerciseWithInvalidGroup = { ...validExercise, muscleGroup: 'invalid' }
    const result = workoutExerciseSchema.safeParse(exerciseWithInvalidGroup)
    expect(result.success).toBe(false)
  })

  it('should accept all valid muscleGroup values', () => {
    const groups: Array<'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'full-body'> = [
      'chest',
      'back',
      'shoulders',
      'legs',
      'arms',
      'core',
      'full-body',
    ]

    groups.forEach((group) => {
      const exercise = { ...validExercise, muscleGroup: group }
      const result = workoutExerciseSchema.safeParse(exercise)
      expect(result.success).toBe(true)
    })
  })

  it('should fail if description exceeds 500 characters', () => {
    const exerciseWithLongDescription = {
      ...validExercise,
      description: 'a'.repeat(501),
    }
    const result = workoutExerciseSchema.safeParse(exerciseWithLongDescription)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum 500 caractères')
    }
  })

  it('should accept description as optional', () => {
    const result = workoutExerciseSchema.safeParse(validExercise)
    expect(result.success).toBe(true)
  })
})

describe('muscleGroupEnum', () => {
  it('should accept all valid muscle group values', () => {
    const validGroups = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'full-body']

    validGroups.forEach((group) => {
      const result = muscleGroupEnum.safeParse(group)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid muscle group values', () => {
    const invalidGroups = ['invalid', 'cardio', 'abs', '']

    invalidGroups.forEach((group) => {
      const result = muscleGroupEnum.safeParse(group)
      expect(result.success).toBe(false)
    })
  })
})
