import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { EventList } from './event-list'
import { EventTimeline } from './event-timeline'
import { EventForm } from './event-form'
import { EventDetail } from './event-detail'
import { EventTypeManager } from './event-type-list'
import { EventFilterBar } from './event-filter-bar'
import type { EventFilters } from './event-filter-bar'
import type { TrackingEvent } from '@/schemas/tracking-event.schema'

type ViewMode = 'list' | 'timeline'

const EMPTY_FILTERS: EventFilters = {
  typeIds: [],
  priorities: [],
  from: '',
  to: '',
  projectId: null,
}

export function EventsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showEventForm, setShowEventForm] = useState(false)
  const [showTypeManager, setShowTypeManager] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<TrackingEvent | null>(null)
  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS)

  const handleAdd = () => {
    setSelectedEvent(null)
    setShowEventForm(true)
  }

  const handleSelect = (event: TrackingEvent) => {
    setSelectedEvent(event)
    setShowDetail(true)
  }

  const handleEdit = () => {
    setShowDetail(false)
    setShowEventForm(true)
  }

  const handleClose = () => {
    setShowEventForm(false)
    setShowDetail(false)
    setSelectedEvent(null)
  }

  return (
    <>
      {/* Header : toggle List/Timeline + bouton Gérer les types + CTA Ajouter */}
      <div className="flex items-center justify-between mb-3 px-4 pt-2">
        {/* Toggle vues */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Liste
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowTypeManager(true)}>
            Gérer les types
          </Button>
          <Button size="sm" onClick={handleAdd}>
            + Ajouter
          </Button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="px-4">
        <EventFilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Vue principale */}
      <div className="px-4 pb-4">
        {viewMode === 'list' ? (
          <EventList filters={filters} onAdd={handleAdd} onSelect={handleSelect} />
        ) : (
          <EventTimeline filters={filters} onSelect={handleSelect} />
        )}
      </div>

      {/* Sheet — Formulaire événement */}
      <Sheet open={showEventForm} onOpenChange={(open) => { if (!open) handleClose() }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedEvent ? "Modifier l'événement" : 'Nouvel événement'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto">
            <EventForm
              initialData={selectedEvent ?? undefined}
              onSuccess={handleClose}
              onCancel={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet — Détail événement */}
      <Sheet open={showDetail} onOpenChange={(open) => { if (!open) handleClose() }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Détail de l'événement</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto">
            {selectedEvent && (
              <EventDetail
                event={selectedEvent}
                onEdit={handleEdit}
                onDeleted={handleClose}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet — Gestionnaire de types */}
      <Sheet open={showTypeManager} onOpenChange={setShowTypeManager}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Types d'événements</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto">
            <EventTypeManager />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
