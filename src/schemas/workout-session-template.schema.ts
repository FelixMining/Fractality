import { z } from 'zod'
import { baseEntitySchema } from './base.schema'
import { commonPropertiesSchema } from './common-properties.schema'

/**
 * Schema Zod pour les séances-types appartenant à un programme d'entraînement.
 *
 * Une séance-type définit une collection d'exercices avec leurs paramètres par défaut.
 * Elle appartient à un WorkoutProgram (relation 1-N).
 * Story 3.2 : Programmes et séances-types
 */
export const WorkoutSessionTemplateSchema = baseEntitySchema.merge(commonPropertiesSchema).extend({
  programId: z.string().uuid('ID programme invalide'), // Foreign key vers workout_programs
  name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
})

export type WorkoutSessionTemplate = z.infer<typeof WorkoutSessionTemplateSchema>
