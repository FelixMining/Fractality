import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const painZoneEnum = z.enum([
  'shoulder', // Épaule
  'elbow', // Coude
  'wrist', // Poignet
  'back', // Dos
  'hip', // Hanche
  'knee', // Genou
  'ankle', // Cheville
])

export type PainZone = z.infer<typeof painZoneEnum>

export const painNoteSchema = baseEntitySchema.extend({
  sessionId: z.string().uuid('ID session invalide'),
  exerciseId: z.string().uuid('ID exercice invalide'),
  zone: painZoneEnum,
  intensity: z.number().int().min(1, 'Minimum 1').max(10, 'Maximum 10'),
  note: z.string().max(500, 'Maximum 500 caractères').optional(),
})

export type PainNote = z.infer<typeof painNoteSchema>
