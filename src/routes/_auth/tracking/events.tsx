import { createFileRoute } from '@tanstack/react-router'
import { EventsPage } from '@/features/tracking/events/events-page'

export const Route = createFileRoute('/_auth/tracking/events')({
  component: EventsPage,
})
