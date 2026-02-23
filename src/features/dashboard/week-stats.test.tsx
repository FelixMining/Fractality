import { describe, it, expect } from 'vitest'
import { getWeekRange, getDaysFromWeekStart } from './week-stats'

describe('getWeekRange', () => {
  it('retourne le lundi et dimanche pour un lundi', () => {
    const { weekStart, weekEnd } = getWeekRange('2026-02-23') // lundi
    expect(weekStart).toBe('2026-02-23')
    expect(weekEnd).toBe('2026-03-01')
  })

  it('retourne le lundi et dimanche pour un mercredi', () => {
    const { weekStart, weekEnd } = getWeekRange('2026-02-25') // mercredi
    expect(weekStart).toBe('2026-02-23')
    expect(weekEnd).toBe('2026-03-01')
  })

  it('retourne le lundi et dimanche pour un dimanche', () => {
    const { weekStart, weekEnd } = getWeekRange('2026-03-01') // dimanche
    expect(weekStart).toBe('2026-02-23')
    expect(weekEnd).toBe('2026-03-01')
  })

  it('gère le changement de mois correctement', () => {
    const { weekStart, weekEnd } = getWeekRange('2026-02-01') // dimanche 1 feb
    expect(weekStart).toBe('2026-01-26') // lundi 26 jan
    expect(weekEnd).toBe('2026-02-01') // dimanche 1 feb
  })

  it('gère le changement d\'année', () => {
    const { weekStart, weekEnd } = getWeekRange('2026-01-02') // vendredi
    expect(weekStart).toBe('2025-12-29')
    expect(weekEnd).toBe('2026-01-04')
  })
})

describe('getDaysFromWeekStart', () => {
  it('retourne tous les jours de lundi à today', () => {
    const days = getDaysFromWeekStart('2026-02-23', '2026-02-25')
    expect(days).toEqual(['2026-02-23', '2026-02-24', '2026-02-25'])
  })

  it('retourne uniquement today si weekStart === today', () => {
    const days = getDaysFromWeekStart('2026-02-23', '2026-02-23')
    expect(days).toEqual(['2026-02-23'])
  })

  it('gère le changement de mois', () => {
    const days = getDaysFromWeekStart('2026-01-30', '2026-02-02')
    expect(days).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02'])
  })
})
