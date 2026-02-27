import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { workSessionSchema, type WorkSession } from '@/schemas/work-session.schema'

class WorkSessionRepository extends BaseRepository<WorkSession> {
  constructor() {
    super(db.work_sessions, workSessionSchema, 'work_sessions')
  }

  /**
   * Retourne les sessions dans une plage de dates donnée.
   * @param startDate - Date de début (ISO 8601)
   * @param endDate - Date de fin (ISO 8601)
   * @returns Sessions non-supprimées dans la plage, triées par date
   */
  async getByDateRange(startDate: string, endDate: string): Promise<WorkSession[]> {
    const allSessions = await this.table
      .filter(
        (session) =>
          !session.isDeleted && session.date >= startDate && session.date <= endDate
      )
      .toArray()

    return allSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  /**
   * Retourne les sessions d'aujourd'hui.
   * @returns Sessions du jour courant
   */
  async getTodaySessions(): Promise<WorkSession[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.getByDateRange(today.toISOString(), tomorrow.toISOString())
  }

  /**
   * Retourne les sessions d'un projet spécifique.
   * @param projectId - ID du projet
   * @returns Sessions du projet, triées par date desc
   */
  async getByProject(projectId: string): Promise<WorkSession[]> {
    const allSessions = await this.table
      .filter((session) => !session.isDeleted && session.projectId === projectId)
      .toArray()

    return allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Retourne la session de travail active (en cours), s'il en existe une.
   * Utilisé pour la persistance cross-device du timer.
   * @returns La première session non-supprimée avec status 'in_progress', ou undefined
   */
  async getActiveSession(): Promise<WorkSession | undefined> {
    return this.table
      .filter((s) => !s.isDeleted && (s.status as string) === 'in_progress')
      .first()
  }
}

export const workSessionRepository = new WorkSessionRepository()
