import { useEffect, useState } from 'react'
import { ShoppingCart, Pencil, CheckCircle2 } from 'lucide-react'
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
    case 'slider':
      return recurring.unit ? `Curseur (${recurring.unit})` : 'Curseur'
    case 'boolean':
      return 'Oui / Non'
    case 'choice':
      return recurring.multiChoice ? 'QCM multi-choix' : 'QCM'
  }
}

function formatAnsweredValue(recurring: TrackingRecurring, response: TrackingResponse): string {
  switch (recurring.responseType) {
    case 'number':
    case 'slider':
      if (response.valueNumber !== undefined) {
        return `${response.valueNumber}${recurring.unit ? ` ${recurring.unit}` : ''}`
      }
      return '—'
    case 'boolean':
      return response.valueBoolean === true ? 'Oui' : response.valueBoolean === false ? 'Non' : '—'
    case 'choice':
      if (recurring.multiChoice && response.valueChoices?.length) {
        return response.valueChoices.join(', ')
      }
      return response.valueChoice ?? '—'
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
  const isNumberType = recurring.responseType === 'number' || recurring.responseType === 'slider'

  // Mode édition : actif si non répondu ou si l'utilisateur clique le crayon
  const [editMode, setEditMode] = useState(false)

  // Quand la réponse change (sauvegarde), repasse en mode lecture
  useEffect(() => {
    setEditMode(false)
  }, [todayResponse])

  // Détermine si on affiche le widget compact (valeur lue) ou l'éditeur
  const showCompact = isDueToday && isAnswered && isNumberType && !editMode

  // Styles carte
  const cardClass = isDueToday && isAnswered
    ? 'rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3'
    : isDueToday && !isAnswered
      ? 'rounded-xl border border-primary/40 bg-primary/5 p-3'
      : 'rounded-xl border border-border bg-card p-3'

  return (
    <>
      <li className={cardClass}>
        <div className="flex items-start gap-3">
          {/* Indicateur d'état */}
          {isDueToday && (
            <div className="mt-1 flex-shrink-0">
              {isAnswered ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <span
                  className="block h-2.5 w-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-primary, #8B5CF6)', opacity: 0.7 }}
                  aria-label="Non rempli"
                />
              )}
            </div>
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

            {/* Vue compacte quand rempli (number/slider) */}
            {showCompact && todayResponse && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-400">
                  {formatAnsweredValue(recurring, todayResponse)}
                </span>
                <button
                  onClick={() => setEditMode(true)}
                  aria-label="Modifier la valeur"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}

            {/* Composant de réponse inline */}
            {isDueToday && !showCompact && (
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
