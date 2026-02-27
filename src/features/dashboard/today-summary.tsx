import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, ClipboardList } from 'lucide-react'
import { db } from '@/lib/db/database'
import {
  isDueOnDate,
  trackingRecurringRepository,
  trackingResponseRepository,
} from '@/lib/db/repositories/tracking.repository'
import { toLocalDateString, formatDuration } from '@/lib/utils'
import { TrackingItem } from '@/components/shared/tracking-item'

export function TodaySummary() {
  const today = toLocalDateString()

  const data = useLiveQuery(async () => {
    const [
      workSessions,
      todayEvents,
      todayJournal,
      allRecurrings,
      todayResponses,
    ] = await Promise.all([
      db.work_sessions
        .filter((s) => !s.isDeleted && toLocalDateString(new Date(s.date)) === today)
        .toArray(),
      db.tracking_events
        .filter((e) => !e.isDeleted && e.eventDate.startsWith(today))
        .toArray(),
      db.journal_entries
        .filter((e) => !e.isDeleted && e.entryDate.startsWith(today))
        .toArray(),
      trackingRecurringRepository.getAllSorted(),
      trackingResponseRepository.getByDate(today),
    ])

    const dueRecurrings = allRecurrings.filter((r) => isDueOnDate(r, today))
    const answeredIds = new Set(todayResponses.map((r) => r.recurringId))
    const pendingRecurrings = dueRecurrings.filter((r) => !answeredIds.has(r.id))
    // Trier : non répondus en premier
    dueRecurrings.sort((a, b) => {
      const aPending = !answeredIds.has(a.id)
      const bPending = !answeredIds.has(b.id)
      if (aPending && !bPending) return -1
      if (!aPending && bPending) return 1
      return 0
    })

    const totalWorkSeconds = workSessions.reduce((sum, s) => sum + s.duration, 0)

    return {
      workCount: workSessions.length,
      totalWorkSeconds,
      eventCount: todayEvents.length,
      journalCount: todayJournal.length,
      dueRecurrings,
      pendingCount: pendingRecurrings.length,
      todayResponses,
    }
  }, [today])

  if (data === undefined) {
    return (
      <section aria-label="Résumé du jour">
        <SectionTitle icon={<CalendarDays size={17} />} label="Aujourd'hui" />
        <div className="h-24 animate-pulse rounded-xl bg-card" />
      </section>
    )
  }

  const { workCount, totalWorkSeconds, eventCount, journalCount, dueRecurrings, todayResponses } =
    data

  return (
    <section aria-label="Résumé du jour">
      <SectionTitle icon={<CalendarDays size={17} />} label="Aujourd'hui" />

      {/* Cartes de résumé */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Travail</p>
          <p className="mt-1 text-lg font-bold">{workCount}</p>
          {totalWorkSeconds > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatDuration(totalWorkSeconds, false)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Événements</p>
          <p className="mt-1 text-lg font-bold">{eventCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Journal</p>
          <p className="mt-1 text-lg font-bold">{journalCount}</p>
        </div>
      </div>

      {/* Suivis du jour */}
      {dueRecurrings.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <ClipboardList size={14} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Suivis du jour</h3>
            {data.pendingCount > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                {data.pendingCount} en attente
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {dueRecurrings.map((recurring) => (
              <TrackingItem
                key={recurring.id}
                recurring={recurring}
                todayResponse={todayResponses.find((r) => r.recurringId === recurring.id)}
                today={today}
                isDueToday={true}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// Composant titre de section partagé dans le dashboard
export function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">{label}</h2>
    </div>
  )
}
