import { useState } from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/app/sidebar'
import { MobileHeader } from '@/app/mobile-header'
import { BottomNav } from '@/app/bottom-nav'
import { PillarSheet } from '@/components/shared/pillar-sheet'
import { UndoToast } from '@/components/shared/undo-toast'
import { useSync } from '@/hooks/use-sync'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context }) => {
    const { auth } = context
    if (auth.isLoading) return
    if (!auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { auth } = Route.useRouteContext()
  const [pillarSheetOpen, setPillarSheetOpen] = useState(false)

  useSync(!auth.isLoading && auth.isAuthenticated)

  if (auth.isLoading) {
    return (
      <main className="mx-auto max-w-screen-xl px-4 py-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar desktop */}
      <Sidebar onNewEntry={() => setPillarSheetOpen(true)} />

      {/* Zone principale */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header mobile */}
        <MobileHeader />

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 lg:px-8 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile (avec bouton + intégré) */}
      <BottomNav onPlusClick={() => setPillarSheetOpen(true)} />

      {/* PillarSheet */}
      <PillarSheet open={pillarSheetOpen} onOpenChange={setPillarSheetOpen} />

      {/* Undo Toast global */}
      <UndoToast />
    </div>
  )
}
