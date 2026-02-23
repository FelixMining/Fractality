import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Trash2, Dumbbell, Clock, Weight, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUndoStore } from '@/stores/undo.store'
import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutSeriesRepository } from '@/lib/db/repositories/workout-series.repository'
import type { WorkoutSession } from '@/schemas/workout-session.schema'
import { toast } from 'sonner'

interface WorkoutHistoryListProps {
  onEdit: (session: WorkoutSession) => void
  onAddRetroactive: () => void
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  return `${m}min`
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoString))
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

/**
 * Liste des séances de musculation complétées.
 * Respecte AC1 : affichage historique trié par date DESC.
 * Respecte AC2 : bouton "Modifier" pour édition rétroactive.
 * Respecte AC4 : séances rétroactives visibles à la bonne date.
 * Story 3.5 : Modification et création rétroactive de séances
 */
export function WorkoutHistoryList({ onEdit, onAddRetroactive }: WorkoutHistoryListProps) {
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null)
  const pushUndo = useUndoStore((s) => s.pushUndo)

  const sessions = useLiveQuery(() => workoutSessionRepository.getCompletedSessions(), [])
  const exerciseCounts = useLiveQuery(
    () => workoutSessionRepository.getExerciseCountBySession(),
    [],
  )

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      // Snapshot des séries pour l'undo
      const seriesSnapshot = await workoutSessionRepository.getSessionSeries(sessionToDelete.id)
      const sessionSnapshot = { ...sessionToDelete }

      // Soft delete de la session
      await workoutSessionRepository.softDelete(sessionToDelete.id)

      toast.success('Séance supprimée')

      pushUndo('Séance supprimée', async () => {
        await workoutSessionRepository.restore(sessionSnapshot.id)
        // Restaurer les séries si elles ont été soft-deletées en cascade
        for (const s of seriesSnapshot) {
          try {
            await workoutSeriesRepository.restore(s.id)
          } catch {
            // La série n'existe peut-être pas dans IndexedDB — ignorer
          }
        }
      })
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setSessionToDelete(null)
    }
  }

  // Skeleton pendant chargement
  if (sessions === undefined) {
    return (
      <div className="space-y-3" aria-label="Chargement de l'historique">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="Aucune séance enregistrée"
        subtitle="Terminez une séance live ou ajoutez une séance passée pour la voir ici."
        ctaLabel="Ajouter une séance passée"
        ctaAction={onAddRetroactive}
      />
    )
  }

  return (
    <>
      <div className="space-y-3" role="list" aria-label="Historique des séances">
        {sessions.map((session) => (
          <Card
            key={session.id}
            className="overflow-hidden"
            role="listitem"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Date */}
                  <p className="font-semibold capitalize truncate">
                    {formatDate(session.startedAt)}
                  </p>

                  {/* Heure */}
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatTime(session.startedAt)}
                    {session.completedAt && ` – ${formatTime(session.completedAt)}`}
                  </p>

                  {/* Métriques */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {session.totalDuration !== undefined && session.totalDuration > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatDuration(session.totalDuration)}</span>
                      </div>
                    )}
                    {session.totalVolume !== undefined && session.totalVolume > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Weight className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{session.totalVolume.toFixed(0)} kg</span>
                      </div>
                    )}
                    {(() => {
                      const count = exerciseCounts?.get(session.id) ?? 0
                      return count > 0 ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{count} exercice{count > 1 ? 's' : ''}</span>
                        </div>
                      ) : null
                    })()}
                    {session.initialFatigue !== undefined && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Fatigue : {session.initialFatigue}/10</span>
                      </div>
                    )}
                  </div>

                  {/* Badge titre si présent */}
                  {session.title && (
                    <Badge variant="secondary" className="mt-2">
                      {session.title}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(session)}
                    aria-label={`Modifier la séance du ${formatDate(session.startedAt)}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSessionToDelete(session)}
                    aria-label={`Supprimer la séance du ${formatDate(session.startedAt)}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog confirmation suppression */}
      <ConfirmDialog
        open={sessionToDelete !== null}
        onOpenChange={(open) => { if (!open) setSessionToDelete(null) }}
        title="Supprimer cette séance ?"
        description="La séance sera déplacée dans la corbeille. Cette action est annulable."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDeleteSession}
      />

      {/* Icône décorative si liste non vide */}
      {sessions.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{sessions.length} séance{sessions.length > 1 ? 's' : ''} enregistrée{sessions.length > 1 ? 's' : ''}</span>
        </div>
      )}
    </>
  )
}
