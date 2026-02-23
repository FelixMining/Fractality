import { BaseRepository } from './base.repository'
import { painNoteSchema, type PainNote } from '@/schemas/pain-note.schema'
import { db } from '../database'
import { syncRegistry } from '@/lib/sync/sync-registry'

class PainNoteRepository extends BaseRepository<PainNote> {
  constructor() {
    super(db.pain_notes, painNoteSchema, 'pain_notes')

    // Register for sync
    syncRegistry.register({
      dexieStore: 'pain_notes',
      supabaseTable: 'pain_notes',
    })
  }

  async getNotesForExercise(sessionId: string, exerciseId: string): Promise<PainNote[]> {
    return this.table
      .where('sessionId')
      .equals(sessionId)
      .and((note) => !note.isDeleted && note.exerciseId === exerciseId)
      .sortBy('createdAt')
  }

  async getNotesForSession(sessionId: string): Promise<PainNote[]> {
    return this.table
      .where('sessionId')
      .equals(sessionId)
      .and((note) => !note.isDeleted)
      .sortBy('createdAt')
  }
}

export const painNoteRepository = new PainNoteRepository()
