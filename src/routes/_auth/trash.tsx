import { createFileRoute } from '@tanstack/react-router'
import { TrashPage } from '@/features/trash/trash-page'

export const Route = createFileRoute('/_auth/trash')({
  component: TrashPage,
})
