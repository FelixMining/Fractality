import { useLiveQuery } from 'dexie-react-hooks'
import { trackingRecurringRepository, trackingResponseRepository, isDueOnDate } from '@/lib/db/repositories/tracking.repository'
import { useUndo } from '@/hooks/use-undo'
import { toLocalDateString } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { TrackingItem } from '@/components/shared/tracking-item'
import { toast } from 'sonner'
import type { TrackingRecurring, TrackingRecurrenceType } from '@/schemas/tracking-recurring.schema'

export interface RecurringFilters {
  recurrenceTypes: TrackingRecurrenceType[]
}

export function applyRecurringFilters(
  recurrings: TrackingRecurring[],
  filters: RecurringFilters,
): TrackingRecurring[] {
  return recurrings.filter((r) => {
    if (filters.recurrenceTypes.length > 0 && !filters.recurrenceTypes.includes(r.recurrenceType)) {
      return false
    }
    return true
  })
}

export function countRecurringFilters(filters: RecurringFilters): number {
  return filters.recurrenceTypes.length > 0 ? 1 : 0
}

export function hasRecurringFilters(filters: RecurringFilters): boolean {
  return countRecurringFilters(filters) > 0
}

interface RecurringListProps {
  filters: RecurringFilters
  onAdd: () => void
  onEdit: (recurring: TrackingRecurring) => void
  onShowHistory: (recurring: TrackingRecurring) => void
}

export function RecurringList({ filters, onAdd, onEdit, onShowHistory }: RecurringListProps) {
  const today = toLocalDateString()
  const recurrings = useLiveQuery(() => trackingRecurringRepository.getAllSorted(), [])
  const todayResponses = useLiveQuery(
    () => trackingResponseRepository.getByDate(today),
    [today],
  )
  const { withUndo } = useUndo()

  // Chargement
  if (recurrings === undefined || todayResponses === undefined) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    )
  }

  // État vide
  if (recurrings.length === 0) {
    return (
      <EmptyState
        title="Aucun suivi configuré"
        subtitle="Définissez vos premiers suivis récurrents pour mesurer vos métriques personnelles."
        ctaLabel="Créer un suivi"
        ctaAction={onAdd}
      />
    )
  }

  // Map des réponses du jour par recurringId
  const responseMap = new Map(todayResponses.map((r) => [r.recurringId, r]))

  // Appliquer les filtres avant la séparation dueToday / notDueToday
  const filteredRecurrings = applyRecurringFilters(recurrings, filters)

  // État vide après filtrage
  if (filteredRecurrings.length === 0 && hasRecurringFilters(filters)) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <div className="flex justify-end mb-2">
          <Button onClick={onAdd} size="sm">
            + Créer un suivi
          </Button>
        </div>
        <EmptyState
          title="Aucun résultat"
          subtitle="Aucun suivi ne correspond à vos filtres."
        />
      </div>
    )
  }

  // Séparer les suivis planifiés aujourd'hui des autres
  const dueToday = filteredRecurrings.filter((r) => isDueOnDate(r, today))
  const notDueToday = filteredRecurrings.filter((r) => !isDueOnDate(r, today))

  const handleDelete = async (recurring: TrackingRecurring) => {
    const snapshot = { ...recurring }
    await withUndo(
      `Suivi "${snapshot.name}" supprimé`,
      async () => {
        await trackingRecurringRepository.softDelete(snapshot.id)
      },
      async () => {
        await trackingRecurringRepository.restore(snapshot.id)
      },
    )
    toast.success(`Suivi "${snapshot.name}" supprimé`)
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Bouton Ajouter */}
      <div className="flex justify-end mb-2">
        <Button onClick={onAdd} size="sm">
          + Créer un suivi
        </Button>
      </div>

      {/* Suivis planifiés aujourd'hui */}
      {dueToday.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Aujourd'hui</h2>
          <ul className="space-y-2">
            {dueToday.map((recurring) => (
              <TrackingItem
                key={recurring.id}
                recurring={recurring}
                todayResponse={responseMap.get(recurring.id)}
                today={today}
                isDueToday={true}
                onEdit={() => onEdit(recurring)}
                onDelete={() => handleDelete(recurring)}
                onShowHistory={() => onShowHistory(recurring)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Autres suivis (non planifiés aujourd'hui) */}
      {notDueToday.length > 0 && (
        <section className={dueToday.length > 0 ? 'mt-4' : ''}>
          {dueToday.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Autres suivis</h2>
          )}
          <ul className="space-y-2">
            {notDueToday.map((recurring) => (
              <TrackingItem
                key={recurring.id}
                recurring={recurring}
                today={today}
                isDueToday={false}
                onEdit={() => onEdit(recurring)}
                onDelete={() => handleDelete(recurring)}
                onShowHistory={() => onShowHistory(recurring)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
