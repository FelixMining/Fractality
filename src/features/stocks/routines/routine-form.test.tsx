import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RoutineForm } from './routine-form'
import { routineRepository } from '@/lib/db/repositories/routine.repository'
import type { StockProduct } from '@/schemas/stock-product.schema'
import type { StockRoutine } from '@/schemas/stock-routine.schema'

// Mock du repository routines
vi.mock('@/lib/db/repositories/routine.repository', () => ({
  routineRepository: {
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn().mockResolvedValue(undefined),
  },
  calculateConsumptionPerDay: vi.fn(),
  calculateDaysRemaining: vi.fn(),
}))

// Mock du repository stocks
vi.mock('@/lib/db/repositories/stock.repository', () => ({
  stockRepository: {
    getAllSorted: vi.fn().mockResolvedValue([]),
  },
}))

// Mock dexie-react-hooks
const mockUseLiveQuery = vi.fn()
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

// Mock sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// Mock useUndo — signature complète withUndo(desc, action, undoAction)
const mockWithUndo = vi.fn()
vi.mock('@/hooks/use-undo', () => ({
  useUndo: () => ({
    withUndo: mockWithUndo,
    undoActions: [],
  }),
}))

// Mock des composants Select pour éviter les problèmes de pointer events avec jsdom + Radix UI
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: { children: React.ReactNode; onValueChange?: (v: string) => void; value?: string }) => (
    <select
      data-testid="mock-select"
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <div id={id}>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}))

// Import React after mocks
import React from 'react'

const mockProducts: StockProduct[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Whey protéine',
    productType: 'bulk',
    currentStock: 100,
    unit: 'g',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Vitamine D',
    productType: 'quantity',
    currentStock: 60,
    unit: 'unité',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
  },
]

const mockCreatedRoutine: StockRoutine = {
  id: '33333333-3333-4333-8333-333333333333',
  userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Protéines du soir',
  productId: '11111111-1111-4111-8111-111111111111',
  quantity: 30,
  recurrenceType: 'daily',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseLiveQuery.mockReturnValue(mockProducts)
  vi.mocked(routineRepository.create).mockResolvedValue(mockCreatedRoutine)
  vi.mocked(routineRepository.update).mockResolvedValue(mockCreatedRoutine)
  // withUndo(desc, action, undoAction) : exécute action() immédiatement et enregistre undoAction
  mockWithUndo.mockImplementation(
    async (_desc: string, action: () => Promise<void>, _undoAction?: () => Promise<void>) => {
      await action()
    },
  )
})

