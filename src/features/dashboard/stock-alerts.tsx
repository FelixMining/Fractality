import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle } from 'lucide-react'
import { db } from '@/lib/db/database'
import { calculateDaysRemaining } from '@/lib/db/repositories/routine.repository'

type CriticalProduct = {
  id: string
  name: string
  daysRemaining: number
}

export function StockAlerts() {
  const criticalProducts = useLiveQuery(async (): Promise<CriticalProduct[]> => {
    const [products, routines] = await Promise.all([
      db.stock_products.filter((p) => !p.isDeleted).toArray(),
      db.stock_routines.filter((r) => !r.isDeleted && r.isActive).toArray(),
    ])

    const results: CriticalProduct[] = []
    for (const product of products) {
      const productRoutines = routines.filter((r) => r.productId === product.id)
      const daysRemaining = calculateDaysRemaining(product.currentStock, productRoutines)
      if (daysRemaining !== null && daysRemaining < 7) {
        results.push({ id: product.id, name: product.name, daysRemaining })
      }
    }

    return results.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [])

  // Chargement en cours
  if (criticalProducts === undefined) {
    return <div className="h-16 animate-pulse rounded-xl bg-card" />
  }

  // Aucune alerte → ne rien rendre
  if (criticalProducts.length === 0) return null

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Alertes stocks
      </h3>
      <ul className="flex flex-col gap-2">
        {criticalProducts.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3"
          >
            <AlertTriangle
              className="size-4 shrink-0"
              style={{ color: '#F59E0B' }}
              aria-hidden
            />
            <span className="flex-1 text-sm font-medium">{item.name}</span>
            <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
              {item.daysRemaining === 0
                ? 'Épuisé'
                : `${item.daysRemaining}j restant${item.daysRemaining > 1 ? 's' : ''}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
