import { describe, it, expect } from 'vitest'
import {
  applyWorkFilters,
  countWorkFilters,
  hasWorkFilters,
  type WorkFilters,
} from './work-session-list'

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  title: 'Deep work',
  date: '2026-02-15T10:00:00.000Z',
  duration: 7200,
  createdAt: '2026-02-15T10:00:00.000Z',
  updatedAt: '2026-02-15T10:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
  projectId: undefined,
  ...overrides,
})

const EMPTY_FILTERS: WorkFilters = { projectId: null, from: '', to: '' }

describe('applyWorkFilters', () => {
  it('retourne tout si pas de filtre', () => {
    const sessions = [makeSession(), makeSession({ id: 's2' })]
    expect(applyWorkFilters(sessions as never, EMPTY_FILTERS)).toHaveLength(2)
  })

  it('filtre par projectId', () => {
    const sessions = [
      makeSession({ projectId: 'proj-A' }),
      makeSession({ id: 's2', projectId: 'proj-B' }),
      makeSession({ id: 's3', projectId: undefined }),
    ]
    const filtered = applyWorkFilters(sessions as never, { ...EMPTY_FILTERS, projectId: 'proj-A' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('session-1')
  })

  it('filtre par date from', () => {
    const sessions = [
      makeSession({ date: '2026-02-01T10:00:00.000Z' }),
      makeSession({ id: 's2', date: '2026-02-20T10:00:00.000Z' }),
    ]
    const filtered = applyWorkFilters(sessions as never, { ...EMPTY_FILTERS, from: '2026-02-15' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('s2')
  })

  it('filtre par date to', () => {
    const sessions = [
      makeSession({ date: '2026-02-01T10:00:00.000Z' }),
      makeSession({ id: 's2', date: '2026-02-20T10:00:00.000Z' }),
    ]
    const filtered = applyWorkFilters(sessions as never, { ...EMPTY_FILTERS, to: '2026-02-15' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('session-1')
  })

  it('retourne [] si aucune session ne correspond', () => {
    const sessions = [makeSession({ date: '2026-01-01T10:00:00.000Z' })]
    expect(applyWorkFilters(sessions as never, { ...EMPTY_FILTERS, from: '2026-06-01' })).toHaveLength(0)
  })
})

describe('countWorkFilters', () => {
  it('retourne 0 sans filtre', () => {
    expect(countWorkFilters(EMPTY_FILTERS)).toBe(0)
  })

  it('compte les filtres actifs', () => {
    expect(countWorkFilters({ projectId: 'p', from: '', to: '' })).toBe(1)
    expect(countWorkFilters({ projectId: 'p', from: '2026-01-01', to: '2026-02-01' })).toBe(3)
  })
})

describe('hasWorkFilters', () => {
  it('retourne false sans filtre', () => {
    expect(hasWorkFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('retourne true avec au moins un filtre', () => {
    expect(hasWorkFilters({ ...EMPTY_FILTERS, from: '2026-01-01' })).toBe(true)
  })
})