describe('RoutineForm', () => {
  it('affiche les champs du formulaire pour une nouvelle routine', () => {
    render(<RoutineForm />)
    expect(screen.getByLabelText(/Nom \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Quantité consommée \*/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /créer la routine/i })).toBeInTheDocument()
  })

  it('affiche une erreur si le nom est vide à la soumission', async () => {
    render(<RoutineForm />)
    fireEvent.submit(screen.getByRole('button', { name: /créer la routine/i }))
    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument()
    })
  })

  it('valide que la quantité doit être un nombre valide', async () => {
    render(<RoutineForm />)
    const input = screen.getByLabelText(/Quantité consommée \*/i)
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.submit(screen.getByRole('button', { name: /créer la routine/i }))
    await waitFor(() => {
      expect(screen.getByText(/Quantité invalide/i)).toBeInTheDocument()
    })
  })

  it('crée une routine quotidienne après saisie des champs requis', async () => {
    const onSuccess = vi.fn()
    render(<RoutineForm onSuccess={onSuccess} />)

    // Saisir le nom
    fireEvent.change(screen.getByLabelText(/Nom \*/i), {
      target: { value: 'Protéines du soir' },
    })

    // Saisir la quantité
    fireEvent.change(screen.getByLabelText(/Quantité consommée \*/i), {
      target: { value: '30' },
    })

    // Sélectionner un produit via le select mocké
    const selects = screen.getAllByTestId('mock-select')
    // Le premier select est "Produit", le deuxième est "Récurrence"
    const productSelect = selects[0]
    fireEvent.change(productSelect, {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /créer la routine/i }))

    await waitFor(() => {
      expect(routineRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Protéines du soir',
          quantity: 30,
          recurrenceType: 'daily',
          isActive: true,
        }),
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('affiche les jours de semaine quand récurrence = hebdomadaire', async () => {
    render(<RoutineForm />)

    // Changer la récurrence via le select mocké
    const selects = screen.getAllByTestId('mock-select')
    const recurrenceSelect = selects[1] // deuxième select = récurrence
    fireEvent.change(recurrenceSelect, { target: { value: 'weekly' } })

    await waitFor(() => {
      expect(screen.getByText(/Jours de la semaine \*/i)).toBeInTheDocument()
      expect(screen.getByText('Lun')).toBeInTheDocument()
    })
  })

  it('affiche le champ intervalDays quand récurrence = personnalisé', async () => {
    render(<RoutineForm />)

    const selects = screen.getAllByTestId('mock-select')
    const recurrenceSelect = selects[1]
    fireEvent.change(recurrenceSelect, { target: { value: 'custom' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/Tous les N jours \*/i)).toBeInTheDocument()
    })
  })

  it('masque les champs conditionnels quand récurrence revient à quotidien', async () => {
    render(<RoutineForm />)

    const selects = screen.getAllByTestId('mock-select')
    const recurrenceSelect = selects[1]

    // Passer en weekly
    fireEvent.change(recurrenceSelect, { target: { value: 'weekly' } })
    await waitFor(() => expect(screen.getByText(/Jours de la semaine/i)).toBeInTheDocument())

    // Revenir en daily
    fireEvent.change(recurrenceSelect, { target: { value: 'daily' } })
    await waitFor(() => {
      expect(screen.queryByText(/Jours de la semaine/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Tous les N jours/i)).not.toBeInTheDocument()
    })
  })

  it('pré-remplit le formulaire en mode édition', () => {
    const existingRoutine: StockRoutine = {
      ...mockCreatedRoutine,
      name: 'Vitamine D matin',
      productId: '22222222-2222-4222-8222-222222222222',
      quantity: 1,
      recurrenceType: 'daily',
    }
    render(<RoutineForm initialData={existingRoutine} />)
    expect(screen.getByDisplayValue('Vitamine D matin')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /modifier la routine/i })).toBeInTheDocument()
  })

  it('appelle routineRepository.update en mode édition', async () => {
    const existingRoutine: StockRoutine = { ...mockCreatedRoutine }
    const onSuccess = vi.fn()
    render(<RoutineForm initialData={existingRoutine} onSuccess={onSuccess} />)

    // Modifier le nom
    const nameInput = screen.getByLabelText(/Nom \*/i)
    fireEvent.change(nameInput, { target: { value: 'Nom modifié' } })

    fireEvent.submit(screen.getByRole('button', { name: /modifier la routine/i }))

    await waitFor(() => {
      expect(routineRepository.update).toHaveBeenCalledWith(
        existingRoutine.id,
        expect.objectContaining({ name: 'Nom modifié' }),
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  // M2 — vérifier que withUndo reçoit bien les 3 arguments (action + undoAction)
  it('configure withUndo avec undoAction pour la création', async () => {
    render(<RoutineForm />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), {
      target: { value: 'Protéines du soir' },
    })
    fireEvent.change(screen.getByLabelText(/Quantité consommée \*/i), {
      target: { value: '30' },
    })

    const selects = screen.getAllByTestId('mock-select')
    fireEvent.change(selects[0], {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /créer la routine/i }))

    await waitFor(() => {
      expect(mockWithUndo).toHaveBeenCalledWith(
        expect.stringContaining('créée'),
        expect.any(Function), // action (noop — création déjà effectuée)
        expect.any(Function), // undoAction (softDelete)
      )
    })
  })

  // M3 — validation croisée : hebdomadaire sans jours cochés
  it('affiche une erreur si aucun jour sélectionné pour récurrence hebdomadaire', async () => {
    render(<RoutineForm />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/Quantité consommée \*/i), { target: { value: '2' } })

    const selects = screen.getAllByTestId('mock-select')
    // Sélectionner un produit (requis par Zod) pour atteindre la validation croisée
    fireEvent.change(selects[0], {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    })
    fireEvent.change(selects[1], { target: { value: 'weekly' } })

    // Soumettre sans cocher de jour
    fireEvent.submit(screen.getByRole('button', { name: /créer la routine/i }))

    await waitFor(() => {
      expect(screen.getByText(/Sélectionnez au moins un jour/i)).toBeInTheDocument()
    })
    expect(routineRepository.create).not.toHaveBeenCalled()
  })

  // M3 — validation croisée : personnalisé sans intervalDays
  it("affiche une erreur si l'intervalle est manquant pour récurrence personnalisée", async () => {
    render(<RoutineForm />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/Quantité consommée \*/i), { target: { value: '2' } })

    const selects = screen.getAllByTestId('mock-select')
    // Sélectionner un produit (requis par Zod) pour atteindre la validation croisée
    fireEvent.change(selects[0], {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    })
    fireEvent.change(selects[1], { target: { value: 'custom' } })

    // Soumettre sans saisir l'intervalle
    fireEvent.submit(screen.getByRole('button', { name: /créer la routine/i }))

    await waitFor(() => {
      expect(screen.getByText(/L'intervalle est requis/i)).toBeInTheDocument()
    })
    expect(routineRepository.create).not.toHaveBeenCalled()
  })
})
