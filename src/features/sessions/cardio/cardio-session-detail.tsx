import { useEffect, useState } from 'react'
import { cardioSessionRepository } from '@/lib/db/repositories/cardio-session.repository'
import type { CardioSession } from '@/schemas/cardio-session.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Pencil,
  Trash2,
  Clock,
  Calendar,
  MapPin,
  Gauge,
  Mountain,
  Footprints,
  ArrowLeft,
} from 'lucide-react'
import { formatRelativeTime, formatDuration } from '@/lib/utils'

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

function formatPace(secondsPerKm: number): string {
  const min = Math.floor(secondsPerKm / 60)
  const sec = Math.round(secondsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

interface CardioSessionDetailProps {
  sessionId: string
  onEdit?: () => void
  onDelete?: () => void
  onBack?: () => void
}

export function CardioSessionDetail({ sessionId, onEdit, onDelete, onBack }: CardioSessionDetailProps) {
  const [session, setSession] = useState<CardioSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sess = await cardioSessionRepository.getById(sessionId)
        setSession(sess || null)
      } catch (error) {
        console.error('Error loading cardio session:', error)
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour à la liste" className="mt-1">
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">{session.title}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {ACTIVITY_LABELS[session.activityType] || session.activityType}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(session.date)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" size="icon" onClick={onEdit} aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="icon" onClick={onDelete} aria-label="Supprimer">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Durée</p>
              <p className="text-lg font-bold">{formatDuration(session.duration)}</p>
            </div>
          </div>
        </Card>

        {session.distance !== undefined && session.distance > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-lg font-bold">{formatDistance(session.distance)}</p>
              </div>
            </div>
          </Card>
        )}

        {session.avgSpeed !== undefined && session.avgSpeed > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Gauge className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vitesse moy.</p>
                <p className="text-lg font-bold">{formatSpeed(session.avgSpeed)}</p>
              </div>
            </div>
          </Card>
        )}

        {session.avgPace !== undefined && session.avgPace > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Footprints className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Allure moy.</p>
                <p className="text-lg font-bold">{formatPace(session.avgPace)}</p>
              </div>
            </div>
          </Card>
        )}

        {session.elevationGain !== undefined && session.elevationGain > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Mountain className="size-5 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">D+ (montée)</p>
                <p className="text-lg font-bold">{Math.round(session.elevationGain)} m</p>
              </div>
            </div>
          </Card>
        )}

        {session.elevationLoss !== undefined && session.elevationLoss > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Mountain className="size-5 text-red-400" />
              <div>
                <p className="text-xs text-muted-foreground">D- (descente)</p>
                <p className="text-lg font-bold">{Math.round(session.elevationLoss)} m</p>
              </div>
            </div>
          </Card>
        )}
      </div>

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

      {/* Localisation */}
      {session.startLocation && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Localisation</p>
              <p className="text-muted-foreground">{session.startLocation}</p>
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
