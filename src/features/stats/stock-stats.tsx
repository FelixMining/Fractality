import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { ShoppingCart, Package } from 'lucide-react'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import { purchaseRepository } from '@/lib/db/repositories/purchase.repository'
import { routineRepository, calculateDaysRemaining } from '@/lib/db/repositories/routine.repository'
import type { StockPurchase } from '@/schemas/stock-purchase.schema'
import type { StockProduct } from '@/schemas/stock-product.schema'
import type { StockRoutine } from '@/schemas/stock-routine.schema'
import { StatsLayout } from './stats-layout'
import { PeriodSelector, DEFAULT_PERIOD_DAYS, getPeriodDates, formatShortDate } from './period-selector'
import { ChartContainer } from './charts/chart-container'
import { StatsBarChart } from './charts/bar-chart'
import { StatsPieChart } from './charts/pie-chart'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fonctions d'agrégation pures ───────────────────────────────────────────

export function filterPurchasesByPeriod(
  purchases: StockPurchase[],
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): StockPurchase[] {
  return purchases.filter((p) => p.date >= startDate && p.date <= endDate)
}

export function groupPurchasesByMonth(
  purchases: StockPurchase[],
): { date: string; montant: number }[] {
  const map = new Map<string, number>()
  for (const p of purchases) {
    const key = p.date.substring(0, 7) // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + p.price)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, montant]) => ({ date, montant: Math.round(montant * 100) / 100 }))
}

export function groupPurchasesByWeek(
  purchases: StockPurchase[],
): { date: string; montant: number }[] {
  const map = new Map<string, number>()
  for (const p of purchases) {
    const date = new Date(p.date + 'T12:00:00')
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7)) // lundi ISO
    const key = weekStart.toISOString().substring(0, 10)
    map.set(key, (map.get(key) ?? 0) + p.price)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, montant]) => ({ date, montant: Math.round(montant * 100) / 100 }))
}

export function groupPurchasesByProduct(
  purchases: StockPurchase[],
  products: StockProduct[],
): { name: string; value: number; color: string }[] {
  const productMap = new Map(products.map((p) => [p.id, p]))
  const totals = new Map<string, number>()
  for (const p of purchases) {
    totals.set(p.productId, (totals.get(p.productId) ?? 0) + p.price)
  }
  return [...totals.entries()].map(([id, value]) => ({
    name: productMap.get(id)?.name ?? 'Produit inconnu',
    value: Math.round(value * 100) / 100,
    color: '#10B981',
  }))
}

export function calcAvgPriceByProduct(
  purchases: StockPurchase[],
  products: StockProduct[],
): { name: string; avgPrice: number }[] {
  const productMap = new Map(products.map((p) => [p.id, p]))
  const sumMap = new Map<string, { sum: number; count: number }>()
  for (const p of purchases) {
    const entry = sumMap.get(p.productId) ?? { sum: 0, count: 0 }
    sumMap.set(p.productId, { sum: entry.sum + p.price, count: entry.count + 1 })
  }
  return [...sumMap.entries()]
    .map(([id, { sum, count }]) => ({
      name: productMap.get(id)?.name ?? 'Produit inconnu',
      avgPrice: Math.round((sum / count) * 100) / 100,
    }))
    .filter((item) => item.name !== 'Produit inconnu')
}

export function buildDaysRemainingList(
  products: StockProduct[],
  allRoutines: StockRoutine[],
): { productName: string; currentStock: number; unit?: string; daysRemaining: number | null }[] {
  const routinesByProduct = new Map<string, StockRoutine[]>()
  for (const r of allRoutines) {
    const list = routinesByProduct.get(r.productId) ?? []
    list.push(r)
    routinesByProduct.set(r.productId, list)
  }
  return products
    .filter((p) => !p.isDeleted)
    .map((p) => ({
      productName: p.name,
      currentStock: p.currentStock,
      unit: p.unit,
      daysRemaining: calculateDaysRemaining(p.currentStock, routinesByProduct.get(p.id) ?? []),
    }))
    .filter((item) => item.daysRemaining !== null)
    .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))
}

export function calcTotalSpent(purchases: StockPurchase[]): number {
  return Math.round(purchases.reduce((sum, p) => sum + p.price, 0) * 100) / 100
}

// ── Composant principal ────────────────────────────────────────────────────

