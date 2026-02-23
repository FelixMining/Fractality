import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { stockPurchaseSchema, type StockPurchase } from '@/schemas/stock-purchase.schema'
import { stockRepository } from './stock.repository'

export interface PurchaseLine {
  productId: string
  quantity: number
  price: number
}

class PurchaseRepository extends BaseRepository<StockPurchase> {
  constructor() {
    super(db.stock_purchases, stockPurchaseSchema, 'stock_purchases')
  }

  async getAllSorted(): Promise<StockPurchase[]> {
    const purchases = await this.table
      .filter((p) => !p.isDeleted)
      .toArray()
    return purchases.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date)
      return dateDiff !== 0 ? dateDiff : b.createdAt.localeCompare(a.createdAt)
    })
  }

  async getByProductId(productId: string): Promise<StockPurchase[]> {
    const purchases = await this.table
      .filter((p) => p.productId === productId && !p.isDeleted)
      .toArray()
    return purchases.sort((a, b) => b.date.localeCompare(a.date))
  }

  async createPurchaseAndUpdateStock(
    line: PurchaseLine,
    date: string,
  ): Promise<StockPurchase> {
    const purchase = await this.create({
      productId: line.productId,
      quantity: line.quantity,
      price: line.price,
      date,
    } as Omit<StockPurchase, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>)
    await stockRepository.adjustStock(line.productId, line.quantity)
    return purchase
  }

  async createMultiplePurchases(
    lines: PurchaseLine[],
    date: string,
  ): Promise<StockPurchase[]> {
    const results: StockPurchase[] = []
    for (const line of lines) {
      const purchase = await this.createPurchaseAndUpdateStock(line, date)
      results.push(purchase)
    }
    return results
  }
}

export const purchaseRepository = new PurchaseRepository()
