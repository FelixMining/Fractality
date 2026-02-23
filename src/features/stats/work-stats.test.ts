import { describe, it, expect } from 'vitest'
import {
  groupByDay,
  groupByProject,
  buildPropertyCurves,
  calcWorkTotals,
} from './work-stats'
import type { WorkSession } from '@/schemas/work-session.schema'
import type { Project } from '@/schemas/project.schema'

const BASE = {
  userId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
  title: 'Session test',
} satisfies Partial<WorkSession>

function makeSession(overrides: Partial<WorkSession>): WorkSession {
  return {
    id: 'id-1',
    date: '2026-01-15T10:00:00.000Z',
    duration: 3600,
    ...BASE,
    ...overrides,
  } as WorkSession
}

describe('groupByDay', () => {
  it('regroupe les sessions par jour et convertit en heures', () => {
    const sessions = [
      makeSession({ id: '1', date: '2026-01-15T08:00:00.000Z', duration: 3600 }),
      makeSession({ id: '2', date: '2026-01-15T14:00:00.000Z', duration: 1800 }),
      makeSession({ id: '3', date: '2026-01-16T09:00:00.000Z', duration: 7200 }),
    ]
    const result = groupByDay(sessions)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2026-01-15', heures: 1.5 })
    expect(result[1]).toEqual({ date: '2026-01-16', heures: 2 })
  })

  it('retourne un tableau vide pour des sessions vides', () => {
    expect(groupByDay([])).toEqual([])
  })

  it('trie par date croissante', () => {
    const sessions = [
      makeSession({ id: '1', date: '2026-01-20T10:00:00.000Z', duration: 3600 }),
      makeSession({ id: '2', date: '2026-01-10T10:00:00.000Z', duration: 3600 }),
    ]
    const result = groupByDay(sessions)
    expect(result[0].date).toBe('2026-01-10')
    expect(result[1].date).toBe('2026-01-20')
  })
})

describe('groupByProject', () => {
  const projects: Project[] = [
    {
      id: 'p1',
      name: 'Projet A',
      color: '#FF0000',
      parentId: null,
      userId: 'u1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
      deletedAt: null,
    },
  ]

  it('regroupe par projet avec couleur', () => {
    const sessions = [
      makeSession({ id: '1', projectId: 'p1' }),
      makeSession({ id: '2', projectId: 'p1' }),
      makeSession({ id: '3' }),
    ]
    const result = groupByProject(sessions, projects)
    const projA = result.find((r) => r.name === 'Projet A')
    const noProj = result.find((r) => r.name === 'Sans projet')
    expect(projA?.value).toBe(2)
    expect(projA?.color).toBe('#FF0000')
    expect(noProj?.value).toBe(1)
  })

  it('retourne "Sans projet" pour sessions sans projectId', () => {
    const sessions = [makeSession({ id: '1' })]
    const result = groupByProject(sessions, [])
    expect(result[0]).toMatchObject({ name: 'Sans projet', value: 1, color: '#6B7280' })
  })

  it('retourne tableau vide pour sessions vides', () => {
    expect(groupByProject([], [])).toEqual([])
  })
})

describe('buildPropertyCurves', () => {
  it('filtre les sessions sans propriétés', () => {
    const sessions = [
      makeSession({ id: '1', date: '2026-01-10T00:00:00.000Z' }),
      makeSession({ id: '2', date: '2026-01-11T00:00:00.000Z', productivity: 8 }),
      makeSession({ id: '3', date: '2026-01-12T00:00:00.000Z', concentration: 7 }),
    ]
    const result = buildPropertyCurves(sessions)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ date: '2026-01-11', productivite: 8 })
    expect(result[1]).toMatchObject({ date: '2026-01-12', concentration: 7 })
  })

  it('retourne tableau vide si aucune propriété', () => {
    const sessions = [makeSession({ id: '1' })]
    expect(buildPropertyCurves(sessions)).toEqual([])
  })
})

describe('calcWorkTotals', () => {
  it('calcule count et durée moyenne correctement', () => {
    const sessions = [
      makeSession({ id: '1', duration: 3600 }),
      makeSession({ id: '2', duration: 1800 }),
    ]
    const result = calcWorkTotals(sessions)
    expect(result.count).toBe(2)
    expect(result.avgDurationMin).toBe(45) // (3600+1800)/2/60 = 45
  })

  it('retourne 0 pour une liste vide', () => {
    const result = calcWorkTotals([])
    expect(result.count).toBe(0)
    expect(result.avgDurationMin).toBe(0)
  })
})
