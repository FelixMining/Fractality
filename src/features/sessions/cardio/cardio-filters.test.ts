import { describe, it, expect } from 'vitest'
import {
  applyCardioFilters,
  countCardioFilters,
  hasCardioFilters,
  type CardioFilters,
} from './cardio-session-list'

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  title: 'Test run',
  date: '2026-02-15T10:00:00.000Z',
  activityType: 'running' as const,
  duration: 3600,
  createdAt: '2026-02-15T10:00:00.000Z',
  updatedAt: '2026-02-15T10:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
  projectId: undefined,
  inputMode: 'manual' as const,
  ...overrides,
})

const EMPTY_FILTERS: CardioFilters = {
  projectId: null,
  from: '',
  to: '',
  activityTypes: [],
}

describe('applyCardioFilters', () => {
  it('retourne tout si pas de filtre', () => {
    const sessions = [makeSession(), makeSession({ id: 's2' })]
    expect(applyCardioFilters(sessions as never, EMPTY_FILTERS)).toHaveLength(2)
  })

  it('filtre par projectId', () => {
    const sessions = [
      makeSession({ projectId: 'proj-1' }),
      makeSession({ id: 's2', projectId: 'proj-2' }),
    ]
    const filtered = applyCardioFilters(sessions as never, { ...EMPTY_FILTERS, projectId: 'proj-1' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('session-1')
  })

  it('filtre par activityType', () => {
    const sessions = [
      makeSession({ activityType: 'running' }),
      makeSession({ id: 's2', activityType: 'cycling' }),
      makeSession({ id: 's3', activityType: 'walking' }),
    ]
    const filtered = applyCardioFilters(sessions as never, {
      ...EMPTY_FILTERS,
      activityTypes: ['running', 'walking'],
    })
    expect(filtered).toHaveLength(2)
    expect(filtered.map((s) => s.id)).toEqual(['session-1', 's3'])
  })

  it('filtre par date "from" (timezone-safe via toLocalDateString)', () => {
    const sessions = [
      makeSession({ date: '2026-02-10T10:00:00.000Z' }),
      makeSession({ id: 's2', date: '2026-02-20T10:00:00.000Z' }),
    ]
    const filtered = applyCardioFilters(sessions as never, { ...EMPTY_FILTERS, from: '2026-02-15' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('s2')
  })

  it('filtre par date "to"', () => {
    const sessions = [
      makeSession({ date: '2026-02-10T10:00:00.000Z' }),
      makeSession({ id: 's2', date: '2026-02-20T10:00:00.000Z' }),
    ]
    const filtered = applyCardioFilters(sessions as never, { ...EMPTY_FILTERS, to: '2026-02-15' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('session-1')
  })

  it('combine tous les filtres (ET logique)', () => {
    const sessions = [
      makeSession({ projectId: 'proj-1', activityType: 'running', date: '2026-02-15T10:00:00.000Z' }),
      makeSession({ id: 's2', projectId: 'proj-1', activityType: 'cycling', date: '2026-02-15T10:00:00.000Z' }),
      makeSession({ id: 's3', projectId: 'proj-2', activityType: 'running', date: '2026-02-15T10:00:00.000Z' }),
      makeSession({ id: 's4', projectId: 'proj-1', activityType: 'running', date: '2026-02-01T10:00:00.000Z' }),
    ]
    const filtered = applyCardioFilters(sessions as never, {
      projectId: 'proj-1',
      from: '2026-02-10',
      to: '2026-02-20',
      activityTypes: ['running'],
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('session-1')
  })
})

describe('countCardioFilters', () => {
  it('retourne 0 si pas de filtre', () => {
    expect(countCardioFilters(EMPTY_FILTERS)).toBe(0)
  })

  it('compte chaque filtre actif', () => {
    expect(countCardioFilters({ ...EMPTY_FILTERS, projectId: 'p' })).toBe(1)
    expect(countCardioFilters({ ...EMPTY_FILTERS, activityTypes: ['running', 'cycling'] })).toBe(1)
    expect(
      countCardioFilters({ projectId: 'p', from: '2026-01-01', to: '2026-02-01', activityTypes: ['running'] }),
    ).toBe(4)
  })
})

describe('hasCardioFilters', () => {
  it('retourne false si pas de filtre', () => {
    expect(hasCardioFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('retourne true si au moins un filtre', () => {
    expect(hasCardioFilters({ ...EMPTY_FILTERS, activityTypes: ['running'] })).toBe(true)
  })
})
