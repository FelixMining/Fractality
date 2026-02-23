import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { journalEntrySchema, type JournalEntry } from '@/schemas/journal-entry.schema'

class JournalEntryRepository extends BaseRepository<JournalEntry> {
  constructor() {
    super(db.journal_entries, journalEntrySchema, 'journal_entries')
  }

  // Toutes les entrées non supprimées, triées par entryDate décroissant
  async getAllByDateDesc(): Promise<JournalEntry[]> {
    const items = await this.table
      .filter((e) => !e.isDeleted)
      .toArray()
    return items.sort((a, b) => b.entryDate.localeCompare(a.entryDate))
  }

  // Tous les tags distincts utilisés (pour l'auto-complétion)
  async getAllTags(): Promise<string[]> {
    const all = await this.table
      .filter((e) => !e.isDeleted)
      .toArray()
    const tagSet = new Set<string>()
    for (const entry of all) {
      entry.tags?.forEach((t) => tagSet.add(t))
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'fr'))
  }
}

export const journalEntryRepository = new JournalEntryRepository()
