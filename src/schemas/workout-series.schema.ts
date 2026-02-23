import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const workoutSeriesSchema = baseEntitySchema.extend({
  sessionId: z.string().uuid('ID session invalide'),
  exerciseId: z.string().uuid('ID exercice invalide'),
  order: z.number().int().min(0, "L'ordre doit être >= 0"),
  reps: z
    .number()
    .int()
    .min(1, 'Minimum 1 répétition')
    .max(100, 'Maximum 100 reps'),
  weight: z
    .number()
    .min(0, 'Le poids ne peut être négatif')
    .max(500, 'Maximum 500kg')
    .optional(),
  restTime: z
    .number()
    .int()
    .min(0, 'Le repos ne peut être négatif')
    .max(3600, 'Maximum 1h')
    .optional(),
  rpe: z.number().int().min(1, 'Minimum 1').max(10, 'Maximum 10').optional(),
  completed: z.boolean().default(false),
})

export type WorkoutSeries = z.infer<typeof workoutSeriesSchema>
