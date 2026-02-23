import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TimerDisplay } from '@/components/shared/timer-display'
import { Play, Pause, Square } from 'lucide-react'

interface WorkTimerProps {
  onStop: (duration: number) => void
}

export function WorkTimer({ onStop }: WorkTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // en secondes
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isPaused])

  const handleStart = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(true)
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  const handleStop = () => {
    // Empêcher la sauvegarde de sessions avec durée trop courte (< 1 seconde)
    if (elapsedTime < 1) {
      setIsRunning(false)
      setIsPaused(false)
      setElapsedTime(0)
      return
    }

    setIsRunning(false)
    setIsPaused(false)
    onStop(elapsedTime)
    setElapsedTime(0)
  }

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
