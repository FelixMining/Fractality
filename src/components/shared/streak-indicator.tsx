interface StreakDaySegment {
  date: string
  hasActivity: boolean
}

interface StreakIndicatorProps {
  /** Les 7 derniers jours, du plus ancien (index 0) au plus récent (today, index 6) */
  days: StreakDaySegment[]
  streakCount: number
  today: string
}

const GRADIENT_ACCENT = 'linear-gradient(135deg, #3B82F6, #8B5CF6)'

export function StreakIndicator({ days, streakCount, today }: StreakIndicatorProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Chiffre du streak avec gradient accent */}
      <div
        className="flex items-baseline gap-1"
        aria-label={`${streakCount} jour${streakCount !== 1 ? 's' : ''} consécutif${streakCount !== 1 ? 's' : ''}`}
      >
        <span
          className="text-4xl font-bold"
          style={{
            background: GRADIENT_ACCENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          aria-hidden="true"
        >
          {streakCount}
        </span>
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          jour{streakCount !== 1 ? 's' : ''} consécutif{streakCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Segments des 7 derniers jours */}
      <div
        className="flex items-center gap-1.5"
        role="img"
        aria-label={`Activité des 7 derniers jours : ${days.filter((d) => d.hasActivity).length} jours actifs`}
      >
        {days.map(({ date, hasActivity }) => {
          const isToday = date === today
          const isPulse = isToday && !hasActivity

          if (hasActivity) {
            return (
              <div
                key={date}
                className="h-4 w-4 flex-shrink-0 rounded-sm"
                style={{ background: GRADIENT_ACCENT }}
                title={date === today ? "Aujourd'hui" : date}
              />
            )
          }

          return (
            <div
              key={date}
              className={`h-4 w-4 flex-shrink-0 rounded-sm bg-muted${isPulse ? ' animate-pulse' : ''}`}
              title={isToday ? "Aujourd'hui — aucune entrée" : date}
            />
          )
        })}
        <span className="ml-1 text-xs text-muted-foreground">← 7 derniers jours</span>
      </div>
    </div>
  )
}
