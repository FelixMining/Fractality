import { describe, it, expect } from 'vitest'
import {
  calculateConsumptionPerDay,
  calculateDaysRemaining,
} from './routine.repository'
import type { StockRoutine } from '@/schemas/stock-routine.schema'

// Helper pour créer des routines de test
function makeRoutine(overrides: Partial<StockRoutine> = {}): StockRoutine {
  return {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    name: 'Test routine',
    productId: crypto.randomUUID(),
    quantity: 1,
    recurrenceType: 'daily',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
    ...overrides,
  }
}

describe('calculateConsumptionPerDay', () => {
  it('retourne la quantité exacte pour une routine quotidienne', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'daily' })
    expect(calculateConsumptionPerDay(routine)).toBe(2)
  })

  it('calcule correctement pour une routine hebdomadaire 3 jours/semaine', () => {
    const routine = makeRoutine({
      quantity: 2,
      recurrenceType: 'weekly',
      daysOfWeek: [1, 3, 5], // lundi, mercredi, vendredi
    })
    // (2 * 3) / 7 ≈ 0.857
    expect(calculateConsumptionPerDay(routine)).toBeCloseTo(6 / 7, 5)
  })

  it('utilise 1 jour par défaut si daysOfWeek est absent (hebdomadaire)', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'weekly', daysOfWeek: undefined })
    // (2 * 1) / 7 ≈ 0.286
    expect(calculateConsumptionPerDay(routine)).toBeCloseTo(2 / 7, 5)
  })

  it('calcule correctement pour une routine personnalisée tous les 3 jours', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'custom', intervalDays: 3 })
    // 2 / 3 ≈ 0.667
    expect(calculateConsumptionPerDay(routine)).toBeCloseTo(2 / 3, 5)
  })

  it('utilise intervalDays=1 par défaut si non défini (custom)', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'custom', intervalDays: undefined })
    expect(calculateConsumptionPerDay(routine)).toBe(2)
  })
})

describe('calculateDaysRemaining', () => {
  it('retourne null si aucune routine', () => {
    expect(calculateDaysRemaining(100, [])).toBeNull()
  })

  it('retourne null si toutes les routines sont inactives', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'daily', isActive: false })
    expect(calculateDaysRemaining(100, [routine])).toBeNull()
  })

  it('retourne null si toutes les routines sont soft-deleted', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'daily', isDeleted: true })
    expect(calculateDaysRemaining(100, [routine])).toBeNull()
  })

  it('calcule correctement pour une routine quotidienne — 100g / 2g/j = 50 jours', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'daily' })
    expect(calculateDaysRemaining(100, [routine])).toBe(50)
  })

  it('calcule correctement pour une routine hebdomadaire 3x/semaine', () => {
    const routine = makeRoutine({
      quantity: 2,
      recurrenceType: 'weekly',
      daysOfWeek: [1, 3, 5],
    })
    // consommation/j = (2 * 3) / 7 ≈ 0.857
    // jours restants = floor(100 / 0.857) = floor(116.67) = 116
    expect(calculateDaysRemaining(100, [routine])).toBe(116)
  })

  it('calcule correctement pour une routine personnalisée tous les 3 jours', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'custom', intervalDays: 3 })
    // consommation/j = 2/3 ≈ 0.667
    // jours restants = floor(100 / 0.667) = floor(150) = 150
    expect(calculateDaysRemaining(100, [routine])).toBe(150)
  })

  it('somme plusieurs routines actives pour le même produit', () => {
    const routine1 = makeRoutine({ quantity: 1, recurrenceType: 'daily' })
    const routine2 = makeRoutine({ quantity: 1, recurrenceType: 'daily' })
    // total/j = 2, jours restants = floor(100 / 2) = 50
    expect(calculateDaysRemaining(100, [routine1, routine2])).toBe(50)
  })

  it('retourne 0 si le stock est à 0', () => {
    const routine = makeRoutine({ quantity: 2, recurrenceType: 'daily' })
    expect(calculateDaysRemaining(0, [routine])).toBe(0)
  })

  it('arrondit à la baisse (floor)', () => {
    const routine = makeRoutine({ quantity: 3, recurrenceType: 'daily' })
    // floor(100 / 3) = floor(33.33) = 33
    expect(calculateDaysRemaining(100, [routine])).toBe(33)
  })

  it('ignore les routines inactives dans la somme', () => {
    const active = makeRoutine({ quantity: 2, recurrenceType: 'daily', isActive: true })
    const inactive = makeRoutine({ quantity: 2, recurrenceType: 'daily', isActive: false })
    // Seule la routine active compte : floor(100 / 2) = 50
    expect(calculateDaysRemaining(100, [active, inactive])).toBe(50)
  })
})
