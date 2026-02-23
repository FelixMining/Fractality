import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const recurrenceTypeEnum = z.enum(['daily', 'weekly', 'custom'])

export const stockRoutineSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Le nom est requis'),
  productId: z.string().uuid('ID produit invalide'),
  quantity: z.number().min(0.001, 'La quantité doit être positive'),
  recurrenceType: recurrenceTypeEnum,
  // weekly: jours de la semaine (0=dimanche, 1=lundi, …, 6=samedi)
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  // custom: toutes les N jours
  intervalDays: z.number().min(1).optional(),
  isActive: z.boolean().default(true),
  // Story 6.4 — UUID du TrackingRecurring auto-créé pour cette routine
  linkedTrackingId: z.string().uuid().optional(),
})

export type StockRoutine = z.infer<typeof stockRoutineSchema>
export type RecurrenceType = z.infer<typeof recurrenceTypeEnum>
