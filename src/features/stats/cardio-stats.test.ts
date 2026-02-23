import { describe, it, expect } from 'vitest'
import {
  filterCardioByPeriod,
  calcCardioTotals,
  countSessionsPerWeek,
  buildMetricCurve,
} from './cardio-stats'
import type { CardioSession } from '@/schemas/cardio-session.schema'

const BASE = {
  userId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
  title: 'Run',
  activityType: 'running' as const,
  inputMode: 'manual' as const,
}

function makeSession(overrides: Partial<CardioSession>): CardioSession {
  return {
    id: 'cs-1',
    date: '2026-01-15T10:00:00.000Z',
    duration: 3600,
    ...BASE,
    ...overrides,
  } as CardioSession
}

describe('filterCardioByPeriod', () => {
  it('filtre les sessions hors période', () => {
    const sessions = [
      makeSession({ id: '1', date: '2026-01-05T00:00:00.000Z' }),
      makeSession({ id: '2', date: '2026-01-15T00:00:00.000Z' }),
      makeSession({ id: '3', date: '2026-01-25T00:00:00.000Z' }),
    ]
    const result = filterCardioByPeriod(
      sessions,
      '2026-01-10T00:00:00.000Z',
      '2026-01-20T00:00:00.000Z',
    )
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})

describe('calcCardioTotals', () => {
  it('calcule les totaux correctement', () => {
    const sessions = [
      makeSession({ id: '1', duration: 3600, distance: 10000, elevationGain: 200 }),
      makeSession({ id: '2', duration: 1800, distance: 5000, elevationGain: 100 }),
    ]
    const result = calcCardioTotals(sessions)
    expect(result.totalDistanceKm).toBe(15)
    expect(result.totalElevationM).toBe(300)
    expect(result.totalDurationH).toBe(1.5)
  })

  it('gère les sessions sans distance ni dénivelé', () => {
    const sessions = [makeSession({ id: '1', duration: 3600 })]
    const result = calcCardioTotals(sessions)
    expect(result.totalDistanceKm).toBe(0)
    expect(result.totalElevationM).toBe(0)
    expect(result.totalDurationH).toBe(1)
  })

  it('retourne zéros pour liste vide', () => {
    const result = calcCardioTotals([])
    expect(result.totalDistanceKm).toBe(0)
    expect(result.totalElevationM).toBe(0)
    expect(result.totalDurationH).toBe(0)
  })
})

describe('countSessionsPerWeek', () => {
  it('compte les sessions par semaine', () => {
    const sessions = [
      makeSession({ id: '1', date: '2026-01-12T10:00:00.000Z' }),
      makeSession({ id: '2', date: '2026-01-14T10:00:00.000Z' }),
      makeSession({ id: '3', date: '2026-01-19T10:00:00.000Z' }),
    ]
    const result = countSessionsPerWeek(sessions)
    expect(result).toHaveLength(2)
    expect(result[0].seances).toBe(2)
    expect(result[1].seances).toBe(1)
  })

  it('retourne tableau vide pour sessions vides', () => {
    expect(countSessionsPerWeek([])).toEqual([])
  })
})

describe('buildMetricCurve', () => {
  it('construit courbe distance en km', () => {
    const sessions = [
      makeSession({ id: '1', date: '2026-01-15T10:00:00.000Z', distance: 10000 }),
      makeSession({ id: '2', date: '2026-01-20T10:00:00.000Z', distance: 15000 }),
    ]
    const result = buildMetricCurve(sessions, 'distance')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2026-01-15', valeur: 10 })
    expect(result[1]).toEqual({ date: '2026-01-20', valeur: 15 })
  })

  it('filtre les sessions sans la métrique demandée', () => {
    const sessions = [
      makeSession({ id: '1', distance: 5000 }),
      makeSession({ id: '2' }), // pas de distance
    ]
    const result = buildMetricCurve(sessions, 'distance')
    expect(result).toHaveLength(1)
  })

  it('retourne tableau vide si aucune session avec la métrique', () => {
    const sessions = [makeSession({ id: '1' })]
    expect(buildMetricCurve(sessions, 'vitesse')).toEqual([])
  })
})
