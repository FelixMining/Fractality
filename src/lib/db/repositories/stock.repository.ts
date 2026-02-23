import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { stockProductSchema, type StockProduct } from '@/schemas/stock-product.schema'

class StockRepository extends BaseRepository<StockProduct> {
  constructor() {
    super(db.stock_products, stockProductSchema, 'stock_products')
  }

  async getAllSorted(): Promise<StockProduct[]> {
    const products = await this.table
      .filter((p) => !p.isDeleted)
      .toArray()
    return products.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  async adjustStock(id: string, delta: number): Promise<StockProduct> {
    const product = await this.getById(id)
    if (!product) throw new Error(`Product ${id} not found or deleted`)
    const newStock = Math.max(0, product.currentStock + delta)
    return this.update(id, { currentStock: newStock })
  }
}

export const stockRepository = new StockRepository()
