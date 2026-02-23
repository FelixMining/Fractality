import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { toLocalDateString } from '@/lib/utils'
import { StreakIndicator } from '@/components/shared/streak-indicator'

/**
 * Calcule le nombre de jours consécutifs avec activité en remontant depuis `today`.
 * Si aujourd'hui a une entrée → streak commence à today et remonte vers le passé.
 * Si aujourd'hui n'a pas d'entrée → streak = 0 (la journée n'a pas encore démarré).
 */
export function calculateStreak(activeDates: Set<string>, today: string): number {
  let streak = 0
  let currentDate = today
  while (activeDates.has(currentDate)) {
    streak++
    const d = new Date(currentDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    currentDate = toLocalDateString(d)
  }
  return streak
}

/**
 * Génère les 7 derniers jours (de J-6 à today inclus).
 */
export function getLast7Days(today: string): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today + 'T12:00:00')
    d.setDate(d.getDate() - i)
    days.push(toLocalDateString(d))
  }
  return days // [J-6, J-5, J-4, J-3, J-2, J-1, today]
}

export function StreakDisplay() {
  const today = toLocalDateString()

  const activeDates = useLiveQuery(async (): Promise<Set<string>> => {
    const [
      workSessions,
      workoutSessions,
      cardioSessions,
      trackingEvents,
      journalEntries,
      trackingResponses,
    ] = await Promise.all([
      db.work_sessions.filter((s) => !s.isDeleted).toArray(),
      db.workout_sessions.filter((s) => !s.isDeleted && s.status === 'completed').toArray(),
      db.cardio_sessions.filter((s) => !s.isDeleted).toArray(),
      db.tracking_events.filter((e) => !e.isDeleted).toArray(),
      db.journal_entries.filter((e) => !e.isDeleted).toArray(),
      db.tracking_responses.filter((r) => !r.isDeleted).toArray(),
    ])

    const dates = new Set<string>()

    // work_sessions.date : ISO datetime → date locale
    workSessions.forEach((s) => dates.add(toLocalDateString(new Date(s.date))))
    // workout_sessions.startedAt : ISO datetime → date locale (timezone-safe)
    workoutSessions.forEach((s) => dates.add(toLocalDateString(new Date(s.startedAt))))
    // cardio_sessions.date : ISO datetime → date locale
    cardioSessions.forEach((s) => dates.add(toLocalDateString(new Date(s.date))))
    // tracking_events.eventDate : "YYYY-MM-DDTHH:mm" → 10 premiers chars
    trackingEvents.forEach((e) => dates.add(e.eventDate.substring(0, 10)))
    // journal_entries.entryDate : "YYYY-MM-DDTHH:mm" → 10 premiers chars
    journalEntries.forEach((e) => dates.add(e.entryDate.substring(0, 10)))
    // tracking_responses.date : "YYYY-MM-DD" → direct
    trackingResponses.forEach((r) => dates.add(r.date))

    return dates
  }, [])

  if (activeDates === undefined) {
    return <div className="h-24 animate-pulse rounded-xl bg-card" />
  }

  const streakCount = calculateStreak(activeDates, today)
  const last7Days = getLast7Days(today)
  const days = last7Days.map((date) => ({
    date,
    hasActivity: activeDates.has(date),
  }))

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Régularité
      </h3>
      <div className="rounded-xl border border-border bg-card p-4">
        <StreakIndicator days={days} streakCount={streakCount} today={today} />
      </div>
    </section>
  )
}
