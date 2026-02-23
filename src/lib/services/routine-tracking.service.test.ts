import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTrackingForRoutine,
  syncTrackingForRoutine,
  deleteTrackingForRoutine,
  handleRoutineConsumption,
} from './routine-tracking.service'
import type { StockRoutine } from '@/schemas/stock-routine.schema'
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'

// ─── Mocks ────────────────────────────────────────────────────────────────
// NOTE: vi.mock est hoisted — les factories ne peuvent pas référencer des
// variables déclarées en dehors. Toutes les valeurs sont inlinées.

vi.mock('@/lib/db/repositories/routine.repository', () => ({
  routineRepository: {
    update: vi.fn().mockResolvedValue(undefined),
    getById: vi.fn().mockResolvedValue({
      id: 'routine-id-abc',
      name: 'Protéines du soir',
      productId: 'product-id-xyz',
      quantity: 2,
      recurrenceType: 'daily',
      isActive: true,
      linkedTrackingId: 'tracking-id-123',
    }),
    softDelete: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/db/repositories/tracking.repository', () => ({
  trackingRecurringRepository: {
    create: vi.fn().mockResolvedValue({
      id: 'tracking-id-123',
      name: 'Protéines du soir',
      responseType: 'boolean',
      recurrenceType: 'daily',
      isActive: true,
      routineId: 'routine-id-abc',
      routineProductId: 'product-id-xyz',
      routineQuantity: 2,
    }),
    update: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/db/repositories/stock.repository', () => ({
  stockRepository: {
    adjustStock: vi.fn().mockResolvedValue({ id: 'product-id-xyz', currentStock: 8 }),
    getById: vi.fn().mockResolvedValue({
      id: 'product-id-xyz',
      name: 'Whey Protéine',
      currentStock: 10,
    }),
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────

const baseRoutine: StockRoutine = {
  id: 'routine-id-abc',
  userId: 'user-id',
  name: 'Protéines du soir',
  productId: 'product-id-xyz',
  quantity: 2,
  recurrenceType: 'daily',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
}

const routineWithLink: StockRoutine = {
  ...baseRoutine,
  linkedTrackingId: 'tracking-id-123',
}

const baseTracking: TrackingRecurring = {
  id: 'tracking-id-123',
  userId: 'user-id',
  name: 'Protéines du soir',
  responseType: 'boolean',
  recurrenceType: 'daily',
  isActive: true,
  routineId: 'routine-id-abc',
  routineProductId: 'product-id-xyz',
  routineQuantity: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDeleted: false,
  deletedAt: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('routine-tracking.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── createTrackingForRoutine ─────────────────────────────────────────

  describe('createTrackingForRoutine', () => {
    it('crée un TrackingRecurring avec les bonnes valeurs', async () => {
      const { trackingRecurringRepository } = await import('@/lib/db/repositories/tracking.repository')

      await createTrackingForRoutine(baseRoutine)

      expect(trackingRecurringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Protéines du soir',
          responseType: 'boolean',
          recurrenceType: 'daily',
          isActive: true,
          routineId: 'routine-id-abc',
          routineProductId: 'product-id-xyz',
          routineQuantity: 2,
        }),
      )
    })

    it('met à jour linkedTrackingId de la routine après création', async () => {
      const { routineRepository } = await import('@/lib/db/repositories/routine.repository')

      await createTrackingForRoutine(baseRoutine)

      expect(routineRepository.update).toHaveBeenCalledWith(
        'routine-id-abc',
        expect.objectContaining({ linkedTrackingId: 'tracking-id-123' }),
      )
    })

    it('passe daysOfWeek et intervalDays quand définis', async () => {
      const { trackingRecurringRepository } = await import('@/lib/db/repositories/tracking.repository')
      const weeklyRoutine: StockRoutine = {
        ...baseRoutine,
        recurrenceType: 'weekly',
        daysOfWeek: [1, 3, 5],
      }

      await createTrackingForRoutine(weeklyRoutine)

      expect(trackingRecurringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrenceType: 'weekly',
          daysOfWeek: [1, 3, 5],
        }),
      )
    })
  })

  // ── syncTrackingForRoutine ───────────────────────────────────────────

  describe('syncTrackingForRoutine', () => {
    it('met à jour le suivi lié avec les nouvelles valeurs', async () => {
      const { trackingRecurringRepository } = await import('@/lib/db/repositories/tracking.repository')
      const modified: StockRoutine = { ...routineWithLink, name: 'Whey soir', quantity: 3 }

      await syncTrackingForRoutine(modified)

      expect(trackingRecurringRepository.update).toHaveBeenCalledWith(
        'tracking-id-123',
        expect.objectContaining({ name: 'Whey soir', routineQuantity: 3 }),
      )
    })

    it('ne fait rien si linkedTrackingId est absent', async () => {
      const { trackingRecurringRepository } = await import('@/lib/db/repositories/tracking.repository')

      await syncTrackingForRoutine(baseRoutine)

      expect(trackingRecurringRepository.update).not.toHaveBeenCalled()
    })
  })

  // ── deleteTrackingForRoutine ─────────────────────────────────────────

  describe('deleteTrackingForRoutine', () => {
    it('soft delete le suivi lié', async () => {
      const { trackingRecurringRepository } = await import('@/lib/db/repositories/tracking.repository')

      await deleteTrackingForRoutine(routineWithLink)

      expect(trackingRecurringRepository.softDelete).toHaveBeenCalledWith('tracking-id-123')
    })

    it('ne fait rien si linkedTrackingId est absent', async () => {
      const { trackingRecurringRepository } = await import('@/lib/db/repositories/tracking.repository')

      await deleteTrackingForRoutine(baseRoutine)

      expect(trackingRecurringRepository.softDelete).not.toHaveBeenCalled()
    })
  })

  // ── handleRoutineConsumption ─────────────────────────────────────────

  describe('handleRoutineConsumption', () => {
    it('déduit le stock quand newValue=true et previousValue=undefined', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')

      await handleRoutineConsumption(baseTracking, true, undefined)

      expect(stockRepository.adjustStock).toHaveBeenCalledWith('product-id-xyz', -2)
    })

    it('déduit le stock quand newValue=true et previousValue=false', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')

      await handleRoutineConsumption(baseTracking, true, false)

      expect(stockRepository.adjustStock).toHaveBeenCalledWith('product-id-xyz', -2)
    })

    it('remet le stock quand newValue=false et previousValue=true', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')

      await handleRoutineConsumption(baseTracking, false, true)

      expect(stockRepository.adjustStock).toHaveBeenCalledWith('product-id-xyz', 2)
    })

    it('ne fait rien quand newValue=true et previousValue=true (déjà déduit)', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')

      await handleRoutineConsumption(baseTracking, true, true)

      expect(stockRepository.adjustStock).not.toHaveBeenCalled()
    })

    it('ne fait rien quand newValue=false et previousValue=false', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')

      await handleRoutineConsumption(baseTracking, false, false)

      expect(stockRepository.adjustStock).not.toHaveBeenCalled()
    })

    it('ne fait rien si routineId est absent', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')
      const noRoutineTracking: TrackingRecurring = { ...baseTracking, routineId: undefined }

      await handleRoutineConsumption(noRoutineTracking, true, undefined)

      expect(stockRepository.adjustStock).not.toHaveBeenCalled()
    })

    it('ne fait rien si routineProductId est absent', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')
      const noProduct: TrackingRecurring = { ...baseTracking, routineProductId: undefined }

      await handleRoutineConsumption(noProduct, true, undefined)

      expect(stockRepository.adjustStock).not.toHaveBeenCalled()
    })

    it('ne fait rien si routineQuantity est absent', async () => {
      const { stockRepository } = await import('@/lib/db/repositories/stock.repository')
      const noQty: TrackingRecurring = { ...baseTracking, routineQuantity: undefined }

      await handleRoutineConsumption(noQty, true, undefined)

      expect(stockRepository.adjustStock).not.toHaveBeenCalled()
    })
  })
})
