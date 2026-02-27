import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import {
  isDueOnDate,
  trackingRecurringRepository,
  trackingResponseRepository,
} from '@/lib/db/repositories/tracking.repository'
import { toLocalDateString } from '@/lib/utils'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Interpole une couleur rouge → orange → vert selon le % de complétion (0–1). */
function completionColor(pct: number): string {
  // hue : 0° = rouge, 45° = orange, 120° = vert
  const hue = Math.round(pct * 120)
  const sat = 80
  const lig = pct >= 0.5 ? 35 : 38
  return `hsl(${hue}, ${sat}%, ${lig}%)`
}

/** Calcule le streak (jours consécutifs avec 100% complétion) en remontant depuis `today`. */
function calcStreak(completeDays: Set<string>, today: string): number {
  let streak = 0
  let current = today
  while (completeDays.has(current)) {
    streak++
    const d = new Date(current + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    current = toLocalDateString(d)
  }
  return streak
}

interface DayData {
  date: string
  due: number
  answered: number
}

export function RecurringCalendar() {
  const today = toLocalDateString()
  const todayDate = new Date(today + 'T12:00:00')

  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth()) // 0-indexed

  // Bornes du mois affiché
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthStart = `${monthKey}-01`
  const lastDayNum = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${monthKey}-${String(lastDayNum).padStart(2, '0')}`

  // Données depuis Dexie
  const data = useLiveQuery(async () => {
    const [allRecurrings, monthResponses] = await Promise.all([
      trackingRecurringRepository.getAllSorted(),
      trackingResponseRepository.getInDateRange(monthStart, monthEnd),
    ])
    return { allRecurrings, monthResponses }
  }, [monthStart, monthEnd])

  // Navigation mois
  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const goNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Génération du calendrier
  const firstDayOfMonth = new Date(year, month, 1)
  // Offset lundi = 0 : (getDay() + 6) % 7
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7

  // Calcul complétion par jour
  const dayDataMap = new Map<string, DayData>()
  const completeDays = new Set<string>()

  if (data) {
    const { allRecurrings, monthResponses } = data
    const responseSet = new Set(
      monthResponses.map((r) => `${r.recurringId}_${r.date}`),
    )

    for (let d = 1; d <= lastDayNum; d++) {
      const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`
      // Ne pas colorier les jours futurs (au-delà d'aujourd'hui)
      if (dateStr > today) {
        dayDataMap.set(dateStr, { date: dateStr, due: 0, answered: 0 })
        continue
      }

      let due = 0
      let answered = 0
      for (const r of allRecurrings) {
        if (isDueOnDate(r, dateStr)) {
          due++
          if (responseSet.has(`${r.id}_${dateStr}`)) answered++
        }
      }
      dayDataMap.set(dateStr, { date: dateStr, due, answered })
      if (due > 0 && answered === due) {
        completeDays.add(dateStr)
      }
    }
  }

  const streakCount = data ? calcStreak(completeDays, today) : 0

  // Cellules du calendrier (cases vides + jours du mois)
  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDayNum }, (_, i) =>
      `${monthKey}-${String(i + 1).padStart(2, '0')}`
    ),
  ]
  // Compléter pour avoir un multiple de 7
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-3">
      {/* Streak */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-4xl font-bold"
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {streakCount}
        </span>
        <span className="text-sm text-muted-foreground">
          jour{streakCount !== 1 ? 's' : ''} consécutif{streakCount !== 1 ? 's' : ''} à 100%
        </span>
      </div>

      {/* Navigation mois */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={goNext}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* En-têtes colonnes */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((h, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">
            {h}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      {data === undefined ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dateStr, i) => {
            if (!dateStr) {
              return <div key={`empty-${i}`} />
            }

            const dayNum = parseInt(dateStr.slice(-2))
            const isFuture = dateStr > today
            const isToday = dateStr === today
            const dd = dayDataMap.get(dateStr)

            // Pas de suivis ce jour → case neutre
            if (!dd || dd.due === 0 || isFuture) {
              return (
                <div
                  key={dateStr}
                  className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
                    isToday
                      ? 'border border-primary/60 text-foreground'
                      : isFuture
                        ? 'text-muted-foreground/40'
                        : 'text-muted-foreground/60 bg-muted/30'
                  }`}
                  title={dateStr}
                >
                  {dayNum}
                </div>
              )
            }

            const pct = dd.answered / dd.due
            const bg = completionColor(pct)
            const isComplete = pct === 1
            const isZero = pct === 0

            return (
              <div
                key={dateStr}
                className="relative flex aspect-square items-center justify-center rounded-md text-[11px] font-bold text-white"
                style={{ backgroundColor: bg }}
                title={`${dateStr} — ${dd.answered}/${dd.due} suivis`}
              >
                {/* Numéro du jour */}
                <span className="select-none">{dayNum}</span>

                {/* Icône centrale */}
                {isComplete && (
                  <Check
                    size={10}
                    className="absolute bottom-0.5 right-0.5 text-white/80"
                    strokeWidth={3}
                  />
                )}
                {isZero && (
                  <X
                    size={10}
                    className="absolute bottom-0.5 right-0.5 text-white/80"
                    strokeWidth={3}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: completionColor(0) }} />
          <span>0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: completionColor(0.5) }} />
          <span>50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: completionColor(1) }} />
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}
