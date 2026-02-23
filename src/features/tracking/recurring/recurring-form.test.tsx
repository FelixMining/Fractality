import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecurringForm } from './recurring-form'
import { trackingRecurringRepository } from '@/lib/db/repositories/tracking.repository'
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'

// Mock du repository tracking
vi.mock('@/lib/db/repositories/tracking.repository', () => ({
  trackingRecurringRepository: {
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn().mockResolvedValue(undefined),
  },
  trackingResponseRepository: {
    create: vi.fn(),
    update: vi.fn(),
    getByDate: vi.fn().mockResolvedValue([]),
    upsertResponse: vi.fn().mockResolvedValue(undefined),
  },
  isDueOnDate: vi.fn().mockReturnValue(true),
  getScheduledDates: vi.fn().mockReturnValue([]),
}))

// Mock sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// Mock useUndo
const mockWithUndo = vi.fn()
vi.mock('@/hooks/use-undo', () => ({
  useUndo: () => ({
    withUndo: mockWithUndo,
    undoActions: [],
  }),
}))

// Mock des composants Select Radix UI (jsdom n'implémente pas hasPointerCapture)
vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode
    onValueChange?: (v: string) => void
    value?: string
  }) => (
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

// Import React après les mocks
import React from 'react'

const mockCreatedRecurring: TrackingRecurring = {
  id: '33333333-3333-4333-8333-333333333333',
  userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Heures de sommeil',
  responseType: 'number',
  unit: 'heures',
  recurrenceType: 'daily',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(trackingRecurringRepository.create).mockResolvedValue(mockCreatedRecurring)
  vi.mocked(trackingRecurringRepository.update).mockResolvedValue(mockCreatedRecurring)
  mockWithUndo.mockImplementation(
    async (_desc: string, action: () => Promise<void>, _undoAction?: () => Promise<void>) => {
      await action()
    },
  )
})

