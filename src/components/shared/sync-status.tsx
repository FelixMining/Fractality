import { RefreshCw, AlertCircle } from 'lucide-react'
import { useSyncStore } from '@/stores/sync.store'

export function SyncStatus() {
  const status = useSyncStore((s) => s.status)

  if (status === 'idle' || status === 'offline') return null

  if (status === 'syncing') {
    return (
      <div className="flex items-center" aria-label="Synchronisation en cours">
        <RefreshCw
          size={16}
          className="animate-spin"
          style={{ color: 'var(--color-text-muted)' }}
        />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className="flex items-center rounded-full px-1.5 py-0.5"
        style={{
          color: 'var(--color-error)',
          backgroundColor: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
        }}
        aria-label="Erreur de synchronisation"
      >
        <AlertCircle size={16} />
      </div>
    )
  }

  return null
}
