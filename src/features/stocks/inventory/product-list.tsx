import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import { routineRepository, calculateDaysRemaining } from '@/lib/db/repositories/routine.repository'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Trash2, Package } from 'lucide-react'
import type { StockProduct, StockProductType } from '@/schemas/stock-product.schema'
import type { StockRoutine } from '@/schemas/stock-routine.schema'

export interface InventoryFilters {
  productTypes: StockProductType[]
}

export function applyInventoryFilters(
  products: StockProduct[],
  filters: InventoryFilters,
): StockProduct[] {
  return products.filter((p) => {
    if (filters.productTypes.length > 0 && !filters.productTypes.includes(p.productType)) {
      return false
    }
    return true
  })
}

export function countInventoryFilters(filters: InventoryFilters): number {
  return filters.productTypes.length > 0 ? 1 : 0
}

export function hasInventoryFilters(filters: InventoryFilters): boolean {
  return countInventoryFilters(filters) > 0
}

const TYPE_LABELS: Record<StockProductType, string> = {
  liquid: 'Liquide',
  quantity: 'Quantité',
  bulk: 'Vrac',
}

function formatStock(product: StockProduct): string {
  if (product.unit) return `${product.currentStock} ${product.unit}`
  return `${product.currentStock}`
}

interface ProductListProps {
  filters: InventoryFilters
  onView?: (productId: string) => void
  onDelete?: (productId: string) => void
  onAdd?: () => void
}

export function ProductList({ filters, onView, onDelete, onAdd }: ProductListProps) {
  const products = useLiveQuery(
    () => stockRepository.getAllSorted(),
    [],
  )
  const allRoutines = useLiveQuery(() => routineRepository.getAllSorted(), [])

  // Map productId → routines actives pour le calcul des jours restants
  const routinesByProduct = useMemo((): Map<string, StockRoutine[]> => {
    if (!allRoutines) return new Map()
    const map = new Map<string, StockRoutine[]>()
    for (const r of allRoutines) {
      if (!r.isActive) continue
      const list = map.get(r.productId) ?? []
      list.push(r)
      map.set(r.productId, list)
    }
    return map
  }, [allRoutines])

  if (products === undefined || allRoutines === undefined) {
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

  const filtered = applyInventoryFilters(products, filters)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Package className="size-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Votre inventaire est vide</h3>
          <p className="text-sm text-muted-foreground">
            Ajoutez vos premiers produits pour commencer le suivi de vos stocks.
          </p>
        </div>
        {onAdd && (
          <Button onClick={onAdd}>Ajouter un produit</Button>
        )}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Package className="size-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucun résultat</h3>
          <p className="text-sm text-muted-foreground">
            Aucun produit ne correspond à vos filtres.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((product) => {
        const productRoutines = routinesByProduct.get(product.id) ?? []
        const daysLeft = calculateDaysRemaining(product.currentStock, productRoutines)
        const isCritical = daysLeft !== null && daysLeft < 7

        return (
        <Card key={product.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {TYPE_LABELS[product.productType]}
                </Badge>
                <span
                  className="text-sm font-medium"
                  style={{ color: product.currentStock === 0 ? '#ef4444' : undefined }}
                >
                  {product.currentStock === 0 ? 'Épuisé' : formatStock(product)}
                </span>
                {isCritical && (
                  <Badge
                    variant="outline"
                    style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
                  >
                    {daysLeft === 0 ? 'Épuisé bientôt' : `${daysLeft}j restants`}
                  </Badge>
                )}
                {product.basePrice !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    {product.basePrice.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-1">
              {onView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(product.id)}
                  aria-label="Voir le détail"
                >
                  <Eye className="size-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(product.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
        )
      })}
    </div>
  )
}
