import { toLocalDateString } from '@/lib/utils'

/**
 * Calcule le nombre de jours consécutifs avec activité en remontant depuis `today`.
 */
export function calculateStreak(activeDates: Set<string>, today: string): number {
  let streak = 0
  let currentDate = today
  while (activeDates.has(currentDate)) {
    streak++
    const d = new Date(currentDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    currentDate = toLocalDateString(d)
  }
  return streak
}

/**
 * Génère les 7 derniers jours (de J-6 à today inclus).
 */
export function getLast7Days(today: string): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today + 'T12:00:00')
    d.setDate(d.getDate() - i)
    days.push(toLocalDateString(d))
  }
  return days
}
