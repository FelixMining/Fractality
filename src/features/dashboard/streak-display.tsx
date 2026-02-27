import { Flame } from 'lucide-react'
import { RecurringCalendar } from './recurring-calendar'
import { SectionTitle } from './today-summary'

// Re-exports pour compatibilité avec les tests existants
export { calculateStreak, getLast7Days } from './streak-display.helpers'

export function StreakDisplay() {
  return (
    <section>
      <SectionTitle icon={<Flame size={17} />} label="Régularité" />
      <div className="rounded-xl border border-border bg-card p-4">
        <RecurringCalendar />
      </div>
    </section>
  )
}
