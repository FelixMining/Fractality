import { z } from 'zod'
import { baseEntitySchema } from './base.schema'
import { commonPropertiesSchema } from './common-properties.schema'

// Enum pour les groupes musculaires
export const muscleGroupEnum = z.enum([
  'chest',      // Pectoraux
  'back',       // Dos
  'shoulders',  // Épaules
  'legs',       // Jambes
  'arms',       // Bras
  'core',       // Abdos/Core
  'full-body',  // Corps entier
])

export type MuscleGroup = z.infer<typeof muscleGroupEnum>

// Labels français pour l'UI
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  legs: 'Jambes',
  arms: 'Bras',
  core: 'Abdos/Core',
  'full-body': 'Corps entier',
}

// Schema principal pour un exercice de musculation
export const workoutExerciseSchema = baseEntitySchema.merge(commonPropertiesSchema).extend({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  muscleGroup: muscleGroupEnum,
  description: z.string().max(500, 'Maximum 500 caractères').optional(),
})

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>
