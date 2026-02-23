import { z } from 'zod'
import { baseEntitySchema } from './base.schema'

export const stockPurchaseSchema = baseEntitySchema.extend({
  productId: z.string().uuid('ID produit invalide'),
  quantity: z.number().min(0.001, 'La quantité doit être positive'),
  price: z.number().min(0, 'Le prix doit être positif ou nul'),
  date: z.string(),
})

export type StockPurchase = z.infer<typeof stockPurchaseSchema>