export function StockStats() {
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)
  const navigate = useNavigate()

  const { startDate, endDate } = useMemo(() => getPeriodDates(periodDays), [periodDays])
  const startDateOnly = startDate.substring(0, 10)
  const endDateOnly = endDate.substring(0, 10)

  const allPurchases = useLiveQuery(() => purchaseRepository.getAllSorted())
  const allProducts = useLiveQuery(() => stockRepository.getAllSorted())
  const allRoutines = useLiveQuery(() => routineRepository.getAllSorted())

  const filteredPurchases = useMemo(
    () => filterPurchasesByPeriod(allPurchases ?? [], startDateOnly, endDateOnly),
    [allPurchases, startDateOnly, endDateOnly],
  )

  const monthlyData = useMemo(() => {
    if (periodDays <= 60) return groupPurchasesByWeek(filteredPurchases)
    return groupPurchasesByMonth(filteredPurchases)
  }, [filteredPurchases, periodDays])

  const productDistribution = useMemo(
    () => groupPurchasesByProduct(filteredPurchases, allProducts ?? []),
    [filteredPurchases, allProducts],
  )

  const daysRemainingList = useMemo(
    () => buildDaysRemainingList(allProducts ?? [], allRoutines ?? []),
    [allProducts, allRoutines],
  )

  const avgPrices = useMemo(
    () => calcAvgPriceByProduct(filteredPurchases, allProducts ?? []),
    [filteredPurchases, allProducts],
  )

  const totalSpent = useMemo(() => calcTotalSpent(filteredPurchases), [filteredPurchases])

  if (allPurchases === undefined || allProducts === undefined || allRoutines === undefined) {
    return (
      <StatsLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </StatsLayout>
    )
  }

  if (allPurchases.length === 0) {
    return (
      <StatsLayout>
        <EmptyState
          icon={<ShoppingCart size={40} />}
          title="Aucun achat enregistré"
          subtitle="Commencez à enregistrer vos courses pour voir les statistiques de dépenses."
          ctaLabel="Ajouter une course"
          ctaAction={() => navigate({ to: '/stocks/shopping' })}
        />
      </StatsLayout>
    )
  }

  const xLabel = periodDays <= 60 ? 'Semaine' : 'Mois'

  return (
    <StatsLayout>
      <div className="space-y-4">
        <PeriodSelector value={periodDays} onChange={setPeriodDays} />

        {/* StatCards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total dépensé"
            value={totalSpent}
            unit="€"
            color="#10B981"
          />
          <StatCard
            label="Achats"
            value={filteredPurchases.length}
          />
        </div>

        {/* Dépenses par période */}
        {filteredPurchases.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1">
            <p className="text-sm font-medium text-text-primary">Aucun achat sur cette période</p>
            <p className="text-xs text-text-muted">Élargissez la période pour voir plus de données.</p>
          </div>
        ) : (
          <>
            <ChartContainer
              title={`Dépenses par ${xLabel.toLowerCase()}`}
              description="Montant total des achats"
            >
              <StatsBarChart
                data={monthlyData as Record<string, unknown>[]}
                xKey="date"
                bars={[{ key: 'montant', color: '#10B981', label: 'Dépenses (€)' }]}
                yUnit="€"
                tickFormatter={formatShortDate}
              />
            </ChartContainer>

            {productDistribution.length > 0 && (
              <ChartContainer
                title="Dépenses par produit"
                description="Répartition des dépenses"
              >
                <StatsPieChart data={productDistribution} />
              </ChartContainer>
            )}
          </>
        )}

        {/* Prix moyen par produit */}
        {avgPrices.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-text-primary">Prix moyen par produit</h3>
            <div className="space-y-2">
              {avgPrices.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{item.name}</span>
                  <span className="text-sm font-semibold text-text-primary">{item.avgPrice} €</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jours restants */}
        {daysRemainingList.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-text-primary">Jours restants par produit</h3>
            <div className="space-y-2">
              {daysRemainingList.map((item) => (
                <div key={item.productName} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-text-muted" />
                    <span className="text-sm text-text-secondary">{item.productName}</span>
                    <span className="text-xs text-text-muted">
                      ({item.currentStock}{item.unit ? ` ${item.unit}` : ''})
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        (item.daysRemaining ?? 999) <= 7
                          ? '#F59E0B'
                          : (item.daysRemaining ?? 999) <= 14
                            ? '#EAB308'
                            : '#10B981',
                    }}
                  >
                    {item.daysRemaining}j
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StatsLayout>
  )
}
