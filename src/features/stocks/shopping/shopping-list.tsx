import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { purchaseRepository } from '@/lib/db/repositories/purchase.repository'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, ShoppingCart } from 'lucide-react'
import type { StockPurchase } from '@/schemas/stock-purchase.schema'

interface ShoppingGroup {
  dateKey: string
  purchases: StockPurchase[]
  totalCost: number
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function groupPurchasesByDate(purchases: StockPurchase[]): ShoppingGroup[] {
  const groups = new Map<string, StockPurchase[]>()
  for (const p of purchases) {
    // Grouper par la valeur exacte de date (datetime-local au moment de la soumission)
    // On utilise les 16 premiers caractères pour regrouper par heure arrondie à la minute
    const key = p.date.slice(0, 16)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(p)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // DESC
    .map(([dateKey, purchases]) => ({
      dateKey,
      purchases,
      totalCost: purchases.reduce((sum, p) => sum + p.price * p.quantity, 0),
    }))
}

interface ShoppingListProps {
  onSelectGroup?: (dateKey: string) => void
  onAdd?: () => void
}

export function ShoppingList({ onSelectGroup, onAdd }: ShoppingListProps) {
  const purchases = useLiveQuery(() => purchaseRepository.getAllSorted(), [])

  const groups = useMemo(() => {
    if (!purchases) return []
    return groupPurchasesByDate(purchases)
  }, [purchases])

  if (purchases === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="size-8" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <ShoppingCart className="size-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucune course enregistrée</h3>
          <p className="text-sm text-muted-foreground">
            Enregistrez vos courses pour mettre à jour votre stock automatiquement.
          </p>
        </div>
        {onAdd && (
          <Button onClick={onAdd}>Nouvelle course</Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map(({ dateKey, purchases: groupPurchases, totalCost }) => (
        <Card key={dateKey} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">{formatDate(dateKey)}</h3>
              <p className="text-sm text-muted-foreground">
                {groupPurchases.length} produit{groupPurchases.length > 1 ? 's' : ''}
                {totalCost > 0 && (
                  <span className="ml-2 font-medium text-foreground">
                    • {totalCost.toFixed(2)} €
                  </span>
                )}
              </p>
            </div>
            {onSelectGroup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectGroup(dateKey)}
                aria-label="Voir le détail"
              >
                <Eye className="size-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
