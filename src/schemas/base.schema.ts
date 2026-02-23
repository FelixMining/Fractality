import { z } from 'zod'

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isDeleted: z.boolean().default(false),
  deletedAt: z.string().datetime().nullable().default(null),
})

export type BaseEntity = z.infer<typeof baseEntitySchema>
