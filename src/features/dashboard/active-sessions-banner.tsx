import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { Timer, Dumbbell, Play, Pause, Square, ArrowRight } from 'lucide-react'
import { useWorkoutStore } from '@/stores/workout.store'
import { db } from '@/lib/db/database'
import { workSessionRepository } from '@/lib/db/repositories/work-session.repository'
import {
  loadTimerState,
  saveTimerState,
} from '@/features/sessions/work/work-timer'
import type { WorkSession } from '@/schemas/work-session.schema'
import { formatDuration } from '@/lib/utils'

// ─── Carte session de travail ─────────────────────────────────────────────────

function WorkTimerCard({ session }: { session: WorkSession }) {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(session.timerPaused ?? false)

  // Calculer l'elapsed et le mettre à jour chaque seconde
  useEffect(() => {
    const computeElapsed = () => {
      if (isPaused) {
        return session.timerElapsedSecs ?? 0
      }
      const base = session.timerElapsedSecs ?? 0
      const startedAt = session.timerStartedAt
        ? new Date(session.timerStartedAt).getTime()
        : Date.now()
      return base + (Date.now() - startedAt) / 1000
    }

    setElapsed(Math.floor(computeElapsed()))

    if (isPaused) return

    const id = setInterval(() => {
      setElapsed(Math.floor(computeElapsed()))
    }, 1000)
    return () => clearInterval(id)
  }, [isPaused, session.timerElapsedSecs, session.timerStartedAt])

  // Synchroniser isPaused depuis la session Dexie (autre device peut changer l'état)
  useEffect(() => {
    setIsPaused(session.timerPaused ?? false)
  }, [session.timerPaused])

  const isLocalDevice = loadTimerState()?.sessionId === session.id

  const pause = async () => {
    const currentElapsed = (session.timerElapsedSecs ?? 0) +
      (session.timerStartedAt
        ? (Date.now() - new Date(session.timerStartedAt).getTime()) / 1000
        : 0)

    // Mettre à jour Dexie
    await workSessionRepository.update(session.id, {
      timerPaused: true,
      timerElapsedSecs: currentElapsed,
    } as any)

    // Mettre à jour localStorage si on est sur le device local
    if (isLocalDevice) {
      const saved = loadTimerState()
      if (saved) {
        saveTimerState({
          ...saved,
          elapsedSecs: currentElapsed,
          isPaused: true,
        })
      }
    }

    setIsPaused(true)
  }

  const resume = async () => {
    const now = Date.now()

    // Mettre à jour Dexie
    await workSessionRepository.update(session.id, {
      timerPaused: false,
      timerStartedAt: new Date(now).toISOString(),
    } as any)

    // Mettre à jour localStorage si on est sur le device local
    if (isLocalDevice) {
      const saved = loadTimerState()
      if (saved) {
        saveTimerState({
          ...saved,
          activeStartedAt: now,
          isPaused: false,
        })
      }
    }

    setIsPaused(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Timer className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Session de travail en cours</p>
          <p className="text-2xl font-mono font-bold tabular-nums">{formatDuration(elapsed)}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isPaused ? (
          <Button size="sm" variant="outline" onClick={resume} className="gap-1.5">
            <Play className="size-3.5" />
            Reprendre
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={pause} className="gap-1.5">
            <Pause className="size-3.5" />
            Pause
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => navigate({ to: '/sessions/work' })}
          className="gap-1.5"
        >
          <Square className="size-3.5" />
          Arrêter
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate({ to: '/sessions/work' })}
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Carte session de musculation ─────────────────────────────────────────────

function WorkoutSessionCard() {
  const navigate = useNavigate()
  const { activeSession, isPaused, exercises, pauseSession, resumeSession } = useWorkoutStore()

  const session = useLiveQuery(
    () => activeSession ? db.workout_sessions.get(activeSession.id) : undefined,
    [activeSession?.id],
  )

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!session?.startedAt) return
    const startMs = new Date(session.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.startedAt])

  const goToSession = () => {
    const templateId = session?.sessionTemplateId ?? activeSession?.id ?? 'active'
    navigate({ to: '/sessions/workout/live/$sessionTemplateId', params: { sessionTemplateId: templateId } })
  }

  const exerciseCount = exercises.length
  const seriesCount = exercises.reduce((acc, e) => acc + e.series.filter((s) => s.completed).length, 0)

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
          <Dumbbell className="size-4 text-orange-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-orange-400 uppercase tracking-wide">Session de musculation en cours</p>
          <p className="text-2xl font-mono font-bold tabular-nums">{formatDuration(elapsed)}</p>
          {exerciseCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''} · {seriesCount} série{seriesCount > 1 ? 's' : ''} complétée{seriesCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isPaused ? (
          <Button size="sm" variant="outline" onClick={resumeSession} className="gap-1.5">
            <Play className="size-3.5" />
            Reprendre
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={pauseSession} className="gap-1.5">
            <Pause className="size-3.5" />
            Pause
          </Button>
        )}
        <Button size="sm" onClick={goToSession} className="gap-1.5">
          <ArrowRight className="size-3.5" />
          Accéder
        </Button>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ActiveSessionsBanner() {
  const activeWorkoutSession = useWorkoutStore((s) => s.activeSession)

  // Écouter les sessions de travail actives depuis Dexie (cross-device)
  const activeWorkSession = useLiveQuery(
    () => workSessionRepository.getActiveSession(),
    []
  )

  if (!activeWorkSession && !activeWorkoutSession) return null

  return (
    <div className="flex flex-col gap-3">
      {activeWorkSession && <WorkTimerCard session={activeWorkSession} />}
      {activeWorkoutSession && <WorkoutSessionCard />}
    </div>
  )
}
