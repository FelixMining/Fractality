import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from './dashboard-page'

// Mock dexie-react-hooks
const mockUseLiveQuery = vi.fn()
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

// Mock db — prevent real IndexedDB access
vi.mock('@/lib/db/database', () => ({
  db: {
    work_sessions: { filter: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0) }) },
    workout_sessions: { filter: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0) }) },
    cardio_sessions: { filter: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0) }) },
    tracking_events: { filter: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0) }) },
    journal_entries: { filter: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0) }) },
    tracking_recurrings: { filter: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0) }) },
  },
}))

// Mock sub-components pour isoler DashboardPage
vi.mock('./today-summary', () => ({
  TodaySummary: () => <div data-testid="today-summary">TodaySummary</div>,
}))

vi.mock('./stock-alerts', () => ({
  StockAlerts: () => <div data-testid="stock-alerts">StockAlerts</div>,
}))

vi.mock('./week-stats', () => ({
  WeekStats: () => <div data-testid="week-stats">WeekStats</div>,
}))

vi.mock('./streak-display', () => ({
  StreakDisplay: () => <div data-testid="streak-display">StreakDisplay</div>,
}))

vi.mock('./activity-feed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed">ActivityFeed</div>,
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche un skeleton de chargement quand hasAnyData est undefined', () => {
    mockUseLiveQuery.mockReturnValue(undefined)

    const { container } = render(<DashboardPage />)
    // Skeletons = divs avec animate-pulse
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)

    expect(screen.queryByTestId('today-summary')).not.toBeInTheDocument()
    expect(screen.queryByTestId('activity-feed')).not.toBeInTheDocument()
  })

  it('affiche EmptyState quand aucune donnée', () => {
    mockUseLiveQuery.mockReturnValue(false)

    render(<DashboardPage />)

    expect(screen.getByText('Bienvenue sur Fractality !')).toBeInTheDocument()
    expect(screen.getByText(/Commencez par ajouter/)).toBeInTheDocument()
    expect(screen.queryByTestId('today-summary')).not.toBeInTheDocument()
  })

  it('affiche TodaySummary et ActivityFeed quand des données existent', () => {
    mockUseLiveQuery.mockReturnValue(true)

    render(<DashboardPage />)

    expect(screen.getByTestId('today-summary')).toBeInTheDocument()
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument()
    expect(screen.queryByText('Bienvenue sur Fractality !')).not.toBeInTheDocument()
  })

  it('affiche StockAlerts, WeekStats et StreakDisplay quand des données existent', () => {
    mockUseLiveQuery.mockReturnValue(true)

    render(<DashboardPage />)

    expect(screen.getByTestId('stock-alerts')).toBeInTheDocument()
    expect(screen.getByTestId('week-stats')).toBeInTheDocument()
    expect(screen.getByTestId('streak-display')).toBeInTheDocument()
  })

  it("n'affiche pas les nouvelles sections en état vide", () => {
    mockUseLiveQuery.mockReturnValue(false)

    render(<DashboardPage />)

    expect(screen.queryByTestId('stock-alerts')).not.toBeInTheDocument()
    expect(screen.queryByTestId('week-stats')).not.toBeInTheDocument()
    expect(screen.queryByTestId('streak-display')).not.toBeInTheDocument()
  })
})
