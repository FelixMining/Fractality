import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { RootLayout } from '@/app/root-layout'
import type { AuthState } from '@/hooks/use-auth'

export interface RouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  )
}
