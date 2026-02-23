import { Link, useLocation } from '@tanstack/react-router'
import { bottomNavTabs } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-secondary lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {bottomNavTabs.map((tab) => {
          const isActive = tab.matchPrefix
            ? pathname.startsWith(tab.matchPrefix)
            : pathname === tab.to
          const Icon = tab.icon

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] transition-colors',
                isActive
                  ? 'text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="leading-tight">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
