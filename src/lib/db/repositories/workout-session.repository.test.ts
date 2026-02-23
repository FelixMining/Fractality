import { describe, it, expect, vi } from 'vitest'

// Mock Dexie database
const mockSessions = [
  {
    id: 'session-1',
    userId: 'user-1',
    startedAt: '2026-01-10T10:00:00.000Z',
    completedAt: '2026-01-10T11:30:00.000Z',
    status: 'completed',
    totalDuration: 5400,
    totalVolume: 1000,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T11:30:00.000Z',
  },
  {
    id: 'session-2',
    userId: 'user-1',
    startedAt: '2026-01-15T09:00:00.000Z',
    completedAt: '2026-01-15T10:15:00.000Z',
    status: 'completed',
    totalDuration: 4500,
    totalVolume: 1200,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T10:15:00.000Z',
  },
  {
    id: 'session-3',
    userId: 'user-1',
    startedAt: '2026-01-08T08:00:00.000Z',
    completedAt: null,
    status: 'abandoned',
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-01-08T08:00:00.000Z',
    updatedAt: '2026-01-08T08:30:00.000Z',
  },
  {
    id: 'session-4',
    userId: 'user-1',
    startedAt: '2026-01-20T07:00:00.000Z',
    completedAt: '2026-01-20T08:30:00.000Z',
    status: 'completed',
    totalDuration: 5400,
    totalVolume: 800,
    isDeleted: true,
    deletedAt: '2026-01-21T00:00:00.000Z',
    createdAt: '2026-01-20T07:00:00.000Z',
    updatedAt: '2026-01-21T00:00:00.000Z',
  },
]

vi.mock('@/lib/db/database', () => ({
  db: {
    workout_sessions: {
      filter: vi.fn((filterFn) => ({
        toArray: vi.fn(() => Promise.resolve(mockSessions.filter(filterFn))),
      })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
      get: vi.fn(),
      put: vi.fn(),
    },
    workout_series: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    },
    syncQueue: { add: vi.fn() },
  },
}))

vi.mock('@/lib/sync/sync-registry', () => ({
  syncRegistry: {
    isRegistered: vi.fn(() => false),
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
  },
}))

describe('WorkoutSessionRepository', () => {
  describe('getCompletedSessions', () => {
    it('devrait retourner uniquement les séances avec status="completed"', async () => {
      const { workoutSessionRepository } = await import('./workout-session.repository')
      const sessions = await workoutSessionRepository.getCompletedSessions()

      // session-3 (abandoned) et session-4 (deleted) doivent être exclus
      expect(sessions.every((s) => s.status === 'completed')).toBe(true)
    })

    it('devrait exclure les séances soft-deletées', async () => {
      const { workoutSessionRepository } = await import('./workout-session.repository')
      const sessions = await workoutSessionRepository.getCompletedSessions()

      expect(sessions.find((s) => s.id === 'session-4')).toBeUndefined()
    })

    it('devrait trier par startedAt DESC (plus récente en premier)', async () => {
      const { workoutSessionRepository } = await import('./workout-session.repository')
      const sessions = await workoutSessionRepository.getCompletedSessions()

      // Uniquement session-1 et session-2 sont completed + non deleted
      // session-2 (2026-01-15) doit être avant session-1 (2026-01-10)
      expect(sessions[0].id).toBe('session-2')
      expect(sessions[1].id).toBe('session-1')
    })

    it('devrait retourner un tableau vide si aucune séance complétée', async () => {
      const { db } = await import('@/lib/db/database')
      vi.mocked(db.workout_sessions.filter).mockReturnValueOnce({
        toArray: vi.fn(() => Promise.resolve([])),
      } as never)

      const { workoutSessionRepository } = await import('./workout-session.repository')
      const sessions = await workoutSessionRepository.getCompletedSessions()

      expect(sessions).toHaveLength(0)
    })
  })
})
