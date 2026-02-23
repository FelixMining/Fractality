import { BaseRepository } from './base.repository'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import { workoutSeriesSchema } from '@/schemas/workout-series.schema'
import { db } from '../database'

class WorkoutSeriesRepository extends BaseRepository<WorkoutSeries> {
  constructor() {
    super(db.workout_series, workoutSeriesSchema, 'workout_series')
  }

  async getLastSeriesForExercise(
    sessionId: string,
    exerciseId: string,
  ): Promise<WorkoutSeries[]> {
    return this.table
      .where('sessionId')
      .equals(sessionId)
      .and(
        (series) =>
          !series.isDeleted && series.exerciseId === exerciseId && series.completed,
      )
      .sortBy('order')
  }

  async completeSeries(seriesId: string): Promise<void> {
    await db.workout_series.update(seriesId, {
      completed: true,
      updatedAt: new Date().toISOString(),
    })
  }
}

export const workoutSeriesRepository = new WorkoutSeriesRepository()
