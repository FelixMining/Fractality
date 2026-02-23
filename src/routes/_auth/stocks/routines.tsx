import { createFileRoute } from '@tanstack/react-router'
import { RoutinesPage } from '@/features/stocks/routines/routines-page'

export const Route = createFileRoute('/_auth/stocks/routines')({
  component: RoutinesPage,
})
