import { createFileRoute } from '@tanstack/react-router'
import { ShoppingPage } from '@/features/stocks/shopping/shopping-page'

export const Route = createFileRoute('/_auth/stocks/shopping')({
  component: ShoppingPage,
})
