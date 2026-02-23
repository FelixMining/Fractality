import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { RecurringResponse } from '@/features/tracking/recurring/recurring-response'
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'
import type { TrackingResponse } from '@/schemas/tracking-response.schema'

const DAYS_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatRecurrence(recurring: TrackingRecurring): string {
  switch (recurring.recurrenceType) {
    case 'daily':
      return 'Quotidien'
    case 'weekly':
      return recurring.daysOfWeek?.map((d) => DAYS_LABELS[d]).join(', ') ?? 'Hebdomadaire'
    case 'custom':
      return `Tous les ${recurring.intervalDays} jour${(recurring.intervalDays ?? 1) > 1 ? 's' : ''}`
  }
}

function formatResponseType(recurring: TrackingRecurring): string {
  switch (recurring.responseType) {
    case 'number':
      return recurring.unit ? `Valeur (${recurring.unit})` : 'Valeur chiffrée'
    case 'boolean':
      return 'Oui / Non'
    case 'choice':
      return 'Choix multiple'
  }
}

interface TrackingItemProps {
  recurring: TrackingRecurring
  todayResponse?: TrackingResponse
  today: string // YYYY-MM-DD
  isDueToday: boolean
  onEdit?: () => void
  onDelete?: () => void
  onShowHistory?: () => void
}

export function TrackingItem({
  recurring,
  todayResponse,
  today,
  isDueToday,
  onEdit,
  onDelete,
  onShowHistory,
}: TrackingItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isAnswered = !!todayResponse

  return (
    <>
      <li className="rounded-xl bg-card border border-border p-3">
        <div className="flex items-start gap-3">
          {/* Dot état (visible seulement si planifié aujourd'hui) */}
          {isDueToday && (
            <span
              className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: isAnswered ? '#8B5CF6' : '#4B5563' }}
              aria-label={isAnswered ? 'Rempli' : 'Non rempli'}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-medium truncate">{recurring.name}</p>
                {recurring.routineId && (
                  <ShoppingCart
                    className="size-3.5 text-emerald-400 shrink-0"
                    aria-label="Suivi lié à une routine de consommation"
                  />
                )}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                {onShowHistory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShowHistory}
                    className="h-7 px-2 text-xs text-muted-foreground"
                  >
                    Historique
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-7 px-2 text-xs"
                  >
                    Modifier
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatResponseType(recurring)} · {formatRecurrence(recurring)}
            </p>

            {/* Composant de réponse inline (seulement si planifié aujourd'hui) */}
            {isDueToday && (
              <RecurringResponse
                recurring={recurring}
                existingResponse={todayResponse}
                date={today}
              />
            )}
          </div>
        </div>
      </li>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le suivi"
        description={`Voulez-vous supprimer "${recurring.name}" ? Cette action est annulable.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={() => {
          setShowDeleteDialog(false)
          onDelete?.()
        }}
      />
    </>
  )
}
