import { syncRegistry } from '@/lib/sync/sync-registry'
import type { BaseRepository } from './repositories/base.repository'
import type { BaseEntity } from '@/schemas/base.schema'

/**
 * Enregistre toutes les tables syncables dans le registry de synchronisation.
 * Doit être appelé avant le démarrage du sync engine.
 *
 * Story 1.6: Projects table
 * Story 2.1: Work sessions table
 * Story 3.1: Workout exercises table
 * Story 3.2: Workout programs, session templates, template exercises tables
 * Story 3.3: Workout sessions, workout series tables
 * Story 3.4: Pain notes table
 * Story 6.1: Tracking recurrings and responses tables
 * Story 6.2: Tracking event types and events tables
 * Story 6.3: Journal entries table
 * Les futures stories ajouteront leurs tables ici.
 */
export function registerSyncTables() {
  syncRegistry.register({
    dexieStore: 'projects',
    supabaseTable: 'projects',
  })

  syncRegistry.register({
    dexieStore: 'work_sessions',
    supabaseTable: 'work_sessions',
  })

  syncRegistry.register({
    dexieStore: 'workout_exercises',
    supabaseTable: 'workout_exercises',
  })

  syncRegistry.register({
    dexieStore: 'workout_programs',
    supabaseTable: 'workout_programs',
  })

  syncRegistry.register({
    dexieStore: 'workout_session_templates',
    supabaseTable: 'workout_session_templates',
  })

  syncRegistry.register({
    dexieStore: 'workout_template_exercises',
    supabaseTable: 'workout_template_exercises',
  })

  syncRegistry.register({
    dexieStore: 'workout_sessions',
    supabaseTable: 'workout_sessions',
  })

  syncRegistry.register({
    dexieStore: 'workout_series',
    supabaseTable: 'workout_series',
  })

  syncRegistry.register({
    dexieStore: 'pain_notes',
    supabaseTable: 'pain_notes',
  })

  syncRegistry.register({
    dexieStore: 'tracking_recurrings',
    supabaseTable: 'tracking_recurrings',
  })

  syncRegistry.register({
    dexieStore: 'tracking_responses',
    supabaseTable: 'tracking_responses',
  })

  syncRegistry.register({
    dexieStore: 'tracking_event_types',
    supabaseTable: 'tracking_event_types',
  })

  syncRegistry.register({
    dexieStore: 'tracking_events',
    supabaseTable: 'tracking_events',
  })

  syncRegistry.register({
    dexieStore: 'journal_entries',
    supabaseTable: 'journal_entries',
  })

  // Les futures stories ajouteront leurs tables ici
}

// --- Entity Registry pour la Corbeille (multi-table) ---

interface EntityRegistryEntry {
  repository: BaseRepository<BaseEntity>
  label: string
  entityType: string
}

const entityRegistry = new Map<string, EntityRegistryEntry>()

export function registerEntity(config: {
  key: string
  repository: BaseRepository<BaseEntity>
  label: string
  entityType: string
}) {
  entityRegistry.set(config.key, {
    repository: config.repository,
    label: config.label,
    entityType: config.entityType,
  })
}

export interface DeletedItemGroup {
  key: string
  label: string
  entityType: string
  items: (BaseEntity & Record<string, unknown>)[]
}

export async function getAllDeletedItems(): Promise<DeletedItemGroup[]> {
  const results: DeletedItemGroup[] = []

  for (const [key, entry] of entityRegistry) {
    const items = await entry.repository.getDeleted()
    if (items.length > 0) {
      results.push({
        key,
        label: entry.label,
        entityType: entry.entityType,
        items: items as (BaseEntity & Record<string, unknown>)[],
      })
    }
  }

  return results
}

export function getEntityRepository(key: string): BaseRepository<BaseEntity> | undefined {
  return entityRegistry.get(key)?.repository
}
