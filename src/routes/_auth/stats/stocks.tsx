import { createFileRoute } from '@tanstack/react-router'
import { StockStats } from '@/features/stats/stock-stats'

export const Route = createFileRoute('/_auth/stats/stocks')({
  component: StockStats,
})
