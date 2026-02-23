import { Link, useLocation } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabDef {
  to: string
  label: string
  icon: LucideIcon
}

interface PillarTabsProps {
  tabs: TabDef[]
  color: string
}

export function PillarTabs({ tabs, color }: PillarTabsProps) {
  const { pathname } = useLocation()
  const cssColor = `var(--color-${color})`

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.to

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'flex min-h-[44px] items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors',
              isActive
                ? 'font-medium'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
            style={
              isActive
                ? { borderBottomColor: cssColor, color: cssColor }
                : undefined
            }
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
