import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { cardioSessionSchema, type CardioSession } from '@/schemas/cardio-session.schema'

class CardioSessionRepository extends BaseRepository<CardioSession> {
  constructor() {
    super(db.cardio_sessions, cardioSessionSchema, 'cardio_sessions')
  }

  async getAllSorted(): Promise<CardioSession[]> {
    const sessions = await this.table
      .filter((s) => !s.isDeleted)
      .toArray()
    return sessions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }
}

export const cardioSessionRepository = new CardioSessionRepository()
