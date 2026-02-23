import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { eventTypeSchema, type EventType } from '@/schemas/tracking-event-type.schema'
import { trackingEventSchema, type TrackingEvent } from '@/schemas/tracking-event.schema'

// ─── EventTypeRepository ──────────────────────────────────────────────────────

class EventTypeRepository extends BaseRepository<EventType> {
  constructor() {
    super(db.tracking_event_types, eventTypeSchema, 'tracking_event_types')
  }

  async getAllSorted(): Promise<EventType[]> {
    const items = await this.table.filter((t) => !t.isDeleted).toArray()
    return items.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }
}

export const eventTypeRepository = new EventTypeRepository()

// ─── TrackingEventRepository ──────────────────────────────────────────────────

class TrackingEventRepository extends BaseRepository<TrackingEvent> {
  constructor() {
    super(db.tracking_events, trackingEventSchema, 'tracking_events')
  }

  /** Tous les événements non supprimés, triés par eventDate décroissant (plus récent en premier). */
  async getAllByDateDesc(): Promise<TrackingEvent[]> {
    const items = await this.table.filter((e) => !e.isDeleted).toArray()
    return items.sort((a, b) => b.eventDate.localeCompare(a.eventDate))
  }

  /** Événements dans une plage de dates YYYY-MM-DD (bornes incluses). */
  async getInRange(from: string, to: string): Promise<TrackingEvent[]> {
    const all = await this.getAllByDateDesc()
    return all.filter((e) => {
      const dateOnly = e.eventDate.slice(0, 10)
      return dateOnly >= from && dateOnly <= to
    })
  }

  /** Événements par typeId. */
  async getByTypeId(typeId: string): Promise<TrackingEvent[]> {
    return this.table.filter((e) => e.typeId === typeId && !e.isDeleted).toArray()
  }
}

export const trackingEventRepository = new TrackingEventRepository()