describe('RecurringForm — création', () => {
  it('affiche les champs de base pour un nouveau suivi', () => {
    render(<RecurringForm />)
    expect(screen.getByLabelText(/Nom \*/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /créer le suivi/i })).toBeInTheDocument()
  })

  it('affiche une erreur si le nom est vide à la soumission', async () => {
    render(<RecurringForm />)
    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))
    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument()
    })
  })

  it('crée un suivi de type valeur chiffrée avec unité', async () => {
    const onSuccess = vi.fn()
    render(<RecurringForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), {
      target: { value: 'Heures de sommeil' },
    })

    // responseType = 'number' par défaut — champ unité doit être visible
    const unitInput = await waitFor(() => screen.getByLabelText(/Unité.*optionnel/i))
    fireEvent.change(unitInput, { target: { value: 'heures' } })

    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))

    await waitFor(() => {
      expect(trackingRecurringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Heures de sommeil',
          responseType: 'number',
          unit: 'heures',
          recurrenceType: 'daily',
          isActive: true,
        }),
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('crée un suivi de type oui-non sans champs supplémentaires', async () => {
    const onSuccess = vi.fn()
    render(<RecurringForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), {
      target: { value: 'Sport fait' },
    })

    // Changer le type de réponse vers 'boolean'
    const selects = screen.getAllByTestId('mock-select')
    const responseTypeSelect = selects[0]
    fireEvent.change(responseTypeSelect, { target: { value: 'boolean' } })

    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))

    await waitFor(() => {
      expect(trackingRecurringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sport fait',
          responseType: 'boolean',
          recurrenceType: 'daily',
        }),
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('crée un suivi de type QCM avec choix prédéfinis', async () => {
    const onSuccess = vi.fn()
    render(<RecurringForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), {
      target: { value: 'Qualité du sommeil' },
    })

    // Changer le type de réponse vers 'choice'
    const selects = screen.getAllByTestId('mock-select')
    fireEvent.change(selects[0], { target: { value: 'choice' } })

    // Saisir les choix
    const choicesInput = await waitFor(() =>
      screen.getByLabelText(/Choix prédéfinis/i),
    )
    fireEvent.change(choicesInput, { target: { value: 'Excellent, Bien, Moyen, Mauvais' } })

    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))

    await waitFor(() => {
      expect(trackingRecurringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Qualité du sommeil',
          responseType: 'choice',
          choices: ['Excellent', 'Bien', 'Moyen', 'Mauvais'],
        }),
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('affiche erreur si moins de 2 choix pour type QCM', async () => {
    render(<RecurringForm />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), { target: { value: 'Test QCM' } })

    const selects = screen.getAllByTestId('mock-select')
    fireEvent.change(selects[0], { target: { value: 'choice' } })

    const choicesInput = await waitFor(() => screen.getByLabelText(/Choix prédéfinis/i))
    fireEvent.change(choicesInput, { target: { value: 'Seul choix' } }) // un seul choix

    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))

    await waitFor(() => {
      expect(screen.getByText(/Entrez au moins 2 choix/i)).toBeInTheDocument()
    })
    expect(trackingRecurringRepository.create).not.toHaveBeenCalled()
  })

  it('affiche les jours de la semaine quand récurrence = weekly', async () => {
    render(<RecurringForm />)

    const selects = screen.getAllByTestId('mock-select')
    // Le dernier select est "Récurrence"
    const recurrenceSelect = selects[selects.length - 1]
    fireEvent.change(recurrenceSelect, { target: { value: 'weekly' } })

    await waitFor(() => {
      expect(screen.getByText(/Jours de la semaine \*/i)).toBeInTheDocument()
      expect(screen.getByText('Lun')).toBeInTheDocument()
    })
  })

  it('affiche le champ intervalDays quand récurrence = custom', async () => {
    render(<RecurringForm />)

    const selects = screen.getAllByTestId('mock-select')
    const recurrenceSelect = selects[selects.length - 1]
    fireEvent.change(recurrenceSelect, { target: { value: 'custom' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/Tous les N jours \*/i)).toBeInTheDocument()
    })
  })

  it('affiche erreur si aucun jour sélectionné pour récurrence hebdomadaire', async () => {
    render(<RecurringForm />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), { target: { value: 'Test' } })

    const selects = screen.getAllByTestId('mock-select')
    const recurrenceSelect = selects[selects.length - 1]
    fireEvent.change(recurrenceSelect, { target: { value: 'weekly' } })

    // Soumettre sans cocher de jour
    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))

    await waitFor(() => {
      expect(screen.getByText(/Sélectionnez au moins un jour/i)).toBeInTheDocument()
    })
    expect(trackingRecurringRepository.create).not.toHaveBeenCalled()
  })

  it("affiche erreur si l'intervalle est manquant pour récurrence personnalisée", async () => {
    render(<RecurringForm />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), { target: { value: 'Test' } })

    const selects = screen.getAllByTestId('mock-select')
    const recurrenceSelect = selects[selects.length - 1]
    fireEvent.change(recurrenceSelect, { target: { value: 'custom' } })

    // Soumettre sans saisir l'intervalle
    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))

    await waitFor(() => {
      expect(screen.getByText(/L'intervalle est requis/i)).toBeInTheDocument()
    })
    expect(trackingRecurringRepository.create).not.toHaveBeenCalled()
  })

  it('configure withUndo avec action et undoAction pour la création', async () => {
    render(<RecurringForm />)

    fireEvent.change(screen.getByLabelText(/Nom \*/i), {
      target: { value: 'Hydratation' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /créer le suivi/i }))

    await waitFor(() => {
      expect(mockWithUndo).toHaveBeenCalledWith(
        expect.stringContaining('créé'),
        expect.any(Function),
        expect.any(Function),
      )
    })
  })
})

describe('RecurringForm — édition', () => {
  it('pré-remplit le formulaire en mode édition', () => {
    render(<RecurringForm initialData={mockCreatedRecurring} />)
    expect(screen.getByDisplayValue('Heures de sommeil')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /modifier le suivi/i })).toBeInTheDocument()
  })

  it('appelle trackingRecurringRepository.update en mode édition', async () => {
    const onSuccess = vi.fn()
    render(<RecurringForm initialData={mockCreatedRecurring} onSuccess={onSuccess} />)

    const nameInput = screen.getByLabelText(/Nom \*/i)
    fireEvent.change(nameInput, { target: { value: 'Sommeil modifié' } })

    fireEvent.submit(screen.getByRole('button', { name: /modifier le suivi/i }))

    await waitFor(() => {
      expect(trackingRecurringRepository.update).toHaveBeenCalledWith(
        mockCreatedRecurring.id,
        expect.objectContaining({ name: 'Sommeil modifié' }),
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
