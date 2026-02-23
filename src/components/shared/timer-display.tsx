interface TimerDisplayProps {
  elapsedTime: number // en secondes
  className?: string
}

export function TimerDisplay({ elapsedTime, className = '' }: TimerDisplayProps) {
  const hours = Math.floor(elapsedTime / 3600)
  const minutes = Math.floor((elapsedTime % 3600) / 60)
  const seconds = elapsedTime % 60

  return (
    <div className={`font-mono text-4xl font-bold ${className}`}>
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </div>
  )
}
