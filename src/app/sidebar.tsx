import { useCallback, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Home, Plus, ChevronDown } from 'lucide-react'
import { pillars, secondaryNav } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { OfflineBadge } from '@/components/shared/offline-badge'
import { SyncStatus } from '@/components/shared/sync-status'

interface SidebarProps {
  onNewEntry: () => void
}

export function Sidebar({ onNewEntry }: SidebarProps) {
  const { pathname } = useLocation()
  const [manualToggle, setManualToggle] = useState<Record<string, boolean>>({})

  const isExpanded = useCallback(
    (id: string) => {
      if (id in manualToggle) return manualToggle[id]
      return pathname.startsWith(`/${id}`)
    },
    [pathname, manualToggle],
  )

  const toggle = (id: string) => {
    setManualToggle((prev) => ({ ...prev, [id]: !isExpanded(id) }))
  }

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border lg:bg-bg-secondary">
      <div className="flex h-14 items-center gap-3 px-6">
        <span className="text-lg font-semibold text-text-primary">Fractality</span>
        <SyncStatus />
        <OfflineBadge />
      </div>

      <div className="px-4 pb-3">
        <button
          onClick={onNewEntry}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white"
          style={{ background: 'var(--gradient-accent)' }}
          aria-label="Créer une nouvelle entrée"
        >
          <Plus size={18} />
          Nouvelle entrée
        </button>
      </div>

      <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        <Link
          to="/"
          className={cn(
            'flex min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/'
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
          )}
        >
          <Home size={18} />
          Accueil
        </Link>

        {pillars.map((pillar) => {
          const Icon = pillar.icon
          const pillarExpanded = isExpanded(pillar.id)
          const isPillarActive = pathname.startsWith(`/${pillar.id}`)

          return (
            <div key={pillar.id}>
              <button
                onClick={() => toggle(pillar.id)}
                className={cn(
                  'flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isPillarActive
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                )}
              >
                <Icon size={18} style={{ color: `var(--color-${pillar.color})` }} />
                <span className="flex-1 text-left">{pillar.label}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-text-muted transition-transform',
                    pillarExpanded && 'rotate-180',
                  )}
                />
              </button>
              {pillarExpanded && (
                <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
                  {pillar.subTypes.map((sub) => {
                    const SubIcon = sub.icon
                    const isSubActive = pathname === sub.to
                    return (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        className={cn(
                          'flex min-h-[36px] items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                          isSubActive
                            ? 'bg-bg-tertiary text-text-primary font-medium'
                            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                        )}
                      >
                        <SubIcon size={16} />
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-border px-3 py-3">
        {secondaryNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-bg-tertiary text-text-primary'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
