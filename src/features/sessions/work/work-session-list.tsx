import { useLiveQuery } from 'dexie-react-hooks'
import { workSessionRepository } from '@/lib/db/repositories/work-session.repository'
import { projectRepository } from '@/lib/db/repositories/project.repository'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { Pencil, Trash2, Timer } from 'lucide-react'
import { formatRelativeTime, formatDuration, toLocalDateString } from '@/lib/utils'
import type { WorkSession } from '@/schemas/work-session.schema'

export interface WorkFilters {
  projectId: string | null
  from: string
  to: string
}

export function applyWorkFilters(sessions: WorkSession[], filters: WorkFilters): WorkSession[] {
  return sessions.filter((s) => {
    if (filters.projectId && s.projectId !== filters.projectId) return false
    const localDate = toLocalDateString(new Date(s.date))
    if (filters.from && localDate < filters.from) return false
    if (filters.to && localDate > filters.to) return false
    return true
  })
}

export function countWorkFilters(filters: WorkFilters): number {
  let count = 0
  if (filters.projectId) count++
  if (filters.from) count++
  if (filters.to) count++
  return count
}

export function hasWorkFilters(filters: WorkFilters): boolean {
  return countWorkFilters(filters) > 0
}

interface WorkSessionListProps {
  filters: WorkFilters
  onEdit?: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
}

export function WorkSessionList({ filters, onEdit, onDelete }: WorkSessionListProps) {
  const sessions = useLiveQuery(
    async () => {
      const all = await workSessionRepository.getAll()
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    []
  )

  // M3: useLiveQuery pour réactivité — badges projet mis à jour si projet renommé/supprimé
  const projects = useLiveQuery(() => projectRepository.getAll(), []) ?? []

  if (!sessions) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  const filtered = applyWorkFilters(sessions, filters)

  if (filtered.length === 0 && !hasWorkFilters(filters)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Timer className="size-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucune session de travail</h3>
          <p className="text-sm text-muted-foreground">
            Démarrez votre première session avec le chronomètre ci-dessus.
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
      {filtered.map((session) => {
        const project = projects.find((p) => p.id === session.projectId)

        return (
          <Card key={session.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                {/* Titre et durée */}
                <div>
                  <h3 className="font-semibold">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(session.duration, false)} • {formatRelativeTime(session.date)}
                  </p>
                </div>

                {/* Projet badge */}
                {project && (
                  <Badge variant="outline" style={{ borderColor: project.color }}>
                    {project.name}
                  </Badge>
                )}

                {/* Propriétés */}
                <div className="flex gap-4 text-sm">
                  {session.productivity !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Productivité:</span>
                      <span className="font-medium">{session.productivity}/10</span>
                    </div>
                  )}
                  {session.concentration !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Concentration:</span>
                      <span className="font-medium">{session.concentration}/10</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {session.tags && session.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(session.id)}
                    title="Modifier"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(session.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
