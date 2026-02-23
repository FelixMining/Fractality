import { useLiveQuery } from 'dexie-react-hooks'
import { cardioSessionRepository } from '@/lib/db/repositories/cardio-session.repository'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Eye, Trash2, Activity } from 'lucide-react'
import { formatRelativeTime, formatDuration, toLocalDateString } from '@/lib/utils'
import type { CardioSession, CardioActivityType } from '@/schemas/cardio-session.schema'

export interface CardioFilters {
  projectId: string | null
  from: string
  to: string
  activityTypes: CardioActivityType[]
}

export function applyCardioFilters(
  sessions: CardioSession[],
  filters: CardioFilters,
): CardioSession[] {
  return sessions.filter((s) => {
    if (filters.projectId && s.projectId !== filters.projectId) return false
    const localDate = toLocalDateString(new Date(s.date))
    if (filters.from && localDate < filters.from) return false
    if (filters.to && localDate > filters.to) return false
    if (filters.activityTypes.length > 0 && !filters.activityTypes.includes(s.activityType)) {
      return false
    }
    return true
  })
}

export function countCardioFilters(filters: CardioFilters): number {
  let count = 0
  if (filters.projectId) count++
  if (filters.from) count++
  if (filters.to) count++
  if (filters.activityTypes.length > 0) count++
  return count
}

export function hasCardioFilters(filters: CardioFilters): boolean {
  return countCardioFilters(filters) > 0
}

const ACTIVITY_LABELS: Record<string, string> = {
  running: 'Course',
  cycling: 'Vélo',
  swimming: 'Natation',
  hiking: 'Randonnée',
  walking: 'Marche',
  other: 'Autre',
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`
}

interface CardioSessionListProps {
  filters: CardioFilters
  onView?: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
}

export function CardioSessionList({ filters, onView, onDelete }: CardioSessionListProps) {
  const sessions = useLiveQuery(
    () => cardioSessionRepository.getAllSorted(),
    [],
  )

  if (sessions === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="size-8" />
                <Skeleton className="size-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const filtered = applyCardioFilters(sessions, filters)

  if (filtered.length === 0 && !hasCardioFilters(filters)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Activity className="size-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucune session cardio</h3>
          <p className="text-sm text-muted-foreground">
            Importez un GPX ou saisissez manuellement votre première session.
          </p>
        </div>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="Aucun résultat"
        subtitle="Aucune session ne correspond à vos filtres."
      />
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((session) => (
        <Card key={session.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold">{session.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(session.duration, false)} • {formatRelativeTime(session.date)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {ACTIVITY_LABELS[session.activityType] || session.activityType}
                </Badge>

                {session.distance !== undefined && session.distance > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {formatDistance(session.distance)}
                  </span>
                )}

                {session.avgSpeed !== undefined && session.avgSpeed > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {formatSpeed(session.avgSpeed)}
                  </span>
                )}
              </div>

              {session.tags && session.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {session.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-1">
              {onView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(session.id)}
                  aria-label="Voir le détail"
                >
                  <Eye className="size-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(session.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
