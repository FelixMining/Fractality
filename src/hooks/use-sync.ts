import { useEffect } from 'react'
import { syncEngine } from '@/lib/sync/sync-engine'

/**
 * Start the sync engine when enabled (after auth is confirmed),
 * stop it on unmount or when disabled.
 *
 * Triggers: online/offline events, 30s periodic interval, tab visibility change.
 */
export function useSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    syncEngine.start()
    return () => {
      syncEngine.stop()
    }
  }, [enabled])
}
