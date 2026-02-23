import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { RecurringList, countRecurringFilters } from './recurring-list'
import type { RecurringFilters } from './recurring-list'
import { RecurringForm } from './recurring-form'
import { RecurringHistory } from './recurring-history'
import { FilterBar } from '@/components/shared/filter-bar'
import { Label } from '@/components/ui/label'
import type { TrackingRecurring, TrackingRecurrenceType } from '@/schemas/tracking-recurring.schema'

const RECURRENCE_TYPE_LABELS: Record<TrackingRecurrenceType, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  custom: 'Personnalisé',
}

const EMPTY_RECURRING_FILTERS: RecurringFilters = {
  recurrenceTypes: [],
}

export function RecurringPage() {
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedRecurring, setSelectedRecurring] = useState<TrackingRecurring | null>(null)
  const [filters, setFilters] = useState<RecurringFilters>(EMPTY_RECURRING_FILTERS)

  const handleAdd = () => {
    setSelectedRecurring(null)
    setShowForm(true)
  }

  const handleEdit = (recurring: TrackingRecurring) => {
    setSelectedRecurring(recurring)
    setShowForm(true)
  }

  const handleShowHistory = (recurring: TrackingRecurring) => {
    setSelectedRecurring(recurring)
    setShowHistory(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setShowHistory(false)
    setSelectedRecurring(null)
  }

  return (
    <>
      <div className="px-4">
        <FilterBar
          activeCount={countRecurringFilters(filters)}
          onReset={() => setFilters(EMPTY_RECURRING_FILTERS)}
        >
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Type</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(RECURRENCE_TYPE_LABELS) as TrackingRecurrenceType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const updated = filters.recurrenceTypes.includes(type)
                      ? filters.recurrenceTypes.filter((t) => t !== type)
                      : [...filters.recurrenceTypes, type]
                    setFilters({ recurrenceTypes: updated })
                  }}
                  className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                    filters.recurrenceTypes.includes(type)
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-border bg-transparent text-muted-foreground'
                  }`}
                >
                  {RECURRENCE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </FilterBar>
      </div>
      <RecurringList
        filters={filters}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onShowHistory={handleShowHistory}
      />

      {/* Sheet formulaire création/édition */}
      <Sheet open={showForm} onOpenChange={(open) => { if (!open) handleClose() }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedRecurring ? 'Modifier le suivi' : 'Créer un suivi'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto">
            <RecurringForm
              initialData={selectedRecurring ?? undefined}
              onSuccess={handleClose}
              onCancel={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet historique — saisie rétroactive (AC5) */}
      <Sheet open={showHistory} onOpenChange={(open) => { if (!open) handleClose() }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              Historique — {selectedRecurring?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto">
            {selectedRecurring && (
              <RecurringHistory recurring={selectedRecurring} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
