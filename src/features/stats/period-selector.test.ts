import { describe, it, expect } from 'vitest'
import { getPeriodDates, PERIOD_OPTIONS, DEFAULT_PERIOD_DAYS } from './period-selector'

describe('getPeriodDates', () => {
  it('retourne startDate inférieure à endDate', () => {
    const { startDate, endDate } = getPeriodDates(30)
    expect(new Date(startDate).getTime()).toBeLessThan(new Date(endDate).getTime())
  })

  it('la différence est approximativement le nombre de jours demandé', () => {
    const days = 90
    const { startDate, endDate } = getPeriodDates(days)
    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    // Tolérance de 1 jour pour les secondes
    expect(diffDays).toBeGreaterThanOrEqual(days - 1)
    expect(diffDays).toBeLessThanOrEqual(days + 1)
  })

  it('retourne des dates en format ISO 8601', () => {
    const { startDate, endDate } = getPeriodDates(7)
    expect(() => new Date(startDate).toISOString()).not.toThrow()
    expect(() => new Date(endDate).toISOString()).not.toThrow()
  })
})

describe('PERIOD_OPTIONS', () => {
  it('contient 5 options avec les durées attendues', () => {
    expect(PERIOD_OPTIONS).toHaveLength(5)
    const days = PERIOD_OPTIONS.map((o) => o.days)
    expect(days).toContain(7)
    expect(days).toContain(30)
    expect(days).toContain(365)
  })
})

describe('DEFAULT_PERIOD_DAYS', () => {
  it('est 30 jours', () => {
    expect(DEFAULT_PERIOD_DAYS).toBe(30)
  })
})
