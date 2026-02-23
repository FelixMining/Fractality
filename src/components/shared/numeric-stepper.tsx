import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NumericStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  compact?: boolean
  disabled?: boolean
  'aria-label'?: string
}

export function NumericStepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  unit,
  compact = false,
  disabled = false,
  'aria-label': ariaLabel,
}: NumericStepperProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(roundToStep(newValue))
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step)
    onChange(roundToStep(newValue))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value)
    if (isNaN(rawValue)) return

    const clampedValue = Math.max(min, Math.min(max, rawValue))
    onChange(roundToStep(clampedValue))
  }

  const roundToStep = (val: number): number => {
    return Math.round(val / step) * step
  }

  return (
    <div
      className={cn('flex items-center gap-1', compact && 'gap-0.5')}
      role="group"
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        variant="outline"
        size={compact ? 'icon-sm' : 'icon'}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Décrémenter"
        className={cn(compact ? 'h-8 w-8' : 'h-10 w-10')}
      >
        <Minus className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
      </Button>

      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'text-center font-medium',
            compact ? 'h-8 w-16 text-sm' : 'h-10 w-20',
            unit && 'pr-8',
          )}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size={compact ? 'icon-sm' : 'icon'}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Incrémenter"
        className={cn(compact ? 'h-8 w-8' : 'h-10 w-10')}
      >
        <Plus className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
      </Button>
    </div>
  )
}
