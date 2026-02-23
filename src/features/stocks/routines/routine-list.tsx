import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { routineRepository } from '@/lib/db/repositories/routine.repository'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, RefreshCw } from 'lucide-react'
import type { StockRoutine } from '@/schemas/stock-routine.schema'

const RECURRENCE_LABELS = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  custom: 'Personnalisé',
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatRecurrence(routine: StockRoutine): string {
  switch (routine.recurrenceType) {
    case 'daily':
      return 'Quotidien'
    case 'weekly': {
      if (!routine.daysOfWeek || routine.daysOfWeek.length === 0) return 'Hebdomadaire'
      const days = routine.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ')
      return `Hebdomadaire (${days})`
    }
    case 'custom':
      return `Tous les ${routine.intervalDays ?? 1} jour${(routine.intervalDays ?? 1) > 1 ? 's' : ''}`
  }
}

interface RoutineListProps {
  onAdd?: () => void
  onEdit?: (routine: StockRoutine) => void
  onDelete?: (routine: StockRoutine) => void
}

export function RoutineList({ onAdd, onEdit, onDelete }: RoutineListProps) {
  const routines = useLiveQuery(() => routineRepository.getAllSorted(), [])
  const products = useLiveQuery(() => stockRepository.getAllSorted(), [])

  const productMap = useMemo(() => {
    if (!products) return new Map<string, { name: string; unit?: string }>()
    return new Map(products.map((p) => [p.id, { name: p.name, unit: p.unit }]))
  }, [products])

  if (routines === undefined || products === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="size-8" />
                <Skeleton className="size-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <RefreshCw className="size-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucune routine configurée</h3>
          <p className="text-sm text-muted-foreground">
            Créez des routines de consommation pour estimer vos jours de stock restants.
          </p>
        </div>
        {onAdd && (
          <Button onClick={onAdd}>Créer une routine</Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {routines.map((routine) => (
        <Card key={routine.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">{routine.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {productMap.get(routine.productId)?.name ?? 'Produit inconnu'}
                </span>
                <span className="text-sm font-medium">
                  • {routine.quantity} {productMap.get(routine.productId)?.unit ?? ''}
                </span>
                <Badge variant="outline" className="text-xs">
                  {RECURRENCE_LABELS[routine.recurrenceType]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatRecurrence(routine)}</p>
            </div>

            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(routine)}
                  aria-label="Modifier la routine"
                >
                  <Pencil className="size-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(routine)}
                  aria-label="Supprimer la routine"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
