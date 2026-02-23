import { Badge } from '@/components/ui/badge'
import { calculateDaysRemaining } from '@/lib/db/repositories/routine.repository'
import type { StockRoutine } from '@/schemas/stock-routine.schema'

interface DaysRemainingProps {
  currentStock: number
  unit?: string
  routines: StockRoutine[]
}

export function DaysRemaining({ currentStock, unit, routines }: DaysRemainingProps) {
  const days = calculateDaysRemaining(currentStock, routines)

  if (days === null) return null

  const isCritical = days < 7
  const label =
    days === 0
      ? 'Stock épuisé'
      : `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
  const stockLabel = unit ? `${currentStock} ${unit}` : `${currentStock}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="text-sm font-medium"
        style={{ color: isCritical ? '#F59E0B' : undefined }}
      >
        {label}
      </span>
      {isCritical && (
        <Badge
          variant="outline"
          style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
        >
          Stock critique
        </Badge>
      )}
      <span className="text-xs text-muted-foreground">({stockLabel} restant)</span>
    </div>
  )
}
