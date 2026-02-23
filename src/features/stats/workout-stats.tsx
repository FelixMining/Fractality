import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell } from 'lucide-react'
import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { db } from '@/lib/db/database'
import type { WorkoutSession } from '@/schemas/workout-session.schema'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'
import { StatsLayout } from './stats-layout'
import { PeriodSelector, DEFAULT_PERIOD_DAYS, getPeriodDates, formatShortDate } from './period-selector'
import { ChartContainer } from './charts/chart-container'
import { StatsBarChart } from './charts/bar-chart'
import { StatsLineChart } from './charts/line-chart'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fonctions d'agrégation pures ───────────────────────────────────────────

export function filterSessionsByPeriod(
  sessions: WorkoutSession[],
  startDate: string,
  endDate: string,
): WorkoutSession[] {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  return sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime()
    return t >= start && t <= end
  })
}

export function calcVolumePerSession(
  sessions: WorkoutSession[],
): { date: string; volume: number }[] {
  return sessions
    .filter((s) => s.status === 'completed' && s.completedAt)
    .map((s) => ({
      date: s.completedAt!.substring(0, 10),
      volume: Math.round(s.totalVolume ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function calcFrequencyPerWeek(
  sessions: WorkoutSession[],
): { semaine: string; seances: number }[] {
  const weekMap = new Map<string, number>()
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.completedAt) continue
    const date = new Date(s.completedAt)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7)) // lundi
    const key = weekStart.toISOString().substring(0, 10)
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semaine, seances]) => ({ semaine, seances }))
}

export function calcWorkoutTotals(
  sessions: WorkoutSession[],
  allSeries: WorkoutSeries[],
): { totalSessions: number; totalSeries: number; totalVolume: number } {
  const completed = sessions.filter((s) => s.status === 'completed')
  const sessionIds = new Set(completed.map((s) => s.id))
  const relevantSeries = allSeries.filter((s) => sessionIds.has(s.sessionId) && !s.isDeleted)
  return {
    totalSessions: completed.length,
    totalSeries: relevantSeries.length,
    totalVolume: Math.round(
      relevantSeries.reduce((sum, s) => sum + s.reps * (s.weight ?? 0), 0),
    ),
  }
}

export function buildWeightProgressByExercise(
  sessions: WorkoutSession[],
  allSeries: WorkoutSeries[],
  exercises: WorkoutExercise[],
  exerciseId: string,
): { date: string; charge: number }[] {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))
  if (!exerciseMap.has(exerciseId)) return []

  const sessionDateMap = new Map(
    sessions
      .filter((s) => s.status === 'completed' && s.completedAt)
      .map((s) => [s.id, s.completedAt!.substring(0, 10)]),
  )

  const byDate = new Map<string, number>()
  for (const s of allSeries) {
    if (s.exerciseId !== exerciseId || s.isDeleted || !s.weight) continue
    const date = sessionDateMap.get(s.sessionId)
    if (!date) continue
    const current = byDate.get(date) ?? 0
    if (s.weight > current) byDate.set(date, s.weight)
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, charge]) => ({ date, charge }))
}

// ── Composant principal ────────────────────────────────────────────────────

export function WorkoutStats() {
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  // H1 fix: useMemo évite de recréer les dates à chaque render
  const { startDate, endDate } = useMemo(() => getPeriodDates(periodDays), [periodDays])

  const allSessions = useLiveQuery(() => workoutSessionRepository.getCompletedSessions(), [])
  const allSeries = useLiveQuery(
    () => db.workout_series.filter((s) => !s.isDeleted).toArray(),
    [],
  )
  const exercises = useLiveQuery(() => workoutExerciseRepository.getAllSorted(), [])

  const isLoading = allSessions === undefined || allSeries === undefined || exercises === undefined

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
          icon={<Dumbbell size={40} />}
          title="Aucune séance de musculation"
          subtitle="Complétez des séances de musculation pour voir vos statistiques ici."
        />
      </StatsLayout>
    )
  }

  const sessions = filterSessionsByPeriod(allSessions, startDate, endDate)

  if (sessions.length === 0) {
    return (
      <StatsLayout>
        <div className="mt-2">
          <PeriodSelector value={periodDays} onChange={setPeriodDays} />
        </div>
        <EmptyState
          icon={<Dumbbell size={40} />}
          title="Aucune séance sur cette période"
          subtitle="Élargissez la période pour voir vos statistiques."
        />
      </StatsLayout>
    )
  }

  const volumeData = calcVolumePerSession(sessions)
  const frequencyData = calcFrequencyPerWeek(sessions)
  const totals = calcWorkoutTotals(sessions, allSeries)

  const activeExerciseId = selectedExerciseId || (exercises[0]?.id ?? '')
  const progressData = buildWeightProgressByExercise(sessions, allSeries, exercises, activeExerciseId)
  const activeExerciseName = exercises.find((e) => e.id === activeExerciseId)?.name ?? ''

  return (
    <StatsLayout>
      <div className="mt-2 space-y-4">
        <PeriodSelector value={periodDays} onChange={setPeriodDays} />

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Séances" value={totals.totalSessions} color="#3B82F6" />
          <StatCard label="Séries" value={totals.totalSeries} />
          <StatCard label="Tonnage" value={totals.totalVolume} unit="kg" />
        </div>

        {volumeData.length > 0 && (
          <ChartContainer title="Volume par séance (kg)" height={220}>
            <StatsBarChart
              data={volumeData}
              xKey="date"
              bars={[{ key: 'volume', color: '#3B82F6', label: 'Volume (kg)' }]}
              tickFormatter={formatShortDate}
            />
          </ChartContainer>
        )}

        {frequencyData.length > 0 && (
          <ChartContainer title="Fréquence par semaine" height={200}>
            <StatsBarChart
              data={frequencyData}
              xKey="semaine"
              bars={[{ key: 'seances', color: '#8B5CF6', label: 'Séances' }]}
              tickFormatter={formatShortDate}
            />
          </ChartContainer>
        )}

        {/* M4 fix: select hors du ChartContainer pour éviter le double wrapping hauteur */}
        {exercises.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Exercice :</span>
              <select
                value={activeExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-text-primary"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
            {progressData.length > 0 ? (
              <ChartContainer
                title={`Progression de charge — ${activeExerciseName}`}
                description="Charge maximale par séance"
                height={220}
              >
                <StatsLineChart
                  data={progressData}
                  xKey="date"
                  lines={[{ key: 'charge', color: '#3B82F6', label: 'Charge max (kg)' }]}
                  tickFormatter={formatShortDate}
                />
              </ChartContainer>
            ) : (
              <p className="text-xs text-text-secondary text-center py-4">
                Aucune donnée de charge sur cette période pour cet exercice.
              </p>
            )}
          </>
        )}
      </div>
    </StatsLayout>
  )
}
