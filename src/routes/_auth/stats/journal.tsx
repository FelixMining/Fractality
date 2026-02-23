import { createFileRoute } from '@tanstack/react-router'
import { JournalStats } from '@/features/stats/journal-stats'

export const Route = createFileRoute('/_auth/stats/journal')({
  component: JournalStats,
})
