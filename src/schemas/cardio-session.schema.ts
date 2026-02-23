import { z } from 'zod'
import { baseEntitySchema } from './base.schema'
import { commonPropertiesSchema } from './common-properties.schema'

export const cardioActivityTypeEnum = z.enum([
  'running',
  'cycling',
  'swimming',
  'hiking',
  'walking',
  'other',
])

export const cardioSessionSchema = baseEntitySchema
  .merge(commonPropertiesSchema)
  .extend({
    // Override optional fields to make them required
    title: z.string().min(1, 'Le titre est requis'),
    date: z.string().datetime(),

    // Cardio session specific properties
    activityType: cardioActivityTypeEnum,
    duration: z.number().int().positive('La durée doit être positive').describe('Durée en secondes'),
    distance: z.number().min(0).optional().describe('Distance en mètres'),
    avgSpeed: z.number().min(0).optional().describe('Vitesse moyenne en km/h'),
    maxSpeed: z.number().min(0).optional().describe('Vitesse max en km/h'),
    elevationGain: z.number().min(0).optional().describe('Dénivelé positif en mètres'),
    elevationLoss: z.number().min(0).optional().describe('Dénivelé négatif en mètres'),
    avgPace: z.number().min(0).optional().describe('Allure moyenne en s/km'),
    startLocation: z.string().optional().describe('Localisation de départ'),
    inputMode: z.enum(['gpx', 'manual']),
  })

export type CardioSession = z.infer<typeof cardioSessionSchema>
export type CardioActivityType = z.infer<typeof cardioActivityTypeEnum>
