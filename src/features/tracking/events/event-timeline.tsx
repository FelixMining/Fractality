import { useLiveQuery } from 'dexie-react-hooks'
import { trackingEventRepository } from '@/lib/db/repositories/event.repository'
import { eventTypeRepository } from '@/lib/db/repositories/event.repository'
import { toLocalDateString } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import type { TrackingEvent, EventPriority } from '@/schemas/tracking-event.schema'
import type { EventFilters } from './event-filter-bar'
import { hasActiveFilters } from './event-filter-bar'
import { applyFilters } from './event-list'

const PRIORITY_STYLES: Record<EventPriority, string> = {
  low: 'text-blue-400 bg-blue-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-red-400 bg-red-400/10',
}

const PRIORITY_LABELS: Record<EventPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
}

/** Groupe les événements par date (YYYY-MM-DD), ordonnés chronologiquement. */
function groupByDate(events: TrackingEvent[]): Map<string, TrackingEvent[]> {
  const map = new Map<string, TrackingEvent[]>()
  // Trier par eventDate croissant (plus ancien en haut dans la timeline)
  const sorted = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate))

  for (const event of sorted) {
    const dateKey = event.eventDate.slice(0, 10) // "YYYY-MM-DD"
    if (!map.has(dateKey)) map.set(dateKey, [])
    map.get(dateKey)!.push(event)
  }
  return map
}

/** Formate le header de groupe en français. */
function formatGroupHeader(dateKey: string): string {
  const today = toLocalDateString(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = toLocalDateString(yesterdayDate)

  if (dateKey === today) return "Aujourd'hui"
  if (dateKey === yesterday) return 'Hier'

  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatEventTime(eventDate: string): string {
  const date = new Date(eventDate)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

interface EventTimelineProps {
  filters: EventFilters
  onSelect: (event: TrackingEvent) => void
}

export function EventTimeline({ filters, onSelect }: EventTimelineProps) {
  const events = useLiveQuery(() => trackingEventRepository.getAllByDateDesc(), [])
  const types = useLiveQuery(() => eventTypeRepository.getAllSorted(), [])

  if (events === undefined || types === undefined) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  const filtered = applyFilters(events, filters)
  const typeMap = new Map(types.map((t) => [t.id, t]))

  if (filtered.length === 0 && !hasActiveFilters(filters)) {
    return (
      <EmptyState
        title="Aucun événement enregistré"
        subtitle="Notez vos moments importants pour les retrouver facilement."
      />
    )
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="Aucun résultat"
        subtitle="Aucun événement ne correspond à vos filtres."
      />
    )
  }

  const grouped = groupByDate(filtered)

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
        <section key={dateKey}>
          {/* Header du groupe */}
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-foreground">{formatGroupHeader(dateKey)}</h2>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Événements du jour */}
          <ul className="space-y-2 pl-2 border-l-2 border-border ml-2">
            {dayEvents.map((event) => {
              const type = event.typeId ? typeMap.get(event.typeId) : undefined
              const priority = (event.priority ?? 'medium') as EventPriority

              return (
                <li
                  key={event.id}
                  className="relative flex items-start gap-3 rounded-xl bg-card border border-border p-3 ml-2 cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => onSelect(event)}
                >
                  {/* Point timeline */}
                  <div
                    className="absolute -left-[1.35rem] top-4 h-2.5 w-2.5 rounded-full border-2 border-background"
                    style={{ backgroundColor: type?.color ?? '#8B5CF6' }}
                  />

                  {/* Heure */}
                  <span className="flex-shrink-0 text-xs text-muted-foreground mt-0.5 w-10">
                    {formatEventTime(event.eventDate)}
                  </span>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    {type && (
                      <p className="text-xs text-muted-foreground">
                        {type.icon ? `${type.icon} ` : ''}{type.name}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs text-muted-foreground truncate">📍 {event.location}</p>
                    )}
                  </div>

                  {/* Badge priorité */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
                  >
                    {PRIORITY_LABELS[priority]}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
