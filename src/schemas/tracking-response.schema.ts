import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const trackingResponseSchema = baseEntitySchema.extend({
  recurringId: z.string().uuid('ID suivi invalide'),
  // Date de la réponse au format YYYY-MM-DD (une réponse par jour et par suivi)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  // Champs de valeur — remplis selon responseType du suivi parent
  valueNumber: z.number().optional(),
  valueBoolean: z.boolean().optional(),
  valueChoice: z.string().optional(),         // QCM choix unique
  valueChoices: z.array(z.string()).optional(), // QCM multi-sélection
  note: z.string().optional(),
})

export type TrackingResponse = z.infer<typeof trackingResponseSchema>
