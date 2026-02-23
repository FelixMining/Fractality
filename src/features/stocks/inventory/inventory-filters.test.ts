import { describe, it, expect } from 'vitest'
import {
  applyInventoryFilters,
  countInventoryFilters,
  hasInventoryFilters,
  type InventoryFilters,
} from './product-list'

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod-1',
  userId: 'user-1',
  name: 'Protéines whey',
  productType: 'quantity' as const,
  currentStock: 10,
  unit: 'kg',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
  ...overrides,
})

const EMPTY_FILTERS: InventoryFilters = { productTypes: [] }

describe('applyInventoryFilters', () => {
  it('retourne tout si pas de filtre', () => {
    const products = [
      makeProduct(),
      makeProduct({ id: 'prod-2', productType: 'liquid' }),
      makeProduct({ id: 'prod-3', productType: 'bulk' }),
    ]
    expect(applyInventoryFilters(products as never, EMPTY_FILTERS)).toHaveLength(3)
  })

  it('filtre par productType', () => {
    const products = [
      makeProduct({ productType: 'quantity' }),
      makeProduct({ id: 'prod-2', productType: 'liquid' }),
      makeProduct({ id: 'prod-3', productType: 'bulk' }),
    ]
    const filtered = applyInventoryFilters(products as never, { productTypes: ['quantity', 'bulk'] })
    expect(filtered).toHaveLength(2)
    expect(filtered.map((p) => p.id)).toEqual(['prod-1', 'prod-3'])
  })

  it('retourne [] si aucun produit ne correspond', () => {
    const products = [makeProduct({ productType: 'quantity' })]
    const filtered = applyInventoryFilters(products as never, { productTypes: ['liquid'] })
    expect(filtered).toHaveLength(0)
  })
})

describe('countInventoryFilters', () => {
  it('retourne 0 sans filtre', () => {
    expect(countInventoryFilters(EMPTY_FILTERS)).toBe(0)
  })

  it('retourne 1 si au moins un type sélectionné', () => {
    expect(countInventoryFilters({ productTypes: ['quantity'] })).toBe(1)
    expect(countInventoryFilters({ productTypes: ['quantity', 'liquid'] })).toBe(1)
  })
})

describe('hasInventoryFilters', () => {
  it('retourne false sans filtre', () => {
    expect(hasInventoryFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('retourne true si filtre actif', () => {
    expect(hasInventoryFilters({ productTypes: ['bulk'] })).toBe(true)
  })
})
