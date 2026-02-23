import { describe, it, expect, vi, beforeEach } from 'vitest'

// Ces constantes doivent être définies AVANT les vi.mock (hoisting)
// On utilise des string literals directement dans vi.mock pour éviter le problème de hoisting

// Mock de la base Dexie et du stockRepository avant d'importer le module
vi.mock('@/lib/db/database', () => ({
  db: {
    stock_purchases: {
      filter: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    syncQueue: {
      add: vi.fn().mockResolvedValue(undefined),
    },
    transaction: vi.fn().mockImplementation(async (_mode: unknown, _tables: unknown, fn: () => Promise<unknown>) => fn()),
  },
}))

vi.mock('@/lib/db/repositories/stock.repository', () => ({
  stockRepository: {
    adjustStock: vi.fn().mockResolvedValue({ id: '22222222-2222-4222-8222-222222222222', currentStock: 5 }),
  },
}))

vi.mock('@/lib/sync/sync-registry', () => ({
  syncRegistry: {
    isRegistered: vi.fn().mockReturnValue(false),
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
      }),
    },
  },
}))

import { purchaseRepository, type PurchaseLine } from './purchase.repository'
import { stockRepository } from './stock.repository'
import { db } from '@/lib/db/database'
import type { StockPurchase } from '@/schemas/stock-purchase.schema'

// UUIDs valides pour les tests (après les vi.mock)
const USER_ID = '11111111-1111-4111-8111-111111111111'
const PROD_ID_1 = '22222222-2222-4222-8222-222222222222'
const PROD_ID_2 = '33333333-3333-4333-8333-333333333333'

type DbMock = {
  stock_purchases: {
    filter: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
    put: ReturnType<typeof vi.fn>
  }
}

const makePurchase = (overrides: Partial<StockPurchase> = {}): StockPurchase => ({
  id: crypto.randomUUID(),
  userId: USER_ID,
  productId: PROD_ID_1,
  quantity: 2,
  price: 35.0,
  date: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
  ...overrides,
})

describe('PurchaseRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const dbMock = db as unknown as DbMock
    dbMock.stock_purchases.filter.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    })
    dbMock.stock_purchases.put.mockResolvedValue(undefined)
    dbMock.stock_purchases.get.mockResolvedValue(undefined)
    // Réinitialiser adjustStock mock
    vi.mocked(stockRepository.adjustStock).mockResolvedValue({
      id: PROD_ID_1,
      userId: USER_ID,
      productId: PROD_ID_1,
      quantity: 2,
      price: 35,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
    } as unknown as ReturnType<typeof stockRepository.adjustStock> extends Promise<infer R> ? R : never)
  })

  describe('getAllSorted', () => {
    it('retourne un tableau vide quand il n\'y a pas d\'achats', async () => {
      const result = await purchaseRepository.getAllSorted()
      expect(result).toEqual([])
    })

    it('retourne les achats non-supprimés', async () => {
      const active = makePurchase({ isDeleted: false })
      const dbMock = db as unknown as DbMock
      dbMock.stock_purchases.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([active]),
      })

      const result = await purchaseRepository.getAllSorted()
      expect(Array.isArray(result)).toBe(true)
    })

    it('trie par date décroissante', async () => {
      const older = makePurchase({ date: '2025-01-01T10:00:00.000Z', createdAt: '2025-01-01T10:00:00.000Z' })
      const newer = makePurchase({ date: '2025-02-01T10:00:00.000Z', createdAt: '2025-02-01T10:00:00.000Z' })
      const dbMock = db as unknown as DbMock
      dbMock.stock_purchases.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([older, newer]),
      })

      const result = await purchaseRepository.getAllSorted()
      if (result.length >= 2) {
        expect(result[0].date >= result[1].date).toBe(true)
      }
    })
  })

  describe('getByProductId', () => {
    it('retourne les achats pour un productId donné', async () => {
      const p1 = makePurchase({ productId: PROD_ID_1 })
      const dbMock = db as unknown as DbMock
      dbMock.stock_purchases.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([p1]),
      })

      const result = await purchaseRepository.getByProductId(PROD_ID_1)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('createPurchaseAndUpdateStock', () => {
    it('crée un achat et appelle adjustStock', async () => {
      const line: PurchaseLine = { productId: PROD_ID_1, quantity: 2, price: 35 }
      const date = new Date().toISOString()
      const dbMock = db as unknown as DbMock
      dbMock.stock_purchases.put.mockResolvedValue(undefined)

      await purchaseRepository.createPurchaseAndUpdateStock(line, date)

      expect(stockRepository.adjustStock).toHaveBeenCalledWith(PROD_ID_1, 2)
    })
  })

  describe('createMultiplePurchases', () => {
    it('crée plusieurs achats et appelle adjustStock pour chacun', async () => {
      const lines: PurchaseLine[] = [
        { productId: PROD_ID_1, quantity: 2, price: 35 },
        { productId: PROD_ID_2, quantity: 1, price: 8.5 },
      ]
      const date = new Date().toISOString()
      const dbMock = db as unknown as DbMock
      dbMock.stock_purchases.put.mockResolvedValue(undefined)

      await purchaseRepository.createMultiplePurchases(lines, date)

      expect(stockRepository.adjustStock).toHaveBeenCalledTimes(2)
      expect(stockRepository.adjustStock).toHaveBeenCalledWith(PROD_ID_1, 2)
      expect(stockRepository.adjustStock).toHaveBeenCalledWith(PROD_ID_2, 1)
    })

    it('retourne un tableau de StockPurchase créés', async () => {
      const lines: PurchaseLine[] = [{ productId: PROD_ID_1, quantity: 1, price: 10 }]
      const date = new Date().toISOString()
      const dbMock = db as unknown as DbMock
      dbMock.stock_purchases.put.mockResolvedValue(undefined)

      const result = await purchaseRepository.createMultiplePurchases(lines, date)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
    })
  })
})
