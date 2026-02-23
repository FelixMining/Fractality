import { describe, it, expect } from 'vitest'
import { isDueOnDate, getScheduledDates } from './tracking.repository'
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'

// Helper pour créer un suivi de test
function makeRecurring(overrides: Partial<TrackingRecurring> = {}): TrackingRecurring {
  return {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    name: 'Test suivi',
    responseType: 'number',
    recurrenceType: 'daily',
    isActive: true,
    createdAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
    isDeleted: false,
    deletedAt: null,
    ...overrides,
  }
}

describe('isDueOnDate', () => {
  describe('récurrence quotidienne (daily)', () => {
    it('retourne true pour n\'importe quelle date', () => {
      const recurring = makeRecurring({ recurrenceType: 'daily' })
      expect(isDueOnDate(recurring, new Date('2026-02-10'))).toBe(true)
      expect(isDueOnDate(recurring, new Date('2026-06-15'))).toBe(true)
      expect(isDueOnDate(recurring, new Date('2026-12-31'))).toBe(true)
    })

    it('retourne true avec une date string YYYY-MM-DD', () => {
      const recurring = makeRecurring({ recurrenceType: 'daily' })
      expect(isDueOnDate(recurring, '2026-03-15')).toBe(true)
    })
  })

  describe('récurrence hebdomadaire (weekly)', () => {
    it('retourne true si le jour est dans daysOfWeek', () => {
      // Lundi = 1, Mercredi = 3, Vendredi = 5
      const recurring = makeRecurring({
        recurrenceType: 'weekly',
        daysOfWeek: [1, 3, 5],
      })
      // 2026-02-09 = Lundi
      expect(isDueOnDate(recurring, new Date('2026-02-09T12:00:00'))).toBe(true)
      // 2026-02-11 = Mercredi
      expect(isDueOnDate(recurring, new Date('2026-02-11T12:00:00'))).toBe(true)
      // 2026-02-13 = Vendredi
      expect(isDueOnDate(recurring, new Date('2026-02-13T12:00:00'))).toBe(true)
    })

    it('retourne false si le jour n\'est pas dans daysOfWeek', () => {
      const recurring = makeRecurring({
        recurrenceType: 'weekly',
        daysOfWeek: [1, 3, 5],
      })
      // 2026-02-10 = Mardi (2)
      expect(isDueOnDate(recurring, new Date('2026-02-10T12:00:00'))).toBe(false)
      // 2026-02-14 = Samedi (6)
      expect(isDueOnDate(recurring, new Date('2026-02-14T12:00:00'))).toBe(false)
    })

    it('retourne false si daysOfWeek est vide', () => {
      const recurring = makeRecurring({
        recurrenceType: 'weekly',
        daysOfWeek: [],
      })
      expect(isDueOnDate(recurring, new Date('2026-02-09T12:00:00'))).toBe(false)
    })

    it('retourne false si daysOfWeek est absent', () => {
      const recurring = makeRecurring({
        recurrenceType: 'weekly',
        daysOfWeek: undefined,
      })
      expect(isDueOnDate(recurring, new Date('2026-02-09T12:00:00'))).toBe(false)
    })

    it('gère le dimanche (0) correctement', () => {
      const recurring = makeRecurring({
        recurrenceType: 'weekly',
        daysOfWeek: [0], // dimanche
      })
      // 2026-02-08 = Dimanche
      expect(isDueOnDate(recurring, new Date('2026-02-08T12:00:00'))).toBe(true)
      // 2026-02-09 = Lundi
      expect(isDueOnDate(recurring, new Date('2026-02-09T12:00:00'))).toBe(false)
    })
  })

  describe('récurrence personnalisée (custom)', () => {
    it('retourne true le jour de création (diff = 0)', () => {
      const recurring = makeRecurring({
        recurrenceType: 'custom',
        intervalDays: 3,
        createdAt: '2026-01-01T10:00:00.000Z',
      })
      expect(isDueOnDate(recurring, '2026-01-01')).toBe(true)
    })

    it('retourne true à intervalDays jours de la création', () => {
      const recurring = makeRecurring({
        recurrenceType: 'custom',
        intervalDays: 3,
        createdAt: '2026-01-01T10:00:00.000Z',
      })
      // 2026-01-04 = 3 jours après (3 % 3 = 0)
      expect(isDueOnDate(recurring, '2026-01-04')).toBe(true)
      // 2026-01-07 = 6 jours après (6 % 3 = 0)
      expect(isDueOnDate(recurring, '2026-01-07')).toBe(true)
    })

    it('retourne false si le jour n\'est pas un multiple de intervalDays', () => {
      const recurring = makeRecurring({
        recurrenceType: 'custom',
        intervalDays: 3,
        createdAt: '2026-01-01T10:00:00.000Z',
      })
      // 2026-01-02 = 1 jour après (1 % 3 = 1 ≠ 0)
      expect(isDueOnDate(recurring, '2026-01-02')).toBe(false)
      // 2026-01-03 = 2 jours après (2 % 3 = 2 ≠ 0)
      expect(isDueOnDate(recurring, '2026-01-03')).toBe(false)
    })

    it('retourne false pour une date avant la création', () => {
      const recurring = makeRecurring({
        recurrenceType: 'custom',
        intervalDays: 3,
        createdAt: '2026-01-05T10:00:00.000Z',
      })
      expect(isDueOnDate(recurring, '2026-01-04')).toBe(false)
    })

    it('retourne false si intervalDays est absent', () => {
      const recurring = makeRecurring({
        recurrenceType: 'custom',
        intervalDays: undefined,
      })
      expect(isDueOnDate(recurring, new Date())).toBe(false)
    })
  })
})

describe('getScheduledDates', () => {
  it('retourne toutes les dates pour une récurrence quotidienne', () => {
    const recurring = makeRecurring({ recurrenceType: 'daily' })
    // new Date(year, month, day) utilise l'heure locale — pas de décalage timezone
    const from = new Date(2026, 0, 1)
    const to = new Date(2026, 0, 5)
    const dates = getScheduledDates(recurring, from, to)
    expect(dates).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ])
  })

  it('retourne seulement les jours planifiés pour récurrence hebdomadaire', () => {
    // Lundi = 1, Vendredi = 5
    const recurring = makeRecurring({
      recurrenceType: 'weekly',
      daysOfWeek: [1, 5],
    })
    // Semaine du 2026-01-05 (lundi) au 2026-01-11 (dimanche) — heure locale
    const from = new Date(2026, 0, 5) // Lundi
    const to = new Date(2026, 0, 11)  // Dimanche
    const dates = getScheduledDates(recurring, from, to)
    expect(dates).toContain('2026-01-05') // Lundi
    expect(dates).toContain('2026-01-09') // Vendredi
    expect(dates).toHaveLength(2)
  })

  it('retourne tableau vide si aucune date planifiée dans la période', () => {
    const recurring = makeRecurring({
      recurrenceType: 'weekly',
      daysOfWeek: [1], // seulement lundi
    })
    // Samedi au dimanche (aucun lundi)
    const from = new Date('2026-01-10')
    const to = new Date('2026-01-11')
    const dates = getScheduledDates(recurring, from, to)
    expect(dates).toHaveLength(0)
  })

  it('retourne tableau vide si from > to', () => {
    const recurring = makeRecurring({ recurrenceType: 'daily' })
    const from = new Date('2026-01-10')
    const to = new Date('2026-01-05')
    const dates = getScheduledDates(recurring, from, to)
    expect(dates).toHaveLength(0)
  })
})
