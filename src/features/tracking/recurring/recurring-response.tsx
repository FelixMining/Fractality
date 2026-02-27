import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type ValueData = {
  valueNumber?: number
  valueBoolean?: boolean
  valueChoice?: string
  valueChoices?: string[]
}

export function RecurringResponse({
  recurring,
  existingResponse,
  date,
}: RecurringResponseProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // État local pour saisie libre (type 'number')
  const [numberInput, setNumberInput] = useState(
    existingResponse?.valueNumber !== undefined ? String(existingResponse.valueNumber) : '',
  )

  // État local pour slider (type 'slider')
  const sliderMin = recurring.sliderMin ?? 1
  const sliderMax = recurring.sliderMax ?? 10
  const sliderStep = recurring.sliderStep ?? 1
  const [sliderValue, setSliderValue] = useState(
    existingResponse?.valueNumber ?? sliderMin,
  )

  const handleSave = async (value: ValueData) => {
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

  // ─── Oui / Non ────────────────────────────────────────────────────────
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

  // ─── QCM ──────────────────────────────────────────────────────────────
  if (recurring.responseType === 'choice') {
    if (recurring.multiChoice) {
      // Multi-sélection
      const currentChoices = existingResponse?.valueChoices ?? []
      const toggleChoice = (choice: string) => {
        const updated = currentChoices.includes(choice)
          ? currentChoices.filter((c) => c !== choice)
          : [...currentChoices, choice]
        handleSave({ valueChoices: updated })
      }
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {recurring.choices?.map((choice) => {
            const isSelected = currentChoices.includes(choice)
            return (
              <button
                key={choice}
                type="button"
                onClick={() => toggleChoice(choice)}
                disabled={isSubmitting}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {isSelected && <span className="mr-1.5 text-primary">✓</span>}
                {choice}
              </button>
            )
          })}
        </div>
      )
    }

    // Choix unique
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

  // ─── Curseur configurable (slider) ───────────────────────────────────
  if (recurring.responseType === 'slider') {
    const unitLabel = recurring.unit ? ` ${recurring.unit}` : ''
    const displayValue =
      existingResponse?.valueNumber !== undefined
        ? `${existingResponse.valueNumber}${unitLabel}`
        : `${sliderValue}${unitLabel}`

    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{sliderMin}{unitLabel}</span>
          <span className="font-semibold tabular-nums text-foreground">{displayValue}</span>
          <span>{sliderMax}{unitLabel}</span>
        </div>
        <Slider
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          value={[sliderValue]}
          onValueChange={([val]) => setSliderValue(val)}
          onValueCommit={([val]) => handleSave({ valueNumber: val })}
          aria-label={`Valeur ${recurring.name}`}
          disabled={isSubmitting}
        />
      </div>
    )
  }

  // ─── Valeur libre (number) ────────────────────────────────────────────
  const unitLabel = recurring.unit ? ` ${recurring.unit}` : ''
  const hasValue = existingResponse?.valueNumber !== undefined

  const submitNumber = () => {
    const val = parseFloat(numberInput.replace(',', '.'))
    if (isNaN(val)) return
    handleSave({ valueNumber: val })
  }

  return (
    <div className="mt-2 space-y-1.5">
      {hasValue && (
        <p className="text-xs text-muted-foreground">
          Valeur actuelle :{' '}
          <span className="font-semibold text-foreground">
            {existingResponse!.valueNumber}{unitLabel}
          </span>
        </p>
      )}
      <div className="flex gap-2">
        <Input
          type="number"
          step="any"
          value={numberInput}
          onChange={(e) => setNumberInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submitNumber())}
          placeholder={`Entrez une valeur${unitLabel ? ` (${recurring.unit})` : ''}`}
          className="flex-1"
          disabled={isSubmitting}
          aria-label={`Valeur ${recurring.name}`}
        />
        <Button
          size="sm"
          onClick={submitNumber}
          disabled={isSubmitting || numberInput === ''}
          className="shrink-0"
        >
          ✓
        </Button>
      </div>
    </div>
  )
}
