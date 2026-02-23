import { describe, it, expect } from 'vitest'
import {
  applyRecurringFilters,
  countRecurringFilters,
  hasRecurringFilters,
  type RecurringFilters,
} from './recurring-list'

const makeRecurring = (overrides: Record<string, unknown> = {}) => ({
  id: 'rec-1',
  userId: 'user-1',
  name: 'Boire de l\'eau',
  responseType: 'boolean' as const,
  recurrenceType: 'daily' as const,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
  ...overrides,
})

const EMPTY_FILTERS: RecurringFilters = { recurrenceTypes: [] }

describe('applyRecurringFilters', () => {
  it('retourne tout si pas de filtre', () => {
    const recs = [
      makeRecurring(),
      makeRecurring({ id: 'rec-2', recurrenceType: 'weekly' }),
      makeRecurring({ id: 'rec-3', recurrenceType: 'custom' }),
    ]
    expect(applyRecurringFilters(recs as never, EMPTY_FILTERS)).toHaveLength(3)
  })

  it('filtre par recurrenceType', () => {
    const recs = [
      makeRecurring({ recurrenceType: 'daily' }),
      makeRecurring({ id: 'rec-2', recurrenceType: 'weekly' }),
      makeRecurring({ id: 'rec-3', recurrenceType: 'custom' }),
    ]
    const filtered = applyRecurringFilters(recs as never, { recurrenceTypes: ['daily', 'custom'] })
    expect(filtered).toHaveLength(2)
    expect(filtered.map((r) => r.id)).toEqual(['rec-1', 'rec-3'])
  })

  it('retourne [] si aucun ne correspond', () => {
    const recs = [makeRecurring({ recurrenceType: 'daily' })]
    const filtered = applyRecurringFilters(recs as never, { recurrenceTypes: ['weekly'] })
    expect(filtered).toHaveLength(0)
  })
})

describe('countRecurringFilters', () => {
  it('retourne 0 sans filtre', () => {
    expect(countRecurringFilters(EMPTY_FILTERS)).toBe(0)
  })

  it('retourne 1 si au moins un type sélectionné', () => {
    expect(countRecurringFilters({ recurrenceTypes: ['daily'] })).toBe(1)
    expect(countRecurringFilters({ recurrenceTypes: ['daily', 'weekly'] })).toBe(1)
  })
})

describe('hasRecurringFilters', () => {
  it('retourne false sans filtre', () => {
    expect(hasRecurringFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('retourne true si filtre actif', () => {
    expect(hasRecurringFilters({ recurrenceTypes: ['daily'] })).toBe(true)
  })
})
