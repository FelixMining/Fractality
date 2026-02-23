import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Activity } from 'lucide-react'
import { cardioSessionRepository } from '@/lib/db/repositories/cardio-session.repository'
import type { CardioSession } from '@/schemas/cardio-session.schema'
import { StatsLayout } from './stats-layout'
import { PeriodSelector, DEFAULT_PERIOD_DAYS, getPeriodDates, formatShortDate } from './period-selector'
import { ChartContainer } from './charts/chart-container'
import { StatsBarChart } from './charts/bar-chart'
import { StatsLineChart } from './charts/line-chart'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fonctions d'agrégation pures ───────────────────────────────────────────

export function filterCardioByPeriod(
  sessions: CardioSession[],
  startDate: string,
  endDate: string,
): CardioSession[] {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  return sessions.filter((s) => {
    const t = new Date(s.date).getTime()
    return t >= start && t <= end
  })
}

export function calcCardioTotals(sessions: CardioSession[]): {
  totalDistanceKm: number
  totalElevationM: number
  totalDurationH: number
} {
  return {
    totalDistanceKm:
      Math.round((sessions.reduce((sum, s) => sum + (s.distance ?? 0), 0) / 1000) * 10) / 10,
    totalElevationM: Math.round(sessions.reduce((sum, s) => sum + (s.elevationGain ?? 0), 0)),
    totalDurationH:
      Math.round((sessions.reduce((sum, s) => sum + s.duration, 0) / 3600) * 10) / 10,
  }
}

export function countSessionsPerWeek(
  sessions: CardioSession[],
): { semaine: string; seances: number }[] {
  const weekMap = new Map<string, number>()
  for (const s of sessions) {
    const date = new Date(s.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const key = weekStart.toISOString().substring(0, 10)
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semaine, seances]) => ({ semaine, seances }))
}

type CardioMetric = 'distance' | 'vitesse' | 'denivele' | 'allure'

export function buildMetricCurve(
  sessions: CardioSession[],
  metric: CardioMetric,
): { date: string; valeur: number }[] {
  return sessions
    .filter((s) => {
      if (metric === 'distance') return s.distance !== undefined
      if (metric === 'vitesse') return s.avgSpeed !== undefined
      if (metric === 'denivele') return s.elevationGain !== undefined
      if (metric === 'allure') return s.avgPace !== undefined
      return false
    })
    .map((s) => {
      let valeur = 0
      if (metric === 'distance') valeur = Math.round((s.distance! / 1000) * 10) / 10
      else if (metric === 'vitesse') valeur = Math.round((s.avgSpeed ?? 0) * 10) / 10
      else if (metric === 'denivele') valeur = Math.round(s.elevationGain ?? 0)
      else if (metric === 'allure') valeur = Math.round(((s.avgPace ?? 0) / 60) * 10) / 10
      return { date: s.date.substring(0, 10), valeur }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

const METRIC_LABELS: Record<CardioMetric, string> = {
  distance: 'Distance (km)',
  vitesse: 'Vitesse moy. (km/h)',
  denivele: 'Dénivelé (m)',
  allure: 'Allure (min/km)',
}

// ── Composant principal ────────────────────────────────────────────────────

export function CardioStats() {
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)
  const [metric, setMetric] = useState<CardioMetric>('distance')
  // H1 fix: useMemo évite de recréer les dates à chaque render
  const { startDate, endDate } = useMemo(() => getPeriodDates(periodDays), [periodDays])

  const allSessions = useLiveQuery(() => cardioSessionRepository.getAllSorted(), [])

  const isLoading = allSessions === undefined

  if (isLoading) {
    return (
      <StatsLayout>
        <div className="space-y-3 mt-2">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </StatsLayout>
    )
  }

  // H2 fix: distinguer "jamais de données" vs "pas de données sur cette période"
  if (allSessions.length === 0) {
    return (
      <StatsLayout>
        <div className="mt-2">
          <PeriodSelector value={periodDays} onChange={setPeriodDays} />
        </div>
        <EmptyState
          icon={<Activity size={40} />}
          title="Aucune session cardio"
          subtitle="Enregistrez des sessions cardio pour voir vos statistiques ici."
        />
      </StatsLayout>
    )
  }

  const sessions = filterCardioByPeriod(allSessions, startDate, endDate)

  if (sessions.length === 0) {
    return (
      <StatsLayout>
        <div className="mt-2">
          <PeriodSelector value={periodDays} onChange={setPeriodDays} />
        </div>
        <EmptyState
          icon={<Activity size={40} />}
          title="Aucune session cardio sur cette période"
          subtitle="Élargissez la période pour voir vos statistiques."
        />
      </StatsLayout>
    )
  }

  const totals = calcCardioTotals(sessions)
  const weeklyData = countSessionsPerWeek(sessions)
  const metricData = buildMetricCurve(sessions, metric)

  return (
    <StatsLayout>
      <div className="mt-2 space-y-4">
        <PeriodSelector value={periodDays} onChange={setPeriodDays} />

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Distance" value={totals.totalDistanceKm} unit="km" color="#10B981" />
          <StatCard label="Dénivelé" value={totals.totalElevationM} unit="m" />
          <StatCard label="Durée" value={totals.totalDurationH} unit="h" />
        </div>

        {weeklyData.length > 0 && (
          <ChartContainer title="Sessions par semaine" height={220}>
            <StatsBarChart
              data={weeklyData}
              xKey="semaine"
              bars={[{ key: 'seances', color: '#10B981', label: 'Sessions' }]}
              tickFormatter={formatShortDate}
            />
          </ChartContainer>
        )}

        <ChartContainer
          title="Évolution des métriques"
          description="Par session sur la période"
          height={260}
        >
          <div className="mb-2 flex gap-1 flex-wrap">
            {(Object.keys(METRIC_LABELS) as CardioMetric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                  metric === m
                    ? 'bg-emerald-500 text-white'
                    : 'border border-border text-text-secondary'
                }`}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
          {metricData.length > 0 ? (
            <div style={{ height: 200 }}>
              <StatsLineChart
                data={metricData}
                xKey="date"
                lines={[{ key: 'valeur', color: '#10B981', label: METRIC_LABELS[metric] }]}
                tickFormatter={formatShortDate}
              />
            </div>
          ) : (
            <p className="text-xs text-text-secondary text-center py-8">
              Aucune donnée pour cette métrique sur la période sélectionnée.
            </p>
          )}
        </ChartContainer>
      </div>
    </StatsLayout>
  )
}
