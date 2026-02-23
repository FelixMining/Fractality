import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { trackingEventRepository } from '@/lib/db/repositories/event.repository'
import { eventTypeRepository } from '@/lib/db/repositories/event.repository'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import type { TrackingEvent, EventPriority } from '@/schemas/tracking-event.schema'

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

function formatFullDate(eventDate: string): string {
  const date = new Date(eventDate)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface EventDetailProps {
  event: TrackingEvent
  onEdit: () => void
  onDeleted: () => void
}

export function EventDetail({ event, onEdit, onDeleted }: EventDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { withUndo } = useUndo()

  const types = useLiveQuery(() => eventTypeRepository.getAllSorted(), [])
  const type = event.typeId ? types?.find((t) => t.id === event.typeId) : undefined
  const priority = (event.priority ?? 'medium') as EventPriority

  const handleDelete = async () => {
    const snapshot = { ...event }
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
      toast.success('Événement supprimé')
      onDeleted()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        {/* Icône type */}
        {type && (
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: type.color ? `${type.color}20` : 'rgba(139, 92, 246, 0.1)' }}
          >
            {type.icon ?? (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: type.color ?? '#8B5CF6' }}
              />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold leading-tight">{event.title}</h2>
          {type && <p className="text-sm text-muted-foreground">{type.name}</p>}
        </div>
      </div>

      {/* Métadonnées */}
      <div className="space-y-2 rounded-xl bg-card border border-border p-4">
        {/* Date / Heure */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">🗓</span>
          <span>{formatFullDate(event.eventDate)}</span>
        </div>

        {/* Priorité */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">⚑</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
          >
            {PRIORITY_LABELS[priority]}
          </span>
        </div>

        {/* Localisation */}
        {event.location && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground flex-shrink-0">📍</span>
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onEdit}>
          Modifier
        </Button>
        <Button
          variant="outline"
          className="text-destructive border-destructive/40 hover:bg-destructive/10"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Supprimer
        </Button>
      </div>

      {/* ConfirmDialog suppression */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer cet événement ?"
        description={`"${event.title}" sera déplacé dans la corbeille.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
