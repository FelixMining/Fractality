import { describe, it, expect } from 'vitest'
import {
  applyJournalFilters,
  countJournalFilters,
  hasJournalFilters,
  type JournalFilters,
} from './journal-list'

const makeEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 'entry-1',
  userId: 'user-1',
  content: 'Test',
  entryDate: '2026-02-15T10:30',
  createdAt: '2026-02-15T10:30:00.000Z',
  updatedAt: '2026-02-15T10:30:00.000Z',
  isDeleted: false,
  deletedAt: null,
  projectId: undefined,
  ...overrides,
})

const EMPTY_FILTERS: JournalFilters = { projectId: null, from: '', to: '' }

describe('applyJournalFilters', () => {
  it('retourne tout si pas de filtre actif', () => {
    const entries = [makeEntry(), makeEntry({ id: 'entry-2', entryDate: '2026-02-20T09:00' })]
    expect(applyJournalFilters(entries as never, EMPTY_FILTERS)).toHaveLength(2)
  })

  it('filtre par projectId', () => {
    const entries = [
      makeEntry({ projectId: 'proj-1' }),
      makeEntry({ id: 'entry-2', projectId: 'proj-2' }),
      makeEntry({ id: 'entry-3', projectId: undefined }),
    ]
    const filtered = applyJournalFilters(entries as never, { ...EMPTY_FILTERS, projectId: 'proj-1' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('entry-1')
  })

  it('filtre par date "from"', () => {
    const entries = [
      makeEntry({ entryDate: '2026-02-10T10:00' }),
      makeEntry({ id: 'entry-2', entryDate: '2026-02-20T10:00' }),
    ]
    const filtered = applyJournalFilters(entries as never, { ...EMPTY_FILTERS, from: '2026-02-15' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('entry-2')
  })

  it('filtre par date "to"', () => {
    const entries = [
      makeEntry({ entryDate: '2026-02-10T10:00' }),
      makeEntry({ id: 'entry-2', entryDate: '2026-02-20T10:00' }),
    ]
    const filtered = applyJournalFilters(entries as never, { ...EMPTY_FILTERS, to: '2026-02-15' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('entry-1')
  })

  it('filtre par date range (from + to)', () => {
    const entries = [
      makeEntry({ entryDate: '2026-02-01T10:00' }),
      makeEntry({ id: 'entry-2', entryDate: '2026-02-15T10:00' }),
      makeEntry({ id: 'entry-3', entryDate: '2026-02-28T10:00' }),
    ]
    const filtered = applyJournalFilters(entries as never, {
      ...EMPTY_FILTERS,
      from: '2026-02-10',
      to: '2026-02-20',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('entry-2')
  })

  it('combine projectId + date range (ET logique)', () => {
    const entries = [
      makeEntry({ projectId: 'proj-1', entryDate: '2026-02-15T10:00' }),
      makeEntry({ id: 'entry-2', projectId: 'proj-1', entryDate: '2026-02-01T10:00' }),
      makeEntry({ id: 'entry-3', projectId: 'proj-2', entryDate: '2026-02-15T10:00' }),
    ]
    const filtered = applyJournalFilters(entries as never, {
      projectId: 'proj-1',
      from: '2026-02-10',
      to: '2026-02-20',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('entry-1')
  })

  it('retourne [] si aucune entrée ne correspond', () => {
    const entries = [makeEntry({ entryDate: '2026-01-01T10:00' })]
    const filtered = applyJournalFilters(entries as never, { ...EMPTY_FILTERS, from: '2026-02-01' })
    expect(filtered).toHaveLength(0)
  })
})

describe('countJournalFilters', () => {
  it('retourne 0 si pas de filtre', () => {
    expect(countJournalFilters(EMPTY_FILTERS)).toBe(0)
  })

  it('compte chaque filtre actif', () => {
    expect(countJournalFilters({ projectId: 'p', from: '', to: '' })).toBe(1)
    expect(countJournalFilters({ projectId: null, from: '2026-01-01', to: '' })).toBe(1)
    expect(countJournalFilters({ projectId: 'p', from: '2026-01-01', to: '2026-02-01' })).toBe(3)
  })
})

describe('hasJournalFilters', () => {
  it('retourne false si pas de filtre', () => {
    expect(hasJournalFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('retourne true si au moins un filtre', () => {
    expect(hasJournalFilters({ ...EMPTY_FILTERS, projectId: 'p' })).toBe(true)
  })
})
