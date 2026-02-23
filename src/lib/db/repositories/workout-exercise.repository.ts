import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { workoutExerciseSchema, type WorkoutExercise, type MuscleGroup } from '@/schemas/workout-exercise.schema'

class WorkoutExerciseRepository extends BaseRepository<WorkoutExercise> {
  constructor() {
    super(db.workout_exercises, workoutExerciseSchema, 'workout_exercises')
  }

  /**
   * Retourne tous les exercices d'un groupe musculaire donné.
   * Utile pour filtrer la bibliothèque par groupe musculaire.
   */
  async getByMuscleGroup(muscleGroup: MuscleGroup): Promise<WorkoutExercise[]> {
    return this.table
      .filter((exercise) => !exercise.isDeleted && exercise.muscleGroup === muscleGroup)
      .toArray()
  }

  /**
   * Recherche des exercices par nom (case-insensitive).
   * Utile pour la barre de recherche dans la bibliothèque.
   */
  async searchByName(query: string): Promise<WorkoutExercise[]> {
    const lowerQuery = query.toLowerCase()
    return this.table
      .filter((exercise) => !exercise.isDeleted && exercise.name.toLowerCase().includes(lowerQuery))
      .toArray()
  }

  /**
   * Retourne tous les exercices triés alphabétiquement par nom.
   * Respecte AC1: "exercices triés alphabétiquement".
   */
  async getAllSorted(): Promise<WorkoutExercise[]> {
    const exercises = await this.getAll()
    return exercises.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }
}

export const workoutExerciseRepository = new WorkoutExerciseRepository()
