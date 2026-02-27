import { useLiveQuery } from 'dexie-react-hooks'
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
      // Sessions travail du jour (filtrage local par date locale)
      db.work_sessions
        .filter((s) => !s.isDeleted && toLocalDateString(new Date(s.date)) === today)
        .toArray(),
      // Événements du jour (eventDate = "YYYY-MM-DDTHH:mm")
      db.tracking_events
        .filter((e) => !e.isDeleted && e.eventDate.startsWith(today))
        .toArray(),
      // Journal du jour (entryDate = "YYYY-MM-DDTHH:mm")
      db.journal_entries
        .filter((e) => !e.isDeleted && e.entryDate.startsWith(today))
        .toArray(),
      // Tous les suivis actifs non supprimés
      trackingRecurringRepository.getAllSorted(),
      // Réponses du jour
      trackingResponseRepository.getByDate(today),
    ])

    // Filtrer les suivis planifiés aujourd'hui
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

    // Durée totale sessions travail (en secondes)
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Aujourd'hui
        </h2>
        <div className="h-24 animate-pulse rounded-xl bg-card" />
      </section>
    )
  }

  const { workCount, totalWorkSeconds, eventCount, journalCount, dueRecurrings, todayResponses } =
    data

  return (
    <section aria-label="Résumé du jour">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Aujourd'hui
      </h2>

      {/* Cartes de résumé */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {/* Sessions travail */}
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Travail</p>
          <p className="mt-1 text-lg font-bold">{workCount}</p>
          {totalWorkSeconds > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatDuration(totalWorkSeconds, false)}
            </p>
          )}
        </div>

        {/* Événements */}
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Événements</p>
          <p className="mt-1 text-lg font-bold">{eventCount}</p>
        </div>

        {/* Journal */}
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Journal</p>
          <p className="mt-1 text-lg font-bold">{journalCount}</p>
        </div>
      </div>

      {/* Suivis du jour */}
      {dueRecurrings.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Suivis du jour
            {data.pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs">
                {data.pendingCount} en attente
              </span>
            )}
          </h3>
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
