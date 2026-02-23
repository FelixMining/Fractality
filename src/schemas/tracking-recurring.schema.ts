import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

// Type de réponse attendue pour le suivi
export const responseTypeEnum = z.enum(['number', 'boolean', 'choice'])

// Type de récurrence (même logique que stock-routine)
export const trackingRecurrenceTypeEnum = z.enum(['daily', 'weekly', 'custom'])

export const trackingRecurringSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Le nom est requis'),
  responseType: responseTypeEnum,
  // Pour 'number' : unité d'affichage (ex. "heures", "L", "min")
  unit: z.string().optional(),
  // Pour 'choice' : liste des options prédéfinies (min 2 options)
  choices: z.array(z.string().min(1)).optional(),
  // Récurrence
  recurrenceType: trackingRecurrenceTypeEnum,
  // Weekly : jours de la semaine (0=dimanche, 1=lundi, ..., 6=samedi)
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  // Custom : toutes les N jours
  intervalDays: z.number().min(1).optional(),
  isActive: z.boolean().default(true),
  // Story 6.4 — lien automatique routines de consommation → suivis
  // Défini uniquement si ce suivi a été auto-généré depuis une routine Stocks
  routineId: z.string().uuid().optional(),
  routineProductId: z.string().uuid().optional(),
  routineQuantity: z.number().min(0.001).optional(),
})

export type TrackingRecurring = z.infer<typeof trackingRecurringSchema>
export type ResponseType = z.infer<typeof responseTypeEnum>
export type TrackingRecurrenceType = z.infer<typeof trackingRecurrenceTypeEnum>
