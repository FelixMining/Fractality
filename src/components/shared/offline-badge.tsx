import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

export function OfflineBadge() {
  const { isOnline } = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      role="status"
      aria-live="polite"
      style={{
        color: 'var(--color-warning)',
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
      }}
    >
      <WifiOff size={12} />
      Hors ligne
    </div>
  )
}
