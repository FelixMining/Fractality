import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const stockProductTypeEnum = z.enum(['liquid', 'quantity', 'bulk'])

export const stockProductSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Le nom est requis'),
  productType: stockProductTypeEnum,
  currentStock: z.number().min(0).default(0),
  unit: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  imageId: z.string().optional(),
})

export type StockProduct = z.infer<typeof stockProductSchema>
export type StockProductType = z.infer<typeof stockProductTypeEnum>
