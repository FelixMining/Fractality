import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardioSessionForm } from './cardio-session-form'
import { cardioSessionRepository } from '@/lib/db/repositories/cardio-session.repository'

// Mock du repository
vi.mock('@/lib/db/repositories/cardio-session.repository', () => ({
  cardioSessionRepository: {
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  },
}))

// Mock du ProjectPicker
vi.mock('@/components/shared/project-picker', () => ({
  ProjectPicker: ({ onChange }: { onChange: (v: string | null) => void }) => (
    <button onClick={() => onChange(null)}>ProjectPicker</button>
  ),
}))

// Mock de sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('CardioSessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche les onglets GPX et Manuel en mode création', () => {
    render(<CardioSessionForm />)

    expect(screen.getByText('Import GPX')).toBeTruthy()
    expect(screen.getByText('Saisie manuelle')).toBeTruthy()
  })

  it('affiche le champ titre comme requis', () => {
    render(<CardioSessionForm />)

    const titleInput = screen.getByPlaceholderText('Ex: Course matinale au parc')
    expect(titleInput).toBeTruthy()
  })

  it('affiche une erreur de validation si le titre est vide et soumis', async () => {
    render(<CardioSessionForm />)

    const submitBtn = screen.getByRole('button', { name: /créer la session/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Le titre est requis')).toBeTruthy()
    })
  })

  it('n\'affiche pas les onglets en mode édition', () => {
    const mockSession = {
      id: 'test-id',
      userId: 'user-1',
      title: 'Test session',
      date: new Date().toISOString(),
      activityType: 'running' as const,
      duration: 3600,
      inputMode: 'manual' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
    }

    render(<CardioSessionForm initialData={mockSession} />)

    expect(screen.queryByText('Import GPX')).toBeNull()
    expect(screen.queryByText('Saisie manuelle')).toBeNull()
    expect(screen.getByRole('button', { name: /modifier/i })).toBeTruthy()
  })

  it('affiche le champ distance après switch en mode manuel', async () => {
    const user = userEvent.setup()
    render(<CardioSessionForm />)

    // Le champ distance est absent par défaut (mode GPX)
    expect(screen.queryByPlaceholderText('Ex: 5.50')).toBeNull()

    // Switcher en mode manuel via userEvent
    const manualTab = screen.getByText('Saisie manuelle')
    await user.click(manualTab)

    // Le champ distance doit apparaître
    const distanceInput = await screen.findByPlaceholderText('Ex: 5.50')
    expect(distanceInput).toBeTruthy()
  })

  it('affiche le champ date/heure en mode manuel, absent en mode GPX', async () => {
    const user = userEvent.setup()
    render(<CardioSessionForm />)

    // En mode GPX (par défaut), le champ date ne doit pas apparaître
    expect(screen.queryByLabelText('Date et heure de la session')).toBeNull()

    // Passer en mode manuel
    const manualTab = screen.getByText('Saisie manuelle')
    await user.click(manualTab)

    // Le champ date doit apparaître
    const dateInput = await screen.findByLabelText('Date et heure de la session')
    expect(dateInput).toBeTruthy()
  })

  it('affiche le preview de vitesse en mode manuel quand distance et durée sont renseignées', async () => {
    const user = userEvent.setup()
    render(<CardioSessionForm />)

    // Passer en mode manuel
    const manualTab = screen.getByText('Saisie manuelle')
    await user.click(manualTab)

    // Saisir une durée : 1 heure
    const hoursInput = screen.getByLabelText('Heures')
    await user.clear(hoursInput)
    await user.type(hoursInput, '1')

    // Saisir une distance : 10 km
    const distanceInput = await screen.findByPlaceholderText('Ex: 5.50')
    await user.type(distanceInput, '10')

    // Le preview vitesse doit apparaître (~10 km/h)
    await waitFor(() => {
      const preview = screen.queryByText(/Vitesse moyenne calculée/i)
      expect(preview).toBeTruthy()
    })
  })

  it('n\'affiche pas le preview de vitesse en mode manuel sans distance', async () => {
    const user = userEvent.setup()
    render(<CardioSessionForm />)

    // Passer en mode manuel
    const manualTab = screen.getByText('Saisie manuelle')
    await user.click(manualTab)

    // Saisir une durée mais pas de distance
    const hoursInput = screen.getByLabelText('Heures')
    await user.clear(hoursInput)
    await user.type(hoursInput, '1')

    // Le preview vitesse ne doit pas apparaître (attendre les re-renders)
    await waitFor(() => {
      expect(screen.queryByText(/Vitesse moyenne calculée/i)).toBeNull()
    })
  })

  it('passe la date saisie à create() lors de la création manuelle (AC4/AC5)', async () => {
    const user = userEvent.setup()
    render(<CardioSessionForm />)

    // Passer en mode manuel
    const manualTab = screen.getByText('Saisie manuelle')
    await user.click(manualTab)

    // Saisir le titre
    const titleInput = screen.getByPlaceholderText('Ex: Course matinale au parc')
    await user.type(titleInput, 'Run du matin')

    // Saisir une durée valide : 30 minutes
    const minutesInput = screen.getByLabelText('Minutes')
    await user.clear(minutesInput)
    await user.type(minutesInput, '30')

    // Modifier la date pour une date passée
    const dateInput = screen.getByLabelText('Date et heure de la session')
    await user.clear(dateInput)
    await user.type(dateInput, '2026-01-15T10:00')

    // Soumettre
    const submitBtn = screen.getByRole('button', { name: /créer la session/i })
    await user.click(submitBtn)

    // Vérifier que create() est appelé avec la date ISO correcte
    await waitFor(() => {
      expect(cardioSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.stringContaining('2026-01-15'),
          inputMode: 'manual',
        }),
      )
    })
  })
})
