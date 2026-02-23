import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { stockRoutineSchema, type StockRoutine } from '@/schemas/stock-routine.schema'

/**
 * Calcule le taux de consommation journalier d'une routine (unités/jour).
 */
export function calculateConsumptionPerDay(routine: StockRoutine): number {
  switch (routine.recurrenceType) {
    case 'daily':
      return routine.quantity
    case 'weekly': {
      const daysPerWeek = routine.daysOfWeek?.length ?? 1
      return (routine.quantity * daysPerWeek) / 7
    }
    case 'custom':
      return routine.quantity / (routine.intervalDays ?? 1)
  }
}

/**
 * Calcule les jours restants estimés pour un stock donné et un ensemble de routines actives.
 * Retourne null si aucune routine active ou si le taux de consommation est nul.
 */
export function calculateDaysRemaining(
  currentStock: number,
  routines: StockRoutine[],
): number | null {
  const activeRoutines = routines.filter((r) => r.isActive && !r.isDeleted)
  if (activeRoutines.length === 0) return null

  const totalPerDay = activeRoutines.reduce(
    (sum, r) => sum + calculateConsumptionPerDay(r),
    0,
  )
  if (totalPerDay === 0) return null

  return Math.floor(currentStock / totalPerDay)
}

class RoutineRepository extends BaseRepository<StockRoutine> {
  constructor() {
    super(db.stock_routines, stockRoutineSchema, 'stock_routines')
  }

  async getAllSorted(): Promise<StockRoutine[]> {
    const routines = await this.table
      .filter((r) => !r.isDeleted && r.isActive)
      .toArray()
    return routines.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  async getByProductId(productId: string): Promise<StockRoutine[]> {
    return this.table
      .filter((r) => r.productId === productId && !r.isDeleted && r.isActive)
      .toArray()
  }
}

export const routineRepository = new RoutineRepository()
