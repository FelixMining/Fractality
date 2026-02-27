import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { Play, FolderKanban, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const WORKOUT_TABS = [
  { to: '/sessions/workout', label: 'Séances', icon: Play, matchPrefix: null },
  { to: '/sessions/workout/programs', label: 'Programmes', icon: FolderKanban, matchPrefix: '/sessions/workout/programs' },
  { to: '/workout/exercise-library', label: 'Exercices', icon: BookOpen, matchPrefix: '/workout/exercise-library' },
] as const

function WorkoutLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border -mx-4 px-4">
        {WORKOUT_TABS.map((tab) => {
          const isActive = tab.matchPrefix
            ? pathname.startsWith(tab.matchPrefix)
            : pathname === '/sessions/workout' || pathname === '/sessions/workout/'
          const Icon = tab.icon

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex min-h-[44px] items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors',
                isActive
                  ? 'border-[var(--color-sessions)] text-[var(--color-sessions)] font-medium'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          )
        })}
      </div>
      <Outlet />
    </div>
  )
}

export const Route = createFileRoute('/_auth/sessions/workout')({
  component: WorkoutLayout,
})
