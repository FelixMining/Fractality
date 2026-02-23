import { z } from 'zod'
import { baseEntitySchema } from './base.schema'
import { commonPropertiesSchema } from './common-properties.schema'

export const workSessionSchema = baseEntitySchema
  .merge(commonPropertiesSchema)
  .extend({
    // Override optional fields to make them required
    title: z.string().min(1, 'Le titre est requis'),
    date: z.string().datetime(),

    // Work session specific properties
    duration: z.number().int().positive('La durée doit être positive').describe('Durée en secondes'),
    productivity: z.number().int().min(1).max(10).optional().describe('Productivité 1-10'),
    concentration: z.number().int().min(1).max(10).optional().describe('Concentration 1-10'),
  })

export type WorkSession = z.infer<typeof workSessionSchema>
