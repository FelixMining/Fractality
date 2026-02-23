import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const projectSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Le nom est requis').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format couleur invalide (#RRGGBB)'),
  parentId: z.string().uuid().nullable().default(null),
})

export type Project = z.infer<typeof projectSchema>
