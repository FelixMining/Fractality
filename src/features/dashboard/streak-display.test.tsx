import { describe, it, expect } from 'vitest'
import { calculateStreak, getLast7Days } from './streak-display'

describe('calculateStreak', () => {
  const TODAY = '2026-02-23'

  it('retourne 0 quand aucune activité', () => {
    const dates = new Set<string>()
    expect(calculateStreak(dates, TODAY)).toBe(0)
  })

  it('retourne 1 quand uniquement today a une activité', () => {
    const dates = new Set(['2026-02-23'])
    expect(calculateStreak(dates, TODAY)).toBe(1)
  })

  it('retourne le bon nombre de jours consécutifs', () => {
    const dates = new Set(['2026-02-21', '2026-02-22', '2026-02-23'])
    expect(calculateStreak(dates, TODAY)).toBe(3)
  })

  it('s\'arrête si un jour est manqué', () => {
    // 23, 22 actifs, mais 21 manqué, 20 actif → streak = 2
    const dates = new Set(['2026-02-20', '2026-02-22', '2026-02-23'])
    expect(calculateStreak(dates, TODAY)).toBe(2)
  })

  it('retourne 0 si today n\'a pas d\'activité (streak cassé)', () => {
    // Hier actif mais aujourd'hui non → streak = 0 (aujourd'hui pas encore commencé)
    const dates = new Set(['2026-02-22', '2026-02-21'])
    expect(calculateStreak(dates, TODAY)).toBe(0)
  })

  it('gère les séquences longues correctement', () => {
    const dates = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const d = new Date('2026-02-23T12:00:00')
      d.setDate(d.getDate() - i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      dates.add(`${y}-${m}-${day}`)
    }
    expect(calculateStreak(dates, TODAY)).toBe(30)
  })
})

describe('getLast7Days', () => {
  const TODAY = '2026-02-23'

  it('retourne exactement 7 jours', () => {
    const days = getLast7Days(TODAY)
    expect(days).toHaveLength(7)
  })

  it('le dernier élément est today', () => {
    const days = getLast7Days(TODAY)
    expect(days[6]).toBe(TODAY)
  })

  it('le premier élément est J-6', () => {
    const days = getLast7Days(TODAY)
    expect(days[0]).toBe('2026-02-17')
  })

  it('les jours sont dans l\'ordre croissant', () => {
    const days = getLast7Days(TODAY)
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true)
    }
  })

  it('gère le changement de mois', () => {
    const days = getLast7Days('2026-03-03')
    expect(days[0]).toBe('2026-02-25')
    expect(days[6]).toBe('2026-03-03')
  })
})
