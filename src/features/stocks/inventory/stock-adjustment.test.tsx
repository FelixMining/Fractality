import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StockAdjustment } from './stock-adjustment'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import type { StockProduct } from '@/schemas/stock-product.schema'

// Mock du repository
vi.mock('@/lib/db/repositories/stock.repository', () => ({
  stockRepository: {
    adjustStock: vi.fn(),
    getById: vi.fn(),
  },
}))

// Mock du hook undo
vi.mock('@/hooks/use-undo', () => ({
  useUndo: () => ({
    withUndo: vi.fn().mockImplementation(async (_desc, action, _undo) => {
      await action()
    }),
  }),
}))

// Mock de sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const baseProduct: StockProduct = {
  id: 'prod-1',
  userId: 'user-1',
  name: 'Huile d\'olive',
  productType: 'liquid',
  currentStock: 5,
  unit: 'L',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
}

describe('StockAdjustment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(stockRepository.adjustStock as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseProduct,
      currentStock: 6,
    })
  })

  it('affiche le stock actuel avec l\'unité', () => {
    render(<StockAdjustment product={baseProduct} />)

    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('L')).toBeTruthy()
  })

  it('appelle adjustStock avec +1 au clic sur +', async () => {
    render(<StockAdjustment product={baseProduct} />)

    const addBtn = screen.getByLabelText(/Ajouter/i)
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(stockRepository.adjustStock).toHaveBeenCalledWith('prod-1', 1)
    })
  })

  it('appelle adjustStock avec -1 au clic sur −', async () => {
    render(<StockAdjustment product={baseProduct} />)

    const removeBtn = screen.getByLabelText(/Retirer/i)
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(stockRepository.adjustStock).toHaveBeenCalledWith('prod-1', -1)
    })
  })

  it('désactive le bouton − si le stock est à 0', () => {
    const emptyProduct: StockProduct = { ...baseProduct, currentStock: 0 }
    render(<StockAdjustment product={emptyProduct} />)

    const removeBtn = screen.getByLabelText(/Retirer/i)
    expect((removeBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('le bouton + reste actif même si le stock est à 0', () => {
    const emptyProduct: StockProduct = { ...baseProduct, currentStock: 0 }
    render(<StockAdjustment product={emptyProduct} />)

    const addBtn = screen.getByLabelText(/Ajouter/i)
    expect((addBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('appelle onAdjusted avec le produit mis à jour', async () => {
    const onAdjusted = vi.fn()
    const updatedProduct = { ...baseProduct, currentStock: 6 }
    ;(stockRepository.adjustStock as ReturnType<typeof vi.fn>).mockResolvedValue(updatedProduct)

    render(<StockAdjustment product={baseProduct} onAdjusted={onAdjusted} />)

    const addBtn = screen.getByLabelText(/Ajouter/i)
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(onAdjusted).toHaveBeenCalledWith(updatedProduct)
    })
  })
})
