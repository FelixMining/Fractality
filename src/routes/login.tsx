import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '@/features/auth/login-page'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})
