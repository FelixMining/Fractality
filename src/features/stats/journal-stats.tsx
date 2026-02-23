import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { journalEntryRepository } from '@/lib/db/repositories/journal.repository'
import type { JournalEntry } from '@/schemas/journal-entry.schema'
import { StatsLayout } from './stats-layout'
import { PeriodSelector, DEFAULT_PERIOD_DAYS, getPeriodDates, formatShortDate } from './period-selector'
import { ChartContainer } from './charts/chart-container'
import { StatsBarChart } from './charts/bar-chart'
import { StatsLineChart } from './charts/line-chart'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fonctions d'agrégation pures ───────────────────────────────────────────

export function filterEntriesByPeriod(
  entries: JournalEntry[],
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): JournalEntry[] {
  return entries.filter((e) => {
    const d = e.entryDate.slice(0, 10)
    return d >= startDate && d <= endDate
  })
}

export function countEntriesByWeek(entries: JournalEntry[]): { week: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of entries) {
    const date = new Date(e.entryDate.slice(0, 10) + 'T12:00:00')
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const key = weekStart.toISOString().substring(0, 10)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))
}

export function buildPropertyCurves(
  entries: JournalEntry[],
): { date: string; humeur?: number; motivation?: number; energie?: number }[] {
  return entries
    .filter((e) => e.mood !== undefined || e.motivation !== undefined || e.energy !== undefined)
    .map((e) => ({
      date: e.entryDate.substring(0, 10),
      ...(e.mood !== undefined && { humeur: e.mood }),
      ...(e.motivation !== undefined && { motivation: e.motivation }),
      ...(e.energy !== undefined && { energie: e.energy }),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function calcTopTags(
  entries: JournalEntry[],
  topN = 10,
): { tag: string; count: number }[] {
  const countMap = new Map<string, number>()
  for (const e of entries) {
    e.tags?.forEach((t) => countMap.set(t, (countMap.get(t) ?? 0) + 1))
  }
  return [...countMap.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([tag, count]) => ({ tag, count }))
}

// ── Composant principal ────────────────────────────────────────────────────

export function JournalStats() {
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)
  const navigate = useNavigate()

  const { startDate, endDate } = useMemo(() => getPeriodDates(periodDays), [periodDays])
  const startDateOnly = startDate.substring(0, 10)
  const endDateOnly = endDate.substring(0, 10)

  const allEntries = useLiveQuery(() => journalEntryRepository.getAllByDateDesc())

  const filteredEntries = useMemo(
    () => filterEntriesByPeriod(allEntries ?? [], startDateOnly, endDateOnly),
    [allEntries, startDateOnly, endDateOnly],
  )

  const weeklyData = useMemo(() => countEntriesByWeek(filteredEntries), [filteredEntries])

  const propertyCurves = useMemo(() => buildPropertyCurves(filteredEntries), [filteredEntries])

  const topTags = useMemo(() => calcTopTags(filteredEntries, 10), [filteredEntries])

  const hasProperties = propertyCurves.length > 0
  const hasPropertyLines = useMemo(() => {
    const hasHumeur = propertyCurves.some((p) => p.humeur !== undefined)
    const hasMotivation = propertyCurves.some((p) => p.motivation !== undefined)
    const hasEnergie = propertyCurves.some((p) => p.energie !== undefined)
    return { hasHumeur, hasMotivation, hasEnergie }
  }, [propertyCurves])

  const propertyLines = useMemo(() => {
    const lines: { key: string; color: string; label: string }[] = []
    if (hasPropertyLines.hasHumeur) lines.push({ key: 'humeur', color: '#F59E0B', label: 'Humeur' })
    if (hasPropertyLines.hasMotivation) lines.push({ key: 'motivation', color: '#3B82F6', label: 'Motivation' })
    if (hasPropertyLines.hasEnergie) lines.push({ key: 'energie', color: '#10B981', label: 'Énergie' })
    return lines
  }, [hasPropertyLines])

  if (allEntries === undefined) {
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

  if (allEntries.length === 0) {
    return (
      <StatsLayout>
        <EmptyState
          icon={<BookOpen size={40} />}
          title="Aucune entrée de journal"
          subtitle="Commencez à écrire dans votre journal pour voir les statistiques."
          ctaLabel="Créer une entrée"
          ctaAction={() => navigate({ to: '/tracking/journal' })}
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
            label="Entrées"
            value={filteredEntries.length}
            color="#8B5CF6"
          />
          <StatCard
            label="Tags distincts"
            value={new Set(filteredEntries.flatMap((e) => e.tags ?? [])).size}
          />
        </div>

        {filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1">
            <p className="text-sm font-medium text-text-primary">Aucune entrée sur cette période</p>
            <p className="text-xs text-text-muted">Élargissez la période pour voir plus de données.</p>
          </div>
        ) : (
          <>
            {/* Fréquence d'écriture */}
            <ChartContainer title="Fréquence d'écriture par semaine">
              <StatsBarChart
                data={weeklyData as Record<string, unknown>[]}
                xKey="week"
                bars={[{ key: 'count', color: '#8B5CF6', label: 'Entrées' }]}
                tickFormatter={formatShortDate}
              />
            </ChartContainer>

            {/* Courbes propriétés */}
            {hasProperties && propertyLines.length > 0 && (
              <ChartContainer
                title="Tendances émotionnelles"
                description="Humeur, motivation, énergie (1-10)"
              >
                <StatsLineChart
                  data={propertyCurves as Record<string, unknown>[]}
                  xKey="date"
                  lines={propertyLines}
                  yUnit="/10"
                  tickFormatter={formatShortDate}
                />
              </ChartContainer>
            )}

            {/* Top tags */}
            {topTags.length > 0 && (
              <ChartContainer title="Tags les plus utilisés">
                <StatsBarChart
                  data={topTags as Record<string, unknown>[]}
                  xKey="tag"
                  bars={[{ key: 'count', color: '#8B5CF6', label: 'Occurrences' }]}
                />
              </ChartContainer>
            )}
          </>
        )}
      </div>
    </StatsLayout>
  )
}
