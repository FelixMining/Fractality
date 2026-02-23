import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  trackingResponseRepository,
} from '@/lib/db/repositories/tracking.repository'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import { handleRoutineConsumption } from '@/lib/services/routine-tracking.service'
import { toast } from 'sonner'
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'
import type { TrackingResponse } from '@/schemas/tracking-response.schema'

interface RecurringResponseProps {
  recurring: TrackingRecurring
  existingResponse?: TrackingResponse
  date: string // YYYY-MM-DD
}

export function RecurringResponse({
  recurring,
  existingResponse,
  date,
}: RecurringResponseProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (value: {
    valueNumber?: number
    valueBoolean?: boolean
    valueChoice?: string
  }) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await trackingResponseRepository.upsertResponse(recurring.id, date, value)
    } catch {
      toast.error('Erreur lors de la sauvegarde de la réponse')
      setIsSubmitting(false)
      return
    }

    // Story 6.4 — Déduction automatique du stock si suivi lié à une routine
    if (recurring.routineId && value.valueBoolean !== undefined) {
      try {
        await handleRoutineConsumption(recurring, value.valueBoolean, existingResponse?.valueBoolean)
        const deducted = value.valueBoolean === true && existingResponse?.valueBoolean !== true
        const restored = value.valueBoolean === false && existingResponse?.valueBoolean === true
        if ((deducted || restored) && recurring.routineProductId) {
          const product = await stockRepository.getById(recurring.routineProductId)
          if (product) {
            toast.success(deducted ? `Stock de ${product.name} mis à jour` : `Stock de ${product.name} restauré`)
          }
        }
      } catch {
        toast.error('Erreur lors de la mise à jour du stock')
      }
    }

    setIsSubmitting(false)
  }

  if (recurring.responseType === 'boolean') {
    return (
      <div className="flex gap-2 mt-2">
        <Button
          variant={existingResponse?.valueBoolean === true ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSave({ valueBoolean: true })}
          aria-pressed={existingResponse?.valueBoolean === true}
          disabled={isSubmitting}
        >
          Oui
        </Button>
        <Button
          variant={existingResponse?.valueBoolean === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSave({ valueBoolean: false })}
          aria-pressed={existingResponse?.valueBoolean === false}
          disabled={isSubmitting}
        >
          Non
        </Button>
      </div>
    )
  }

  if (recurring.responseType === 'choice') {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {recurring.choices?.map((choice) => (
          <Button
            key={choice}
            variant={existingResponse?.valueChoice === choice ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSave({ valueChoice: choice })}
            aria-pressed={existingResponse?.valueChoice === choice}
            disabled={isSubmitting}
          >
            {choice}
          </Button>
        ))}
      </div>
    )
  }

  // responseType === 'number'
  const currentValue = existingResponse?.valueNumber ?? 5

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span className="font-medium tabular-nums">
          {existingResponse?.valueNumber !== undefined
            ? `${existingResponse.valueNumber}${recurring.unit ? ` ${recurring.unit}` : ''}`
            : '—'}
        </span>
        <span>10</span>
      </div>
      <Slider
        min={1}
        max={10}
        step={0.5}
        value={[currentValue]}
        onValueCommit={([val]) => handleSave({ valueNumber: val })}
        aria-label={`Valeur ${recurring.name}`}
        style={{ accentColor: '#8B5CF6' }}
      />
    </div>
  )
}
