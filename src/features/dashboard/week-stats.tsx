import { useLiveQuery } from 'dexie-react-hooks'
import { TrendingUp } from 'lucide-react'
import { db } from '@/lib/db/database'
import { toLocalDateString, formatDuration } from '@/lib/utils'
import {
  isDueOnDate,
  trackingRecurringRepository,
  trackingResponseRepository,
} from '@/lib/db/repositories/tracking.repository'
import { SectionTitle } from './today-summary'

/**
 * Calcule le lundi et dimanche de la semaine contenant `today` (semaine ISO, lundi = J1).
 */
export function getWeekRange(today: string): { weekStart: string; weekEnd: string } {
  const d = new Date(today + 'T12:00:00')
  const dayOfWeek = d.getDay()
  const daysFromMonday = (dayOfWeek + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    weekStart: toLocalDateString(monday),
    weekEnd: toLocalDateString(sunday),
  }
}

/**
 * Génère la liste des jours de `weekStart` jusqu'à `today` inclus.
 */
export function getDaysFromWeekStart(weekStart: string, today: string): string[] {
  const days: string[] = []
  let current = weekStart
  while (current <= today) {
    days.push(current)
    const d = new Date(current + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    current = toLocalDateString(d)
  }
  return days
}

export function WeekStats() {
  const today = toLocalDateString()
  const { weekStart } = getWeekRange(today)

  const weekData = useLiveQuery(
    async () => {
      const [workSessions, workoutSessions, cardioSessions, allRecurrings, weekResponses] =
        await Promise.all([
          db.work_sessions
            .filter((s) => {
              if (s.isDeleted) return false
              const localDate = toLocalDateString(new Date(s.date))
              return localDate >= weekStart && localDate <= today
            })
            .toArray(),
          db.workout_sessions
            .filter((s) => {
              if (s.isDeleted || s.status !== 'completed') return false
              const localDate = toLocalDateString(new Date(s.startedAt))
              return localDate >= weekStart && localDate <= today
            })
            .toArray(),
          db.cardio_sessions
            .filter((s) => {
              if (s.isDeleted) return false
              const localDate = toLocalDateString(new Date(s.date))
              return localDate >= weekStart && localDate <= today
            })
            .toArray(),
          trackingRecurringRepository.getAllSorted(),
          trackingResponseRepository.getInDateRange(weekStart, today),
        ])

      const totalWorkSeconds = workSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0)
      const sportCount = workoutSessions.length + cardioSessions.length

      const daysElapsed = getDaysFromWeekStart(weekStart, today)
      const responseSet = new Set(weekResponses.map((r) => `${r.recurringId}_${r.date}`))
      let totalDue = 0
      let totalAnswered = 0
      for (const day of daysElapsed) {
        for (const recurring of allRecurrings) {
          if (isDueOnDate(recurring, day)) {
            totalDue++
            if (responseSet.has(`${recurring.id}_${day}`)) totalAnswered++
          }
        }
      }
      const completionRate = totalDue > 0 ? Math.round((totalAnswered / totalDue) * 100) : null

      return { totalWorkSeconds, sportCount, completionRate }
    },
    [weekStart, today],
  )

  if (weekData === undefined) {
    return (
      <section>
        <SectionTitle icon={<TrendingUp size={17} />} label="Cette semaine" />
        <div className="h-24 animate-pulse rounded-xl bg-card" />
      </section>
    )
  }

  const { totalWorkSeconds, sportCount, completionRate } = weekData

  return (
    <section>
      <SectionTitle icon={<TrendingUp size={17} />} label="Cette semaine" />
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Travail</span>
          <span className="text-lg font-bold">
            {totalWorkSeconds > 0 ? formatDuration(totalWorkSeconds, false) : '0min'}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Sport</span>
          <span className="text-lg font-bold">
            {sportCount} séance{sportCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Suivis</span>
          <span className="text-lg font-bold">
            {completionRate !== null ? `${completionRate}%` : '0%'}
          </span>
        </div>
      </div>
    </section>
  )
}
