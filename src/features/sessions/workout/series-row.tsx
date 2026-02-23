import { Check, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { NumericStepper } from '@/components/shared/numeric-stepper'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SeriesRowProps {
  series: WorkoutSeries
  seriesNumber: number
  onUpdate: (data: Partial<WorkoutSeries>) => void
  onComplete: () => void
  onDelete: () => void
}

export function SeriesRow({
  series,
  seriesNumber,
  onUpdate,
  onComplete,
  onDelete,
}: SeriesRowProps) {
  const [showRpe, setShowRpe] = useState(false)

  const isCompleted = series.completed

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 transition-colors',
        isCompleted && 'bg-muted/50',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Numéro série + icône check si validée */}
        <div className="flex items-center gap-2">
          {isCompleted && <Check className="h-4 w-4 text-green-500" />}
          <Badge variant="outline" className="min-w-8 justify-center">
            {seriesNumber}
          </Badge>
        </div>

        {/* Champs reps, charge, repos */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Reps</span>
            <NumericStepper
              value={series.reps}
              onChange={(val) => onUpdate({ reps: val })}
              min={1}
              max={100}
              step={1}
              compact
              disabled={isCompleted}
              aria-label="Répétitions"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Charge</span>
            <NumericStepper
              value={series.weight || 0}
              onChange={(val) => onUpdate({ weight: val })}
              min={0}
              max={500}
              step={0.5}
              unit="kg"
              compact
              disabled={isCompleted}
              aria-label="Charge"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Repos</span>
            <NumericStepper
              value={series.restTime || 90}
              onChange={(val) => onUpdate({ restTime: val })}
              min={0}
              max={600}
              step={5}
              unit="s"
              compact
              disabled={isCompleted}
              aria-label="Temps de repos"
            />
          </div>
        </div>

        {/* Boutons action */}
        <div className="flex items-center gap-1">
          {!isCompleted && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowRpe(!showRpe)}
                aria-label="RPE"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Supprimer"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                size="icon"
                onClick={onComplete}
                aria-label="Valider la série"
                className="h-9 w-9 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
              >
                <Check className="h-5 w-5" />
              </Button>
            </>
          )}

          {isCompleted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdate({ completed: false })}
              aria-label="Modifier la série"
            >
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* RPE optionnel */}
      {showRpe && !isCompleted && (
        <div className="flex items-center gap-3 pt-2">
          <span className="text-sm text-muted-foreground">RPE:</span>
          <Slider
            value={[series.rpe || 5]}
            onValueChange={(val) => onUpdate({ rpe: val[0] })}
            min={1}
            max={10}
            step={1}
            className="flex-1"
            aria-label="RPE (1-10)"
          />
          <Badge variant="secondary" className="min-w-8 justify-center">
            {series.rpe || 5}
          </Badge>
        </div>
      )}
    </div>
  )
}
