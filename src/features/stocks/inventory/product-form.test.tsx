import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductForm } from './product-form'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import type { StockProduct } from '@/schemas/stock-product.schema'

// Mock du repository
vi.mock('@/lib/db/repositories/stock.repository', () => ({
  stockRepository: {
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  },
}))

// Mock de sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockProduct: StockProduct = {
  id: 'prod-1',
  userId: 'user-1',
  name: 'Whey protéine',
  productType: 'quantity',
  currentStock: 2,
  unit: 'kg',
  basePrice: 35.0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
}

describe('ProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le formulaire de création avec les champs requis', () => {
    render(<ProductForm />)

    expect(screen.getByLabelText(/Nom \*/i)).toBeTruthy()
    expect(screen.getByLabelText(/Type \*/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Créer le produit/i })).toBeTruthy()
  })

  it('affiche une erreur si le nom est vide à la soumission', async () => {
    render(<ProductForm />)

    const submitBtn = screen.getByRole('button', { name: /Créer le produit/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Le nom est requis')).toBeTruthy()
    })
  })

  it('appelle repository.create() avec les bonnes données', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<ProductForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/Nom \*/i), 'Huile d\'olive')
    await user.type(screen.getByLabelText(/Unité/i), 'L')
    await user.type(screen.getByLabelText(/Prix de base/i), '8.50')

    const submitBtn = screen.getByRole('button', { name: /Créer le produit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(stockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Huile d'olive",
          unit: 'L',
          currentStock: 0,
        }),
      )
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('pré-remplit le formulaire en mode édition', () => {
    render(<ProductForm initialData={mockProduct} />)

    expect(screen.getByDisplayValue('Whey protéine')).toBeTruthy()
    expect(screen.getByDisplayValue('kg')).toBeTruthy()
    expect(screen.getByDisplayValue('35')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Modifier/i })).toBeTruthy()
  })

  it('appelle repository.update() en mode édition et préserve currentStock', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<ProductForm initialData={mockProduct} onSuccess={onSuccess} />)

    // Changer le nom
    const nameInput = screen.getByDisplayValue('Whey protéine')
    await user.clear(nameInput)
    await user.type(nameInput, 'Whey vanille')

    const submitBtn = screen.getByRole('button', { name: /Modifier/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(stockRepository.update).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({
          name: 'Whey vanille',
          currentStock: 2, // Préservé depuis initialData
        }),
      )
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('appelle onCancel quand on clique Annuler', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ProductForm onCancel={onCancel} />)

    const cancelBtn = screen.getByRole('button', { name: /Annuler/i })
    await user.click(cancelBtn)

    expect(onCancel).toHaveBeenCalled()
  })

  it('affiche une erreur si le prix contient des caractères invalides', async () => {
    const user = userEvent.setup()
    render(<ProductForm />)

    await user.type(screen.getByLabelText(/Prix de base/i), 'abc')
    fireEvent.click(screen.getByRole('button', { name: /Créer le produit/i }))

    await waitFor(() => {
      expect(screen.getByText('Prix invalide')).toBeTruthy()
    })
  })
})
