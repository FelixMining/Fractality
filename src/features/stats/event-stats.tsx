import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'
import { trackingEventRepository, eventTypeRepository } from '@/lib/db/repositories/event.repository'
import type { TrackingEvent } from '@/schemas/tracking-event.schema'
import type { EventType } from '@/schemas/tracking-event-type.schema'
import { StatsLayout } from './stats-layout'
import { PeriodSelector, DEFAULT_PERIOD_DAYS, getPeriodDates, formatShortDate } from './period-selector'
import { ChartContainer } from './charts/chart-container'
import { StatsBarChart } from './charts/bar-chart'
import { StatsPieChart } from './charts/pie-chart'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fonctions d'agrégation pures ───────────────────────────────────────────

export function filterEventsByPeriod(
  events: TrackingEvent[],
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): TrackingEvent[] {
  return events.filter((e) => {
    const d = e.eventDate.slice(0, 10)
    return d >= startDate && d <= endDate
  })
}

export function countEventsByWeek(events: TrackingEvent[]): { week: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of events) {
    const date = new Date(e.eventDate.slice(0, 10) + 'T12:00:00')
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const key = weekStart.toISOString().substring(0, 10)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))
}

export function countEventsByType(events: TrackingEvent[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of events) {
    const key = e.typeId ?? '__none__'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

export function buildEventTypeBarData(
  events: TrackingEvent[],
  types: EventType[],
): { name: string; count: number }[] {
  const typeMap = new Map(types.map((t) => [t.id, t]))
  const counts = countEventsByType(events)
  return [...counts.entries()]
    .map(([key, count]) => ({
      name: key === '__none__' ? 'Sans type' : (typeMap.get(key)?.name ?? 'Inconnu'),
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

export function buildEventTypeDistribution(
  events: TrackingEvent[],
  types: EventType[],
): { name: string; value: number; color: string }[] {
  const typeMap = new Map(types.map((t) => [t.id, t]))
  const counts = countEventsByType(events)
  return [...counts.entries()]
    .map(([key, value]) => {
      if (key === '__none__') return { name: 'Sans type', value, color: '#6B7280' }
      const type = typeMap.get(key)
      return { name: type?.name ?? 'Inconnu', value, color: type?.color ?? '#8B5CF6' }
    })
    .sort((a, b) => b.value - a.value)
}

// ── Composant principal ────────────────────────────────────────────────────

export function EventStats() {
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)
  const navigate = useNavigate()

  const { startDate, endDate } = useMemo(() => getPeriodDates(periodDays), [periodDays])
  const startDateOnly = startDate.substring(0, 10)
  const endDateOnly = endDate.substring(0, 10)

  const allEvents = useLiveQuery(() => trackingEventRepository.getAllByDateDesc())
  const allTypes = useLiveQuery(() => eventTypeRepository.getAllSorted())

  const filteredEvents = useMemo(
    () => filterEventsByPeriod(allEvents ?? [], startDateOnly, endDateOnly),
    [allEvents, startDateOnly, endDateOnly],
  )

  const weeklyData = useMemo(() => countEventsByWeek(filteredEvents), [filteredEvents])

  const typeBarData = useMemo(
    () => buildEventTypeBarData(filteredEvents, allTypes ?? []),
    [filteredEvents, allTypes],
  )

  const typeDistribution = useMemo(
    () => buildEventTypeDistribution(filteredEvents, allTypes ?? []),
    [filteredEvents, allTypes],
  )

  if (allEvents === undefined || allTypes === undefined) {
    return (
      <StatsLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </StatsLayout>
    )
  }

  if (allEvents.length === 0) {
    return (
      <StatsLayout>
        <EmptyState
          icon={<Calendar size={40} />}
          title="Aucun événement enregistré"
          subtitle="Commencez à enregistrer vos événements pour voir leurs statistiques."
          ctaLabel="Créer un événement"
          ctaAction={() => navigate({ to: '/tracking/events' })}
        />
      </StatsLayout>
    )
  }

  return (
    <StatsLayout>
      <div className="space-y-4">
        <PeriodSelector value={periodDays} onChange={setPeriodDays} />

        {/* StatCards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Événements"
            value={filteredEvents.length}
            color="#8B5CF6"
          />
          <StatCard
            label="Types utilisés"
            value={typeDistribution.filter((t) => t.name !== 'Sans type').length}
          />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1">
            <p className="text-sm font-medium text-text-primary">Aucun événement sur cette période</p>
            <p className="text-xs text-text-muted">Élargissez la période pour voir plus de données.</p>
          </div>
        ) : (
          <>
            {/* Événements par semaine */}
            <ChartContainer title="Événements par semaine">
              <StatsBarChart
                data={weeklyData as Record<string, unknown>[]}
                xKey="week"
                bars={[{ key: 'count', color: '#8B5CF6', label: 'Événements' }]}
                tickFormatter={formatShortDate}
              />
            </ChartContainer>

            {/* Fréquence par type d'événement */}
            {typeBarData.length > 0 && (
              <ChartContainer title="Fréquence par type">
                <StatsBarChart
                  data={typeBarData as Record<string, unknown>[]}
                  xKey="name"
                  bars={[{ key: 'count', color: '#8B5CF6', label: 'Occurrences' }]}
                />
              </ChartContainer>
            )}

            {/* Répartition par type */}
            {typeDistribution.length > 0 && (
              <ChartContainer title="Répartition par type">
                <StatsPieChart data={typeDistribution} />
              </ChartContainer>
            )}
          </>
        )}
      </div>
    </StatsLayout>
  )
}
