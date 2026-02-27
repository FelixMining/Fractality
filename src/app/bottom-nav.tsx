import { Link, useLocation } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { bottomNavTabs } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  onPlusClick: () => void
}

// Les 2 premiers onglets à gauche du +, les 2 derniers à droite
const LEFT_TABS = bottomNavTabs.slice(0, 2)
const RIGHT_TABS = bottomNavTabs.slice(2)

export function BottomNav({ onPlusClick }: BottomNavProps) {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-secondary lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {/* Onglets gauche */}
        {LEFT_TABS.map((tab) => {
          const isActive = tab.matchPrefix
            ? pathname.startsWith(tab.matchPrefix)
            : pathname === tab.to
          const Icon = tab.icon

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                isActive
                  ? 'text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="leading-tight">{tab.label}</span>
            </Link>
          )
        })}

        {/* Bouton + central */}
        <button
          onClick={onPlusClick}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-transform active:scale-95"
          aria-label="Créer une nouvelle entrée"
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-md"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Plus size={26} className="text-white" strokeWidth={2.5} />
          </div>
        </button>

        {/* Onglets droite */}
        {RIGHT_TABS.map((tab) => {
          const isActive = tab.matchPrefix
            ? pathname.startsWith(tab.matchPrefix)
            : pathname === tab.to
          const Icon = tab.icon

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                isActive
                  ? 'text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="leading-tight">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
