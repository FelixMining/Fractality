import { z } from 'zod'

export const commonPropertiesSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  location: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  projectId: z.string().uuid().optional(),
})

export type CommonProperties = z.infer<typeof commonPropertiesSchema>
