import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { trackingEventRepository } from '@/lib/db/repositories/event.repository'
import { eventTypeRepository } from '@/lib/db/repositories/event.repository'
import { useUndo } from '@/hooks/use-undo'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import type { TrackingEvent, EventPriority } from '@/schemas/tracking-event.schema'
import type { EventFilters } from './event-filter-bar'
import { hasActiveFilters } from './event-filter-bar'

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

export function applyFilters(events: TrackingEvent[], filters: EventFilters): TrackingEvent[] {
  return events.filter((e) => {
    if (filters.projectId && e.projectId !== filters.projectId) return false
    if (filters.typeIds.length > 0) {
      if (!e.typeId || !filters.typeIds.includes(e.typeId)) return false
    }
    if (filters.priorities.length > 0) {
      if (!e.priority || !filters.priorities.includes(e.priority as EventPriority)) return false
    }
    const dateOnly = e.eventDate.slice(0, 10)
    if (filters.from && dateOnly < filters.from) return false
    if (filters.to && dateOnly > filters.to) return false
    return true
  })
}

function formatEventDate(eventDate: string): string {
  const date = new Date(eventDate)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface EventListProps {
  filters: EventFilters
  onAdd: () => void
  onSelect: (event: TrackingEvent) => void
}

export function EventList({ filters, onAdd, onSelect }: EventListProps) {
  const [eventToDelete, setEventToDelete] = useState<TrackingEvent | null>(null)
  const events = useLiveQuery(() => trackingEventRepository.getAllByDateDesc(), [])
  const types = useLiveQuery(() => eventTypeRepository.getAllSorted(), [])
  const { withUndo } = useUndo()

  if (events === undefined || types === undefined) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
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
        ctaLabel="Créer un événement"
        ctaAction={onAdd}
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

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return
    const snapshot = { ...eventToDelete }
    try {
      await withUndo(
        `Événement "${snapshot.title}" supprimé`,
        async () => {
          await trackingEventRepository.softDelete(snapshot.id)
        },
        async () => {
          await trackingEventRepository.restore(snapshot.id)
        },
      )
      toast.success(`Événement supprimé`)
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setEventToDelete(null)
    }
  }

  return (
    <>
      <ul className="space-y-2">
        {filtered.map((event) => {
          const type = event.typeId ? typeMap.get(event.typeId) : undefined
          const priority = (event.priority ?? 'medium') as EventPriority

          return (
            <li
              key={event.id}
              className="flex items-start gap-3 rounded-xl bg-card border border-border p-3 cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => onSelect(event)}
            >
              {/* Icône type */}
              <div
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
                style={{
                  backgroundColor: type?.color ? `${type.color}20` : 'rgba(139, 92, 246, 0.1)',
                }}
              >
                {type?.icon ? (
                  <span>{type.icon}</span>
                ) : (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: type?.color ?? '#8B5CF6' }}
                  />
                )}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatEventDate(event.eventDate)}
                </p>
                {type && (
                  <p className="text-xs text-muted-foreground">{type.name}</p>
                )}
              </div>

              {/* Badge priorité + suppression */}
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
                >
                  {PRIORITY_LABELS[priority]}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEventToDelete(event)
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Supprimer ${event.title}`}
                >
                  Supprimer
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(eventToDelete)}
        onOpenChange={(open) => { if (!open) setEventToDelete(null) }}
        title="Supprimer cet événement ?"
        description={`"${eventToDelete?.title}" sera déplacé dans la corbeille.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
