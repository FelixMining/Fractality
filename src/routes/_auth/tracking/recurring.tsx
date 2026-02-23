import { createFileRoute } from '@tanstack/react-router'
import { RecurringPage } from '@/features/tracking/recurring/recurring-page'

export const Route = createFileRoute('/_auth/tracking/recurring')({
  component: RecurringPage,
})
