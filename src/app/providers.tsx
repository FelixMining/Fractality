import { StrictMode, useEffect } from 'react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import { useAuth } from '@/hooks/use-auth'
import type { RouterContext } from '@/routes/__root'

const router = createRouter({
  routeTree,
  context: { auth: undefined! } as RouterContext,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const auth = useAuth()

  // Re-évaluer les beforeLoad quand l'état d'auth change
  // (TanStack Router ne le fait pas automatiquement sur changement de contexte)
  useEffect(() => {
    router.invalidate()
  }, [auth.isAuthenticated, auth.isLoading])

  return <RouterProvider router={router} context={{ auth }} />
}

export function Providers() {
  return (
    <StrictMode>
      <InnerApp />
    </StrictMode>
  )
}
