import { BaseRepository } from './base.repository'
import type { WorkoutSession } from '@/schemas/workout-session.schema'
import { workoutSessionSchema } from '@/schemas/workout-session.schema'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import { db } from '../database'

class WorkoutSessionRepository extends BaseRepository<WorkoutSession> {
  constructor() {
    super(db.workout_sessions, workoutSessionSchema, 'workout_sessions')
  }

  async getActiveSessions(): Promise<WorkoutSession[]> {
    return this.table
      .filter((session) => !session.isDeleted && session.status === 'in-progress')
      .sortBy('startedAt')
  }

  async getSessionSeries(sessionId: string): Promise<WorkoutSeries[]> {
    return db.workout_series
      .where('sessionId')
      .equals(sessionId)
      .and((series) => !series.isDeleted)
      .sortBy('order')
  }

  async completeSession(sessionId: string): Promise<void> {
    const session = await this.getById(sessionId)
    if (!session) throw new Error('Session not found')

    // Calculer volume total
    const series = await this.getSessionSeries(sessionId)
    const totalVolume = series.reduce((sum, s) => sum + s.reps * (s.weight || 0), 0)

    // Calculer durée totale
    const totalDuration = Math.floor(
      (new Date().getTime() - new Date(session.startedAt).getTime()) / 1000,
    )

    await this.update(sessionId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      totalDuration,
      totalVolume,
    })
  }

  async getLastSessionForTemplate(
    templateId: string,
  ): Promise<WorkoutSession | null> {
    const result = await this.table
      .where('sessionTemplateId')
      .equals(templateId)
      .and((session) => !session.isDeleted && session.status === 'completed')
      .reverse()
      .first()

    return result || null
  }

  async getCompletedSessions(): Promise<WorkoutSession[]> {
    const sessions = await this.table
      .filter((session) => !session.isDeleted && session.status === 'completed')
      .toArray()
    return sessions.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
  }

  async getSessionExerciseIds(sessionId: string): Promise<string[]> {
    const series = await db.workout_series
      .where('sessionId')
      .equals(sessionId)
      .and((s) => !s.isDeleted)
      .toArray()
    return [...new Set(series.map((s) => s.exerciseId))]
  }

  async getExerciseCountBySession(): Promise<Map<string, number>> {
    const allSeries = await db.workout_series
      .filter((s) => !s.isDeleted)
      .toArray()
    const exercisesBySession = new Map<string, Set<string>>()
    for (const s of allSeries) {
      if (!exercisesBySession.has(s.sessionId)) {
        exercisesBySession.set(s.sessionId, new Set())
      }
      exercisesBySession.get(s.sessionId)!.add(s.exerciseId)
    }
    return new Map(
      [...exercisesBySession.entries()].map(([sid, ids]) => [sid, ids.size]),
    )
  }
}

export const workoutSessionRepository = new WorkoutSessionRepository()
