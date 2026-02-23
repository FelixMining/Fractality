import { describe, it, expect } from 'vitest'
import {
  filterSessionsByPeriod,
  calcVolumePerSession,
  calcFrequencyPerWeek,
  calcWorkoutTotals,
  buildWeightProgressByExercise,
} from './workout-stats'
import type { WorkoutSession } from '@/schemas/workout-session.schema'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'

const BASE_SESSION = {
  userId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
  status: 'completed' as const,
}

function makeSession(overrides: Partial<WorkoutSession>): WorkoutSession {
  return {
    id: 'sid-1',
    startedAt: '2026-01-15T10:00:00.000Z',
    completedAt: '2026-01-15T11:00:00.000Z',
    totalVolume: 1000,
    ...BASE_SESSION,
    ...overrides,
  } as WorkoutSession
}

function makeSeries(overrides: Partial<WorkoutSeries>): WorkoutSeries {
  return {
    id: 'ser-1',
    sessionId: 'sid-1',
    exerciseId: 'ex-1',
    order: 0,
    reps: 10,
    weight: 100,
    completed: true,
    userId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isDeleted: false,
    deletedAt: null,
    ...overrides,
  } as WorkoutSeries
}

describe('filterSessionsByPeriod', () => {
  it('filtre les sessions hors de la période', () => {
    const sessions = [
      makeSession({ id: '1', startedAt: '2026-01-10T10:00:00.000Z' }),
      makeSession({ id: '2', startedAt: '2026-01-20T10:00:00.000Z' }),
      makeSession({ id: '3', startedAt: '2026-01-30T10:00:00.000Z' }),
    ]
    const result = filterSessionsByPeriod(
      sessions,
      '2026-01-15T00:00:00.000Z',
      '2026-01-25T00:00:00.000Z',
    )
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})

describe('calcVolumePerSession', () => {
  it('calcule le volume par séance complétée', () => {
    const sessions = [
      makeSession({ id: '1', completedAt: '2026-01-15T11:00:00.000Z', totalVolume: 1500 }),
      makeSession({ id: '2', status: 'in-progress', completedAt: undefined, totalVolume: 0 }),
    ]
    const result = calcVolumePerSession(sessions)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ date: '2026-01-15', volume: 1500 })
  })

  it('retourne tableau vide si aucune séance complétée', () => {
    const sessions = [makeSession({ status: 'in-progress', completedAt: undefined })]
    expect(calcVolumePerSession(sessions)).toEqual([])
  })
})

describe('calcFrequencyPerWeek', () => {
  it('compte les séances par semaine', () => {
    const sessions = [
      makeSession({ id: '1', completedAt: '2026-01-12T11:00:00.000Z' }), // semaine du 12
      makeSession({ id: '2', completedAt: '2026-01-13T11:00:00.000Z' }), // même semaine
      makeSession({ id: '3', completedAt: '2026-01-19T11:00:00.000Z' }), // semaine suivante
    ]
    const result = calcFrequencyPerWeek(sessions)
    expect(result).toHaveLength(2)
    expect(result[0].seances).toBe(2)
    expect(result[1].seances).toBe(1)
  })
})

describe('calcWorkoutTotals', () => {
  it('calcule totaux correctement', () => {
    const sessions = [
      makeSession({ id: 'sid-1' }),
      makeSession({ id: 'sid-2' }),
    ]
    const series = [
      makeSeries({ id: 'ser-1', sessionId: 'sid-1', reps: 10, weight: 100 }),
      makeSeries({ id: 'ser-2', sessionId: 'sid-1', reps: 8, weight: 80 }),
      makeSeries({ id: 'ser-3', sessionId: 'sid-2', reps: 12, weight: 60 }),
    ]
    const result = calcWorkoutTotals(sessions, series)
    expect(result.totalSessions).toBe(2)
    expect(result.totalSeries).toBe(3)
    expect(result.totalVolume).toBe(10 * 100 + 8 * 80 + 12 * 60) // 1000 + 640 + 720 = 2360
  })

  it('ignore les séries supprimées', () => {
    const sessions = [makeSession({ id: 'sid-1' })]
    const series = [
      makeSeries({ id: 'ser-1', sessionId: 'sid-1', reps: 10, weight: 100 }),
      makeSeries({ id: 'ser-2', sessionId: 'sid-1', reps: 10, weight: 100, isDeleted: true }),
    ]
    const result = calcWorkoutTotals(sessions, series)
    expect(result.totalSeries).toBe(1)
    expect(result.totalVolume).toBe(1000)
  })
})

describe('buildWeightProgressByExercise', () => {
  const exercises: WorkoutExercise[] = [
    {
      id: 'ex-1',
      name: 'Squat',
      muscleGroup: 'legs',
      userId: 'u1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
      deletedAt: null,
    },
  ]

  it('retourne la charge max par date', () => {
    const sessions = [
      makeSession({ id: 'sid-1', completedAt: '2026-01-15T11:00:00.000Z' }),
    ]
    const series = [
      makeSeries({ id: 'ser-1', sessionId: 'sid-1', exerciseId: 'ex-1', weight: 80 }),
      makeSeries({ id: 'ser-2', sessionId: 'sid-1', exerciseId: 'ex-1', weight: 100 }),
    ]
    const result = buildWeightProgressByExercise(sessions, series, exercises, 'ex-1')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ date: '2026-01-15', charge: 100 })
  })

  it('retourne tableau vide pour exercice inexistant', () => {
    expect(buildWeightProgressByExercise([], [], exercises, 'unknown')).toEqual([])
  })
})
