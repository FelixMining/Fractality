import { db } from '@/lib/db/database'
import { supabase } from '@/lib/supabase/client'
import { syncRegistry } from './sync-registry'
import { resolveConflict } from './conflict-resolver'
import { withRetry } from './retry'
import { toSnakeCase, toCamelCase } from '@/lib/utils'
import { useSyncStore } from '@/stores/sync.store'

const SYNC_INTERVAL_MS = 30_000
const PULL_PAGE_SIZE = 1000

class SyncEngine {
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null
  private isRunning = false
  private isSyncing = false

  start(): void {
    if (this.isRunning) return
    this.isRunning = true

    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    document.addEventListener('visibilitychange', this.handleVisibility)

    if (navigator.onLine) {
      this.syncNow()
      this.scheduleSync()
    } else {
      useSyncStore.getState().setStatus('offline')
    }
  }

  stop(): void {
    this.isRunning = false

    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = null
    }

    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    document.removeEventListener('visibilitychange', this.handleVisibility)

    useSyncStore.getState().setStatus('idle')
  }

  async syncNow(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return

    const store = useSyncStore.getState()
    this.isSyncing = true
    store.setStatus('syncing')
    store.setError(null)

    try {
      await this.push()
      await this.pull()
      store.setStatus('idle')
      store.setLastSync(new Date().toISOString())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      store.setError(message)
      store.setStatus('error')
      console.warn('[SyncEngine] Sync cycle failed:', message)
    } finally {
      this.isSyncing = false
      await this.updateQueueSize()
    }
  }

  private handleOnline = (): void => {
    if (this.isSyncing) {
      useSyncStore.getState().setStatus('syncing')
    }
    this.syncNow()
    this.scheduleSync()
  }

  private handleOffline = (): void => {
    useSyncStore.getState().setStatus('offline')
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = null
    }
  }

  private handleVisibility = (): void => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      this.syncNow()
    }
  }

  private scheduleSync(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle)
    }

    this.timeoutHandle = setTimeout(async () => {
      if (this.isRunning && navigator.onLine) {
        await this.syncNow()
        this.scheduleSync()
      }
    }, SYNC_INTERVAL_MS)
  }

  /**
   * Push: Read syncQueue FIFO, transform camelCase→snake_case,
   * upsert to Supabase, delete from queue on success.
   * Stops at first failure to preserve FIFO ordering.
   */
  private async push(): Promise<void> {
    const items = await db.syncQueue.orderBy('id').toArray()
    if (items.length === 0) return

    for (const item of items) {
      const supabaseTable = syncRegistry.getSupabaseTable(item.entity)
      if (!supabaseTable) continue

      await withRetry(async () => {
        const payload = JSON.parse(item.payload) as Record<string, unknown>
        const snaked = toSnakeCase(payload) as Record<string, unknown>

        const { error } = await supabase.from(supabaseTable).upsert(snaked)
        if (error) throw error

        await db.syncQueue.delete(item.id!)
      })
    }
  }

  /**
   * Pull: For each registered table, query Supabase for rows updated
   * since last sync, transform snake_case→camelCase, merge with LWW.
   * Paginates results to handle more than 1000 rows.
   */
  private async pull(): Promise<void> {
    const tables = syncRegistry.getAll()
    if (tables.length === 0) return

    const lastSync = useSyncStore.getState().lastSyncTimestamp

    for (const config of tables) {
      const dexieTable = db.table(config.dexieStore)
      let offset = 0
      let hasMore = true

      while (hasMore) {
        let query = supabase
          .from(config.supabaseTable)
          .select('*')
          .range(offset, offset + PULL_PAGE_SIZE - 1)

        if (lastSync) {
          query = query.gt('updated_at', lastSync)
        }

        const { data, error } = await query
        if (error) throw error
        if (!data || data.length === 0) break

        for (const serverRow of data) {
          const camelRow = toCamelCase(serverRow) as Record<string, unknown>
          const localRow = await dexieTable.get(camelRow.id as string)

          const { winner, data: winnerData } = resolveConflict(
            localRow as Record<string, unknown> | undefined,
            camelRow,
          )

          if (winner === 'server') {
            await dexieTable.put(winnerData)
          }
        }

        hasMore = data.length === PULL_PAGE_SIZE
        offset += PULL_PAGE_SIZE
      }
    }
  }

  private async updateQueueSize(): Promise<void> {
    const count = await db.syncQueue.count()
    useSyncStore.getState().setQueueSize(count)
  }
}

export const syncEngine = new SyncEngine()
