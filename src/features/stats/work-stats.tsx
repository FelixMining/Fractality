import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { BarChart2 } from 'lucide-react'
import { workSessionRepository } from '@/lib/db/repositories/work-session.repository'
import { projectRepository } from '@/lib/db/repositories/project.repository'
import type { WorkSession } from '@/schemas/work-session.schema'
import type { Project } from '@/schemas/project.schema'
import { StatsLayout } from './stats-layout'
import { PeriodSelector, DEFAULT_PERIOD_DAYS, getPeriodDates, formatShortDate } from './period-selector'
import { ChartContainer } from './charts/chart-container'
import { StatsBarChart } from './charts/bar-chart'
import { StatsLineChart } from './charts/line-chart'
import { StatsPieChart } from './charts/pie-chart'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fonctions d'agrégation pures ───────────────────────────────────────────

export function groupByDay(sessions: WorkSession[]): { date: string; heures: number }[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    const day = s.date.substring(0, 10)
    map.set(day, (map.get(day) ?? 0) + s.duration / 3600)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, heures]) => ({ date, heures: Math.round(heures * 10) / 10 }))
}

export function groupByWeek(sessions: WorkSession[]): { date: string; heures: number }[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    const date = new Date(s.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7)) // lundi
    const key = weekStart.toISOString().substring(0, 10)
    map.set(key, (map.get(key) ?? 0) + s.duration / 3600)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, heures]) => ({ date, heures: Math.round(heures * 10) / 10 }))
}

export function groupByMonth(sessions: WorkSession[]): { date: string; heures: number }[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    const key = s.date.substring(0, 7) // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + s.duration / 3600)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, heures]) => ({ date, heures: Math.round(heures * 10) / 10 }))
}

export function groupByProject(
  sessions: WorkSession[],
  projects: Project[],
): { name: string; value: number; color: string }[] {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const countMap = new Map<string, number>()

  for (const s of sessions) {
    const key = s.projectId ?? '__none__'
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
  }

  return [...countMap.entries()].map(([key, value]) => {
    if (key === '__none__') return { name: 'Sans projet', value, color: '#6B7280' }
    const project = projectMap.get(key)
    return { name: project?.name ?? 'Inconnu', value, color: project?.color ?? '#6B7280' }
  })
}

export function buildPropertyCurves(
  sessions: WorkSession[],
): { date: string; productivite?: number; concentration?: number }[] {
  return sessions
    .filter((s) => s.productivity !== undefined || s.concentration !== undefined)
    .map((s) => ({
      date: s.date.substring(0, 10),
      productivite: s.productivity,
      concentration: s.concentration,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function calcWorkTotals(sessions: WorkSession[]): {
  count: number
  avgDurationMin: number
} {
  const count = sessions.length
  if (count === 0) return { count: 0, avgDurationMin: 0 }
  const totalSec = sessions.reduce((sum, s) => sum + s.duration, 0)
  return { count, avgDurationMin: Math.round(totalSec / count / 60) }
}

// ── Composant principal ────────────────────────────────────────────────────

export function WorkStats() {
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)
  // H1 fix: useMemo évite de recréer les dates à chaque render
  const { startDate, endDate } = useMemo(() => getPeriodDates(periodDays), [periodDays])
  const navigate = useNavigate()

  const sessions = useLiveQuery(
    () => workSessionRepository.getByDateRange(startDate, endDate),
    [startDate, endDate],
  )
  const projects = useLiveQuery(() => projectRepository.getTree(), [])

  const isLoading = sessions === undefined || projects === undefined

  if (isLoading) {
    return (
      <StatsLayout>
        <div className="space-y-3 mt-2">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </StatsLayout>
    )
  }

  // H2 fix: message adapté à la situation réelle (période sans données)
  if (sessions.length === 0) {
    return (
      <StatsLayout>
        <div className="mt-2">
          <PeriodSelector value={periodDays} onChange={setPeriodDays} />
        </div>
        <EmptyState
          icon={<BarChart2 size={40} />}
          title="Aucune session sur cette période"
          subtitle="Essayez une période plus longue ou démarrez une nouvelle session de travail."
          ctaLabel="Démarrer une session"
          ctaAction={() => navigate({ to: '/sessions/work' })}
        />
      </StatsLayout>
    )
  }

  // M3 fix: granularité adaptive selon la durée de la période
  const [groupData, groupLabel] =
    periodDays <= 60
      ? [groupByDay(sessions), 'Heures par jour']
      : periodDays <= 180
        ? [groupByWeek(sessions), 'Heures par semaine']
        : [groupByMonth(sessions), 'Heures par mois']

  const projectData = groupByProject(sessions, projects)
  const curveData = buildPropertyCurves(sessions)
  const { count, avgDurationMin } = calcWorkTotals(sessions)

  return (
    <StatsLayout>
      <div className="mt-2 space-y-4">
        <PeriodSelector value={periodDays} onChange={setPeriodDays} />

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Sessions" value={count} color="#3B82F6" />
          <StatCard label="Durée moyenne" value={avgDurationMin} unit="min" />
        </div>

        <ChartContainer title={groupLabel} height={250}>
          <StatsBarChart
            data={groupData}
            xKey="date"
            bars={[{ key: 'heures', color: '#3B82F6', label: 'Heures' }]}
            tickFormatter={formatShortDate}
          />
        </ChartContainer>

        {projectData.length > 0 && (
          <ChartContainer title="Répartition par projet" height={250}>
            <StatsPieChart data={projectData} />
          </ChartContainer>
        )}

        {curveData.length > 0 && (
          <ChartContainer
            title="Propriétés (productivité & concentration)"
            description="Moyenne par session"
            height={250}
          >
            <StatsLineChart
              data={curveData}
              xKey="date"
              lines={[
                { key: 'productivite', color: '#3B82F6', label: 'Productivité' },
                { key: 'concentration', color: '#8B5CF6', label: 'Concentration' },
              ]}
              tickFormatter={formatShortDate}
            />
          </ChartContainer>
        )}
      </div>
    </StatsLayout>
  )
}
