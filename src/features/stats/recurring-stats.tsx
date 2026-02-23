import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  trackingRecurringRepository,
  trackingResponseRepository,
  getScheduledDates,
} from '@/lib/db/repositories/tracking.repository'
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'
import type { TrackingResponse } from '@/schemas/tracking-response.schema'
import { StatsLayout } from './stats-layout'
import { PeriodSelector, DEFAULT_PERIOD_DAYS, getPeriodDates } from './period-selector'
import { ChartContainer } from './charts/chart-container'
import { StatsLineChart } from './charts/line-chart'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fonctions d'agrégation pures ───────────────────────────────────────────

export function filterResponsesByRecurring(
  responses: TrackingResponse[],
  recurringId: string,
): TrackingResponse[] {
  return responses.filter((r) => r.recurringId === recurringId)
}

export function buildNumberValueCurve(
  responses: TrackingResponse[],
  recurringId: string,
): { date: string; value: number }[] {
  return responses
    .filter((r) => r.recurringId === recurringId && r.valueNumber !== undefined)
    .map((r) => ({ date: r.date, value: r.valueNumber! }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function buildBooleanCalendar(
  responses: TrackingResponse[],
  recurringId: string,
  scheduled: string[],
): { date: string; value: boolean | null }[] {
  const responseMap = new Map(
    responses
      .filter((r) => r.recurringId === recurringId && r.valueBoolean !== undefined)
      .map((r) => [r.date, r.valueBoolean!]),
  )
  return scheduled.map((date) => ({
    date,
    value: responseMap.has(date) ? responseMap.get(date)! : null,
  }))
}

export function calcCompletionRate(
  recurrings: TrackingRecurring[],
  responses: TrackingResponse[],
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): number {
  const from = new Date(startDate + 'T00:00:00')
  const to = new Date(endDate + 'T23:59:59')
  let totalScheduled = 0
  for (const r of recurrings) {
    totalScheduled += getScheduledDates(r, from, to).length
  }
  if (totalScheduled === 0) return 0

  const responseSet = new Set(responses.map((r) => `${r.recurringId}:${r.date}`))
  let totalAnswered = 0
  for (const r of recurrings) {
    const dates = getScheduledDates(r, from, to)
    totalAnswered += dates.filter((d) => responseSet.has(`${r.id}:${d}`)).length
  }
  return Math.round((totalAnswered / totalScheduled) * 100)
}

export function calcCompletionRateByRecurring(
  recurrings: TrackingRecurring[],
  responses: TrackingResponse[],
  startDate: string,
  endDate: string,
): { name: string; rate: number; recurringId: string }[] {
  const from = new Date(startDate + 'T00:00:00')
  const to = new Date(endDate + 'T23:59:59')
  const responseSet = new Set(responses.map((r) => `${r.recurringId}:${r.date}`))

  return recurrings.map((recurring) => {
    const dates = getScheduledDates(recurring, from, to)
    if (dates.length === 0) return { name: recurring.name, rate: 0, recurringId: recurring.id }
    const answered = dates.filter((d) => responseSet.has(`${recurring.id}:${d}`)).length
    return {
      name: recurring.name,
      rate: Math.round((answered / dates.length) * 100),
      recurringId: recurring.id,
    }
  })
}

// ── Composant calendrier booléen ───────────────────────────────────────────

function BooleanCalendar({ cells }: { cells: { date: string; value: boolean | null }[] }) {
  if (cells.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {cells.map(({ date, value }) => (
        <div
          key={date}
          title={date}
          className={cn(
            'w-5 h-5 rounded-sm',
            value === true && 'bg-green-500',
            value === false && 'bg-red-500/60',
            value === null && 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────

export function RecurringStats() {
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)
  const [selectedRecurringId, setSelectedRecurringId] = useState<string>('')
  const navigate = useNavigate()

  const { startDate, endDate } = useMemo(() => getPeriodDates(periodDays), [periodDays])
  const startDateOnly = startDate.substring(0, 10)
  const endDateOnly = endDate.substring(0, 10)

  const allRecurrings = useLiveQuery(() => trackingRecurringRepository.getAllSorted())
  const allResponses = useLiveQuery(
    () => trackingResponseRepository.getInDateRange(startDateOnly, endDateOnly),
    [startDateOnly, endDateOnly],
  )

  const selectedRecurring = useMemo(
    () => allRecurrings?.find((r) => r.id === selectedRecurringId) ?? allRecurrings?.[0],
    [allRecurrings, selectedRecurringId],
  )

  const effectiveId = selectedRecurring?.id ?? ''

  const scheduledDates = useMemo(() => {
    if (!selectedRecurring) return []
    return getScheduledDates(
      selectedRecurring,
      new Date(startDateOnly + 'T00:00:00'),
      new Date(endDateOnly + 'T23:59:59'),
    )
  }, [selectedRecurring, startDateOnly, endDateOnly])

  const globalRate = useMemo(
    () =>
      calcCompletionRate(allRecurrings ?? [], allResponses ?? [], startDateOnly, endDateOnly),
    [allRecurrings, allResponses, startDateOnly, endDateOnly],
  )

  const ratesByRecurring = useMemo(
    () =>
      calcCompletionRateByRecurring(
        allRecurrings ?? [],
        allResponses ?? [],
        startDateOnly,
        endDateOnly,
      ),
    [allRecurrings, allResponses, startDateOnly, endDateOnly],
  )

  const numberCurve = useMemo(
    () => buildNumberValueCurve(allResponses ?? [], effectiveId),
    [allResponses, effectiveId],
  )

  const booleanCalendar = useMemo(
    () => buildBooleanCalendar(allResponses ?? [], effectiveId, scheduledDates),
    [allResponses, effectiveId, scheduledDates],
  )

  if (allRecurrings === undefined || allResponses === undefined) {
    return (
      <StatsLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </StatsLayout>
    )
  }

  if (allRecurrings.length === 0) {
    return (
      <StatsLayout>
        <EmptyState
          icon={<BarChart2 size={40} />}
          title="Aucun suivi récurrent défini"
          subtitle="Créez des suivis récurrents pour visualiser vos tendances."
          ctaLabel="Créer un suivi"
          ctaAction={() => navigate({ to: '/tracking/recurring' })}
        />
      </StatsLayout>
    )
  }

  const responseType = selectedRecurring?.responseType

  return (
    <StatsLayout>
      <div className="space-y-4">
        <PeriodSelector value={periodDays} onChange={setPeriodDays} />

        {/* StatCards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Taux de complétion"
            value={`${globalRate}%`}
            color={globalRate >= 70 ? '#10B981' : globalRate >= 40 ? '#EAB308' : '#EF4444'}
          />
          <StatCard
            label="Suivis actifs"
            value={allRecurrings.filter((r) => r.isActive).length}
          />
        </div>

        {/* Sélecteur de suivi */}
        <div className="flex items-center gap-2">
          <label htmlFor="select-recurring" className="text-xs text-text-secondary shrink-0">
            Suivi :
          </label>
          <select
            id="select-recurring"
            value={effectiveId}
            onChange={(e) => setSelectedRecurringId(e.target.value)}
            className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-1.5 text-text-primary"
          >
            {allRecurrings.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Visualisation selon le type de réponse */}
        {responseType === 'number' && selectedRecurring && (
          numberCurve.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1">
              <p className="text-sm font-medium text-text-primary">Aucune réponse sur cette période</p>
              <p className="text-xs text-text-muted">Élargissez la période pour voir plus de données.</p>
            </div>
          ) : (
            <ChartContainer title={`Évolution — ${selectedRecurring.name}`}>
              <StatsLineChart
                data={numberCurve as Record<string, unknown>[]}
                xKey="date"
                lines={[{ key: 'value', color: '#8B5CF6', label: selectedRecurring.unit ?? 'Valeur' }]}
                yUnit={selectedRecurring.unit}
              />
            </ChartContainer>
          )
        )}

        {responseType === 'boolean' && selectedRecurring && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-text-primary">
              Calendrier — {selectedRecurring.name}
            </h3>
            {scheduledDates.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-4">
                Aucune date planifiée sur cette période.
              </p>
            ) : (
              <BooleanCalendar cells={booleanCalendar} />
            )}
            <div className="flex gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Oui
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" /> Non
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-border inline-block" /> Pas de réponse
              </span>
            </div>
          </div>
        )}

        {responseType === 'choice' && selectedRecurring && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-text-secondary text-center py-4">
              Les statistiques graphiques pour les suivis QCM ne sont pas disponibles.
            </p>
          </div>
        )}

        {/* Taux par suivi */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium text-text-primary">Taux de complétion par suivi</h3>
          <div className="space-y-2">
            {ratesByRecurring.map((item) => (
              <div key={item.recurringId} className="flex items-center gap-3">
                <span className="text-sm text-text-secondary truncate flex-1">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.rate}%`,
                        backgroundColor:
                          item.rate >= 70 ? '#10B981' : item.rate >= 40 ? '#EAB308' : '#EF4444',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary w-8 text-right">
                    {item.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StatsLayout>
  )
}
