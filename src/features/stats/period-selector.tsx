import { cn } from '@/lib/utils'

export interface PeriodOption {
  label: string
  days: number
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { label: 'Semaine', days: 7 },
  { label: 'Mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: 'Année', days: 365 },
]

export const DEFAULT_PERIOD_DAYS = 30

/** Formate une date ISO (YYYY-MM-DD ou YYYY-MM) pour affichage court sur les axes. */
export function formatShortDate(value: string): string {
  if (!value) return value
  const parts = value.split('-')
  if (parts.length === 3) {
    // YYYY-MM-DD → "DD/MM"
    return `${parseInt(parts[2])}/${parseInt(parts[1])}`
  }
  if (parts.length === 2) {
    // YYYY-MM → abréviation mois
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
    return months[parseInt(parts[1]) - 1] ?? value
  }
  return value
}

export function getPeriodDates(days: number): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

interface PeriodSelectorProps {
  value: number
  onChange: (days: number) => void
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.days}
          type="button"
          onClick={() => onChange(option.days)}
          className={cn(
            'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            value === option.days
              ? 'bg-violet-500 text-white'
              : 'border border-border text-text-secondary hover:text-text-primary',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
