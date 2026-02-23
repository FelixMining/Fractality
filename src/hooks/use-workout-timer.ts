import { useEffect, useRef } from 'react'
import { useWorkoutStore } from '@/stores/workout.store'

export function useWorkoutTimer() {
  const { elapsedTime, isTimerRunning } = useWorkoutStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        useWorkoutStore.setState((state) => ({
          ...state,
          elapsedTime: state.elapsedTime + 1,
        }))
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTimerRunning])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return [hours, minutes, secs]
      .map((val) => val.toString().padStart(2, '0'))
      .join(':')
  }

  return {
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
  }
}
