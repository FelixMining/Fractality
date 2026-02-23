import { createFileRoute } from '@tanstack/react-router'
import { InventoryPage } from '@/features/stocks/inventory/inventory-page'

export const Route = createFileRoute('/_auth/stocks/inventory')({
  component: InventoryPage,
})
