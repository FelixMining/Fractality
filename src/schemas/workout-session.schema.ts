import { z } from 'zod'
import { baseEntitySchema } from './base.schema'
import { commonPropertiesSchema } from './common-properties.schema'

export const workoutSessionStatusEnum = z.enum([
  'in-progress', // Séance en cours
  'completed', // Séance terminée
  'abandoned', // Séance abandonnée
])

export type WorkoutSessionStatus = z.infer<typeof workoutSessionStatusEnum>

export const workoutSessionSchema = baseEntitySchema
  .merge(commonPropertiesSchema)
  .extend({
    programId: z.string().uuid('ID programme invalide').optional(),
    sessionTemplateId: z
      .string()
      .uuid('ID séance-type invalide')
      .optional(),
    startedAt: z.string().datetime('Format ISO 8601 requis'),
    completedAt: z.string().datetime('Format ISO 8601 requis').optional(),
    initialFatigue: z
      .number()
      .int()
      .min(1, 'Minimum 1')
      .max(10, 'Maximum 10')
      .optional(),
    totalDuration: z
      .number()
      .int()
      .min(0, 'La durée ne peut être négative')
      .optional(),
    totalVolume: z
      .number()
      .min(0, 'Le volume ne peut être négatif')
      .optional(),
    status: workoutSessionStatusEnum,
  })

export type WorkoutSession = z.infer<typeof workoutSessionSchema>
