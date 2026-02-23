import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StockAlerts } from './stock-alerts'

const mockUseLiveQuery = vi.fn()
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

vi.mock('@/lib/db/database', () => ({ db: {} }))
vi.mock('@/lib/db/repositories/routine.repository', () => ({
  calculateDaysRemaining: vi.fn(),
}))

describe('StockAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne null (aucun rendu) quand aucun produit critique', () => {
    mockUseLiveQuery.mockReturnValue([])

    const { container } = render(<StockAlerts />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche un skeleton pendant le chargement (undefined)', () => {
    mockUseLiveQuery.mockReturnValue(undefined)

    const { container } = render(<StockAlerts />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('affiche les produits critiques avec leur nombre de jours restants', () => {
    mockUseLiveQuery.mockReturnValue([
      { id: '1', name: 'Whey', daysRemaining: 3 },
      { id: '2', name: 'Créatine', daysRemaining: 6 },
    ])

    render(<StockAlerts />)
    expect(screen.getByText('Whey')).toBeInTheDocument()
    expect(screen.getByText('Créatine')).toBeInTheDocument()
    expect(screen.getByText('3j restants')).toBeInTheDocument()
    expect(screen.getByText('6j restants')).toBeInTheDocument()
  })

  it('affiche "Épuisé" pour un produit avec 0 jours restants', () => {
    mockUseLiveQuery.mockReturnValue([{ id: '1', name: 'Magnésium', daysRemaining: 0 }])

    render(<StockAlerts />)
    expect(screen.getByText('Magnésium')).toBeInTheDocument()
    expect(screen.getByText('Épuisé')).toBeInTheDocument()
  })

  it('affiche le singulier pour 1 jour restant', () => {
    mockUseLiveQuery.mockReturnValue([{ id: '1', name: 'Vitamine D', daysRemaining: 1 }])

    render(<StockAlerts />)
    expect(screen.getByText('1j restant')).toBeInTheDocument()
  })
})
