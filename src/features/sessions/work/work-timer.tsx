import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { TimerDisplay } from '@/components/shared/timer-display'
import { Play, Pause, Square } from 'lucide-react'
import { toast } from 'sonner'
import { workSessionRepository } from '@/lib/db/repositories/work-session.repository'
import type { WorkSession } from '@/schemas/work-session.schema'

export const WORK_TIMER_STORAGE_KEY = 'fractality_active_work_timer'

export interface TimerState {
  sessionId: string
  activeStartedAt: number // Date.now() quand la période de run actuelle a démarré
  elapsedSecs: number     // secondes accumulées des périodes précédentes
  isPaused: boolean
}

export function saveTimerState(state: TimerState) {
  localStorage.setItem(WORK_TIMER_STORAGE_KEY, JSON.stringify(state))
}

function clearTimerState() {
  localStorage.removeItem(WORK_TIMER_STORAGE_KEY)
}

export function loadTimerState(): TimerState | null {
  try {
    const raw = localStorage.getItem(WORK_TIMER_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TimerState
  } catch {
    return null
  }
}

function computeElapsed(state: TimerState): number {
  if (state.isPaused) return state.elapsedSecs
  return state.elapsedSecs + (Date.now() - state.activeStartedAt) / 1000
}

interface WorkTimerProps {
  existingSession?: WorkSession
  onStop: (sessionId: string) => void
}

export function WorkTimer({ existingSession, onStop }: WorkTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerStateRef = useRef<TimerState | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Restaurer depuis existingSession (cross-device) ou localStorage au montage
  useEffect(() => {
    if (existingSession) {
      // Reprise cross-device : calculer l'elapsed depuis les champs Dexie
      const elapsedSecs = existingSession.timerPaused
        ? (existingSession.timerElapsedSecs ?? 0)
        : (existingSession.timerElapsedSecs ?? 0) +
          (existingSession.timerStartedAt
            ? (Date.now() - new Date(existingSession.timerStartedAt).getTime()) / 1000
            : 0)

      const state: TimerState = {
        sessionId: existingSession.id,
        activeStartedAt: existingSession.timerStartedAt
          ? new Date(existingSession.timerStartedAt).getTime()
          : Date.now(),
        elapsedSecs: existingSession.timerPaused
          ? (existingSession.timerElapsedSecs ?? 0)
          : (existingSession.timerElapsedSecs ?? 0),
        isPaused: existingSession.timerPaused ?? false,
      }

      // Si la session était en cours (non pausée), recaler activeStartedAt
      if (!existingSession.timerPaused && existingSession.timerStartedAt) {
        state.activeStartedAt = new Date(existingSession.timerStartedAt).getTime()
      }

      timerStateRef.current = state
      saveTimerState(state)
      setElapsedTime(Math.floor(elapsedSecs))
      setIsRunning(true)
      setIsPaused(existingSession.timerPaused ?? false)
    } else {
      // Restauration depuis localStorage (même device, rafraîchissement page)
      const saved = loadTimerState()
      if (saved) {
        timerStateRef.current = saved
        setElapsedTime(Math.floor(computeElapsed(saved)))
        setIsRunning(true)
        setIsPaused(saved.isPaused)
      }
    }
  // Volontairement pas de dépendance sur existingSession pour éviter les boucles :
  // l'effet s'exécute une seule fois au montage
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tick toutes les secondes
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (timerStateRef.current) {
          setElapsedTime(Math.floor(computeElapsed(timerStateRef.current)))
        }
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isPaused])

  const handleStart = useCallback(async () => {
    try {
      const now = new Date().toISOString()
      const session = await workSessionRepository.create({
        title: 'Session en cours',
        date: now,
        duration: 0,
        status: 'in_progress',
        timerStartedAt: now,
        timerElapsedSecs: 0,
        timerPaused: false,
      } as any)

      const state: TimerState = {
        sessionId: session.id,
        activeStartedAt: Date.now(),
        elapsedSecs: 0,
        isPaused: false,
      }
      timerStateRef.current = state
      saveTimerState(state)
      setElapsedTime(0)
      setIsRunning(true)
      setIsPaused(false)
    } catch (err) {
      toast.error('Impossible de démarrer le chronomètre')
      console.error('WorkTimer handleStart error:', err)
    }
  }, [])

  const handlePause = useCallback(async () => {
    if (!timerStateRef.current) return
    try {
      const elapsed = computeElapsed(timerStateRef.current)
      const state: TimerState = {
        ...timerStateRef.current,
        elapsedSecs: elapsed,
        isPaused: true,
      }
      timerStateRef.current = state
      saveTimerState(state)
      setIsPaused(true)

      await workSessionRepository.update(state.sessionId, {
        timerPaused: true,
        timerElapsedSecs: elapsed,
      } as any)
    } catch (err) {
      toast.error('Erreur lors de la mise en pause')
      console.error('WorkTimer handlePause error:', err)
    }
  }, [])

  const handleResume = useCallback(async () => {
    if (!timerStateRef.current) return
    try {
      const now = Date.now()
      const state: TimerState = {
        ...timerStateRef.current,
        activeStartedAt: now,
        isPaused: false,
      }
      timerStateRef.current = state
      saveTimerState(state)
      setIsPaused(false)

      await workSessionRepository.update(state.sessionId, {
        timerPaused: false,
        timerStartedAt: new Date(now).toISOString(),
      } as any)
    } catch (err) {
      toast.error('Erreur lors de la reprise')
      console.error('WorkTimer handleResume error:', err)
    }
  }, [])

  const handleStop = useCallback(async () => {
    const currentState = timerStateRef.current
    if (!currentState) return

    try {
      const elapsed = Math.floor(computeElapsed(currentState))
      const { sessionId } = currentState

      await workSessionRepository.update(sessionId, {
        status: 'completed',
        duration: elapsed,
        timerPaused: false,
      } as any)

      clearTimerState()
      timerStateRef.current = null
      setIsRunning(false)
      setIsPaused(false)
      setElapsedTime(0)

      onStop(sessionId)
    } catch (err) {
      toast.error('Erreur lors de l\'arrêt du chronomètre')
      console.error('WorkTimer handleStop error:', err)
    }
  }, [onStop])

  return (
    <div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-8">
      <TimerDisplay elapsedTime={elapsedTime} />

      <div className="flex gap-3">
        {!isRunning && (
          <Button onClick={handleStart} size="lg" className="gap-2">
            <Play className="size-5" />
            Démarrer
          </Button>
        )}

        {isRunning && !isPaused && (
          <Button onClick={handlePause} size="lg" variant="secondary" className="gap-2">
            <Pause className="size-5" />
            Pause
          </Button>
        )}

        {isRunning && isPaused && (
          <Button onClick={handleResume} size="lg" className="animate-pulse gap-2">
            <Play className="size-5" />
            Reprendre
          </Button>
        )}

        {isRunning && (
          <Button onClick={handleStop} size="lg" variant="destructive" className="gap-2">
            <Square className="size-5" />
            Stop
          </Button>
        )}
      </div>

      {isPaused && (
        <p className="text-sm text-muted-foreground">Chronomètre en pause</p>
      )}
    </div>
  )
}
