import { z } from 'zod'
import { baseEntitySchema } from './base.schema'
import { commonPropertiesSchema } from './common-properties.schema'

/**
 * Schema Zod pour les programmes d'entraînement de musculation.
 *
 * Un programme contient plusieurs séances-types (WorkoutSessionTemplate).
 * Story 3.2 : Programmes et séances-types
 */
export const WorkoutProgramSchema = baseEntitySchema.merge(commonPropertiesSchema).extend({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  description: z.string().max(1000, 'Maximum 1000 caractères').optional(),
})

export type WorkoutProgram = z.infer<typeof WorkoutProgramSchema>
