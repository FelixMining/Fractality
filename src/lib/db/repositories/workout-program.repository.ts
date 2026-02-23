import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { WorkoutProgramSchema, type WorkoutProgram } from '@/schemas/workout-program.schema'
import type { WorkoutSessionTemplate } from '@/schemas/workout-session-template.schema'

class WorkoutProgramRepository extends BaseRepository<WorkoutProgram> {
  constructor() {
    super(db.workout_programs, WorkoutProgramSchema, 'workout_programs')
  }

  /**
   * Retourne tous les programmes triés alphabétiquement par nom.
   * Respecte AC1: "programmes triés alphabétiquement par nom".
   */
  async getAllSorted(): Promise<WorkoutProgram[]> {
    const programs = await this.getAll()
    return programs.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  /**
   * Retourne toutes les séances-types appartenant à un programme.
   * Utilise pour afficher les séances dans ProgramDetail (AC4).
   */
  async getSessionTemplates(programId: string): Promise<WorkoutSessionTemplate[]> {
    return db.workout_session_templates
      .where('programId')
      .equals(programId)
      .and((template) => !template.isDeleted)
      .toArray()
  }

  /**
   * Supprime un programme avec cascade delete sur ses séances-types et exercices.
   * GOTCHA #2: Utilise une transaction Dexie pour garantir l'atomicité.
   * Respecte AC5: "programme et toutes ses séances-types sont marqués is_deleted = true".
   */
  async deleteProgram(programId: string): Promise<void> {
    await db.transaction(
      'rw',
      [db.workout_programs, db.workout_session_templates, db.workout_template_exercises],
      async () => {
        // Soft delete du programme
        await db.workout_programs.update(programId, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        })

        // Soft delete de toutes les séances-types du programme
        const templates = await db.workout_session_templates.where('programId').equals(programId).toArray()

        for (const template of templates) {
          await db.workout_session_templates.update(template.id, {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
          })

          // Soft delete de tous les exercices de la séance-type
          await db.workout_template_exercises
            .where('sessionTemplateId')
            .equals(template.id)
            .modify({
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            })
        }
      }
    )
  }

  /**
   * Restaure un programme avec cascade restore sur ses séances-types et exercices.
   * Utilise une transaction Dexie pour garantir l'atomicité.
   * FIX #7: Restore en cascade pour undo de suppression programme.
   */
  async restoreProgram(programId: string): Promise<void> {
    await db.transaction(
      'rw',
      [db.workout_programs, db.workout_session_templates, db.workout_template_exercises],
      async () => {
        // Restore du programme
        await db.workout_programs.update(programId, {
          isDeleted: false,
          deletedAt: null,
        })

        // Restore de toutes les séances-types du programme qui ont été supprimées en même temps
        const templates = await db.workout_session_templates
          .where('programId')
          .equals(programId)
          .filter((t) => t.isDeleted)
          .toArray()

        for (const template of templates) {
          await db.workout_session_templates.update(template.id, {
            isDeleted: false,
            deletedAt: null,
          })

          // Restore de tous les exercices de la séance-type
          await db.workout_template_exercises
            .where('sessionTemplateId')
            .equals(template.id)
            .modify({
              isDeleted: false,
              deletedAt: null,
            })
        }
      }
    )
  }
}

export const workoutProgramRepository = new WorkoutProgramRepository()
