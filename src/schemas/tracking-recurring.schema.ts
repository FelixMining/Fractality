import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

// Type de réponse attendue pour le suivi
// 'number'  → saisie libre (tout réel : négatif, décimal, grand nombre)
// 'slider'  → slider configurable (min, max, step définis à la création)
// 'boolean' → Oui / Non
// 'choice'  → QCM (choix prédéfinis, simple ou multi-sélection)
export const responseTypeEnum = z.enum(['number', 'slider', 'boolean', 'choice'])

// Type de récurrence
export const trackingRecurrenceTypeEnum = z.enum(['daily', 'weekly', 'custom'])

export const trackingRecurringSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Le nom est requis'),
  responseType: responseTypeEnum,
  // Pour 'number' : unité d'affichage (ex. "heures", "L", "min")
  unit: z.string().optional(),
  // Pour 'choice' : liste des options prédéfinies (min 2 options)
  choices: z.array(z.string().min(1)).optional(),
  // Pour 'choice' : autoriser plusieurs sélections simultanées
  multiChoice: z.boolean().optional(),
  // Pour 'slider' : configuration du slider
  sliderMin: z.number().optional(),
  sliderMax: z.number().optional(),
  sliderStep: z.number().optional(),
  // Récurrence
  recurrenceType: trackingRecurrenceTypeEnum,
  // Weekly : jours de la semaine (0=dimanche, 1=lundi, ..., 6=samedi)
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  // Custom : toutes les N jours
  intervalDays: z.number().min(1).optional(),
  isActive: z.boolean().default(true),
  // Story 6.4 — lien automatique routines de consommation → suivis
  routineId: z.string().uuid().optional(),
  routineProductId: z.string().uuid().optional(),
  routineQuantity: z.number().min(0.001).optional(),
})

export type TrackingRecurring = z.infer<typeof trackingRecurringSchema>
export type ResponseType = z.infer<typeof responseTypeEnum>
export type TrackingRecurrenceType = z.infer<typeof trackingRecurrenceTypeEnum>
