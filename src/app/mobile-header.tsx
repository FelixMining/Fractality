import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { secondaryNav } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { OfflineBadge } from '@/components/shared/offline-badge'
import { SyncStatus } from '@/components/shared/sync-status'

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-bg-secondary px-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-bg-secondary p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-left text-lg font-semibold text-text-primary">
              Fractality
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            {secondaryNav.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-bg-tertiary text-text-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                  )}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <h1 className="text-base font-semibold text-text-primary">Fractality</h1>
      <div className="ml-auto flex items-center gap-2">
        <SyncStatus />
        <OfflineBadge />
      </div>
    </header>
  )
}
