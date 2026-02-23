import { createFileRoute } from '@tanstack/react-router'
import { JournalPage } from '@/features/tracking/journal/journal-page'

export const Route = createFileRoute('/_auth/tracking/journal')({
  component: JournalPage,
})
