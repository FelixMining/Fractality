import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/sessions/workout/programs')({
  component: () => <Outlet />,
})
