import { useEffect, useState } from 'react'
import { workSessionRepository } from '@/lib/db/repositories/work-session.repository'
import { projectRepository } from '@/lib/db/repositories/project.repository'
import type { WorkSession } from '@/schemas/work-session.schema'
import type { Project } from '@/schemas/project.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2, Clock, Calendar, Target, Briefcase } from 'lucide-react'
import { formatRelativeTime, formatDuration } from '@/lib/utils'

interface WorkSessionDetailProps {
  sessionId: string
  onEdit?: () => void
  onDelete?: () => void
}

export function WorkSessionDetail({ sessionId, onEdit, onDelete }: WorkSessionDetailProps) {
  const [session, setSession] = useState<WorkSession | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sess = await workSessionRepository.getById(sessionId)
        setSession(sess || null)

        if (sess?.projectId) {
          const proj = await projectRepository.getById(sess.projectId)
          setProject(proj || null)
        }
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Session introuvable</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            {formatRelativeTime(session.date)}
          </p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" size="icon" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="icon" onClick={onDelete}>
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Durée */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Clock className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Durée</p>
            <p className="text-2xl font-bold">{formatDuration(session.duration)}</p>
          </div>
        </div>
      </Card>

      {/* Date */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Calendar className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Date et heure</p>
            <p className="text-lg">
              {new Date(session.date).toLocaleString('fr-FR', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Projet */}
      {project && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Briefcase className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Projet</p>
              <Badge variant="outline" style={{ borderColor: project.color }}>
                {project.name}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Propriétés (Productivité & Concentration) */}
      {(session.productivity !== undefined || session.concentration !== undefined) && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Target className="size-5 text-muted-foreground" />
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium">Propriétés</p>
              <div className="grid grid-cols-2 gap-4">
                {session.productivity !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Productivité</p>
                    <p className="text-lg font-semibold">{session.productivity}/10</p>
                  </div>
                )}
                {session.concentration !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Concentration</p>
                    <p className="text-lg font-semibold">{session.concentration}/10</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Description */}
      {session.description && (
        <Card className="p-4">
          <h3 className="mb-2 font-medium">Description</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{session.description}</p>
        </Card>
      )}

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-2 font-medium">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {session.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
