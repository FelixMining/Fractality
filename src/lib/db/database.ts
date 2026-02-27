import Dexie, { type Table } from 'dexie'
import {
  DB_STORES_V1,
  DB_STORES_V2,
  DB_STORES_V3,
  DB_STORES_V4,
  DB_STORES_V5,
  DB_STORES_V6,
  DB_STORES_V7,
  DB_STORES_V8,
  DB_STORES_V9,
  DB_STORES_V10,
  DB_STORES_V11,
  DB_STORES_V12,
  DB_STORES_V13,
  DB_STORES_V14,
  DB_STORES_V15,
} from './migrations'
import type { Project } from '@/schemas/project.schema'
import type { WorkSession } from '@/schemas/work-session.schema'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'
import type { WorkoutProgram } from '@/schemas/workout-program.schema'
import type { WorkoutSessionTemplate } from '@/schemas/workout-session-template.schema'
import type { WorkoutTemplateExercise } from '@/schemas/workout-template-exercise.schema'
import type { WorkoutSession } from '@/schemas/workout-session.schema'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import type { PainNote } from '@/schemas/pain-note.schema'
import type { CardioSession } from '@/schemas/cardio-session.schema'
import type { StockProduct } from '@/schemas/stock-product.schema'
import type { StockPurchase } from '@/schemas/stock-purchase.schema'
import type { StockRoutine } from '@/schemas/stock-routine.schema'
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'
import type { TrackingResponse } from '@/schemas/tracking-response.schema'
import type { EventType } from '@/schemas/tracking-event-type.schema'
import type { TrackingEvent } from '@/schemas/tracking-event.schema'
import type { JournalEntry } from '@/schemas/journal-entry.schema'

export interface SyncQueueItem {
  id?: number
  entity: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: string
  createdAt: string
}

export interface MediaBlob {
  id: string
  entityId: string
  blob: Blob
  mimeType: string
  createdAt: string
}

export class FractalityDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem, number>
  mediaBlobs!: Table<MediaBlob, string>
  projects!: Table<Project, string>
  work_sessions!: Table<WorkSession, string>
  workout_exercises!: Table<WorkoutExercise, string>
  workout_programs!: Table<WorkoutProgram, string>
  workout_session_templates!: Table<WorkoutSessionTemplate, string>
  workout_template_exercises!: Table<WorkoutTemplateExercise, string>
  workout_sessions!: Table<WorkoutSession, string>
  workout_series!: Table<WorkoutSeries, string>
  pain_notes!: Table<PainNote, string>
  cardio_sessions!: Table<CardioSession, string>
  stock_products!: Table<StockProduct, string>
  stock_purchases!: Table<StockPurchase, string>
  stock_routines!: Table<StockRoutine, string>
  tracking_recurrings!: Table<TrackingRecurring, string>
  tracking_responses!: Table<TrackingResponse, string>
  tracking_event_types!: Table<EventType, string>
  tracking_events!: Table<TrackingEvent, string>
  journal_entries!: Table<JournalEntry, string>

  constructor() {
    super('fractality')
    this.version(1).stores(DB_STORES_V1)
    this.version(2).stores(DB_STORES_V2)
    this.version(3).stores(DB_STORES_V3)
    this.version(4).stores(DB_STORES_V4)
    this.version(5).stores(DB_STORES_V5)
    this.version(6).stores(DB_STORES_V6)
    this.version(7).stores(DB_STORES_V7)
    this.version(8).stores(DB_STORES_V8)
    this.version(9).stores(DB_STORES_V9)
    this.version(10).stores(DB_STORES_V10)
    this.version(11).stores(DB_STORES_V11)
    this.version(12).stores(DB_STORES_V12)
    this.version(13).stores(DB_STORES_V13)
    this.version(14).stores(DB_STORES_V14)
    this.version(15).stores(DB_STORES_V15)
  }
}

export const db = new FractalityDatabase()
