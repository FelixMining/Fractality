import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { WorkoutSessionTemplateSchema, type WorkoutSessionTemplate } from '@/schemas/workout-session-template.schema'
import type { WorkoutTemplateExercise } from '@/schemas/workout-template-exercise.schema'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'

class WorkoutSessionTemplateRepository extends BaseRepository<WorkoutSessionTemplate> {
  constructor() {
    super(db.workout_session_templates, WorkoutSessionTemplateSchema, 'workout_session_templates')
  }

  /**
   * Retourne les exercices d'une séance-type avec leurs détails.
   * Effectue un join entre workout_template_exercises et workout_exercises.
   * GOTCHA #5: Évite les requêtes N+1 en chargeant tous les exercices avec bulkGet.
   * Utilise pour afficher les exercices dans ProgramDetail Accordion (AC4).
   */
  async getTemplateExercises(templateId: string): Promise<
    Array<{
      templateExercise: WorkoutTemplateExercise
      exercise: WorkoutExercise
    }>
  > {
    const templateExercises = await db.workout_template_exercises
      .where('sessionTemplateId')
      .equals(templateId)
      .and((te) => !te.isDeleted)
      .sortBy('order')

    const exerciseIds = templateExercises.map((te) => te.exerciseId)
    const exercises = await db.workout_exercises.bulkGet(exerciseIds)

    return templateExercises.map((te, index) => ({
      templateExercise: te,
      exercise: exercises[index]!,
    }))
  }

  /**
   * Ajoute un exercice à une séance-type avec ses paramètres par défaut.
   * GOTCHA #3: Calcule automatiquement l'order (max + 1).
   * Utilise pour SessionTemplateForm lors de la création d'une séance (AC3).
   */
  async addExercise(
    templateId: string,
    exerciseId: string,
    params: {
      defaultSets: number
      defaultReps?: number
      defaultWeight?: number
    }
  ): Promise<void> {
    // Trouver le max order pour ce template
    const maxOrder = await db.workout_template_exercises
      .where('sessionTemplateId')
      .equals(templateId)
      .last()
      .then((te) => te?.order ?? -1)

    await db.workout_template_exercises.add({
      id: crypto.randomUUID(),
      userId: this.getCurrentUserId(),
      sessionTemplateId: templateId,
      exerciseId,
      order: maxOrder + 1,
      ...params,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
    })
  }

  /**
   * Retire un exercice d'une séance-type (soft delete).
   * GOTCHA #3: Ne recalcule PAS les orders, garde les trous.
   * Utilise pour retirer un exercice depuis ProgramDetail (AC5).
   */
  async removeExercise(templateExerciseId: string): Promise<void> {
    await db.workout_template_exercises.update(templateExerciseId, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    })
  }

  /**
   * Méthode helper pour obtenir l'userId courant.
   * Utilise la méthode protégée de BaseRepository.
   */
  getCurrentUserId(): string {
    // TODO: Récupérer l'userId depuis le contexte auth
    // Pour l'instant, retourne un UUID temporaire pour les tests
    return crypto.randomUUID()
  }
}

export const workoutSessionTemplateRepository = new WorkoutSessionTemplateRepository()
