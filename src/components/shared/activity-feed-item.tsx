import type { LucideIcon } from 'lucide-react'

interface ActivityFeedItemProps {
  icon: LucideIcon
  iconColor: string
  title: string
  metadata?: string
  time: string
  onClick: () => void
}

export function ActivityFeedItem({
  icon: Icon,
  iconColor,
  title,
  metadata,
  time,
  onClick,
}: ActivityFeedItemProps) {
  return (
    <li
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/10"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={metadata ? `${title} — ${metadata}` : title}
    >
      <Icon className={`size-4 shrink-0 ${iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {metadata && (
          <p className="truncate text-xs text-muted-foreground">{metadata}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
    </li>
  )
}
