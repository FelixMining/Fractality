import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const eventTypeSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Le nom est requis'),
  // Emoji ou chaîne courte (ex. "🏃", "💊", "📅")
  icon: z.string().optional(),
  // Couleur hex optionnelle pour différencier visuellement (ex. "#F59E0B")
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format hex invalide').optional(),
})

export type EventType = z.infer<typeof eventTypeSchema>
