import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

/**
 * Schema Zod pour la table de jonction entre séances-types et exercices.
 *
 * Cette table implémente la relation many-to-many entre WorkoutSessionTemplate et WorkoutExercise.
 * Elle stocke également les paramètres par défaut (séries, reps, charge) pour chaque exercice
 * dans le contexte d'une séance-type spécifique.
 *
 * Story 3.2 : Programmes et séances-types
 */
export const WorkoutTemplateExerciseSchema = baseEntitySchema.extend({
  sessionTemplateId: z.string().uuid('ID séance-type invalide'), // FK vers workout_session_templates
  exerciseId: z.string().uuid('ID exercice invalide'), // FK vers workout_exercises
  order: z.number().int().min(0, 'L\'ordre doit être >= 0'), // Position dans la séance
  defaultSets: z.number().int().min(1, 'Minimum 1 série').max(10, 'Maximum 10 séries'),
  defaultReps: z.number().int().min(1, 'Minimum 1 répétition').max(100, 'Maximum 100 reps').optional(),
  defaultWeight: z.number().min(0, 'Le poids ne peut être négatif').max(500, 'Maximum 500kg').optional(),
})

export type WorkoutTemplateExercise = z.infer<typeof WorkoutTemplateExerciseSchema>
