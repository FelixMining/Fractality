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
    duration: z.number().int().min(0, 'La durée doit être positive ou nulle').describe('Durée en secondes'),
    productivity: z.number().int().min(1).max(10).optional().describe('Productivité 1-10'),
    concentration: z.number().int().min(1).max(10).optional().describe('Concentration 1-10'),

    // Timer persistence fields for cross-device sync
    status: z.enum(['in_progress', 'completed']).default('completed'),
    timerStartedAt: z.string().datetime().optional(),
    timerElapsedSecs: z.number().min(0).default(0),
    timerPaused: z.boolean().default(false),
  })

export type WorkSession = z.infer<typeof workSessionSchema>
