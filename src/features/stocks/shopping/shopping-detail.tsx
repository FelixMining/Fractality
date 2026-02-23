import { useLiveQuery } from 'dexie-react-hooks'
import { purchaseRepository } from '@/lib/db/repositories/purchase.repository'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import { useUndo } from '@/hooks/use-undo'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Trash2, Package } from 'lucide-react'
import { useState } from 'react'
import type { StockPurchase } from '@/schemas/stock-purchase.schema'
import type { StockProduct } from '@/schemas/stock-product.schema'

interface PurchaseLine {
  purchase: StockPurchase
  product: StockProduct | undefined
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

interface ShoppingDetailProps {
  dateKey: string
  onBack?: () => void
}

export function ShoppingDetail({ dateKey, onBack }: ShoppingDetailProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { withUndo } = useUndo()

  // Charger les achats correspondant à ce groupe (même dateKey sur 16 chars)
  const data = useLiveQuery(async () => {
    const allPurchases = await purchaseRepository.getAllSorted()
    const groupPurchases = allPurchases.filter((p) => p.date.slice(0, 16) === dateKey)
    if (groupPurchases.length === 0) return null

    // Charger les produits pour chaque achat
    const lines: PurchaseLine[] = await Promise.all(
      groupPurchases.map(async (purchase) => {
        const product = await stockRepository.getById(purchase.productId)
        return { purchase, product }
      }),
    )
    return { lines }
  }, [dateKey])

  const handleDelete = async () => {
    if (!data || isDeleting) return
    setIsDeleting(true)
    const linesToDelete = data.lines.map((l) => l.purchase)
    const stockToRevert = data.lines.map((l) => ({
      productId: l.purchase.productId,
      quantity: l.purchase.quantity,
    }))

    await withUndo(
      `Course supprimée`,
      async () => {
        for (let i = 0; i < linesToDelete.length; i++) {
          await purchaseRepository.softDelete(linesToDelete[i].id)
          await stockRepository.adjustStock(stockToRevert[i].productId, -stockToRevert[i].quantity)
        }
      },
      async () => {
        for (let i = 0; i < linesToDelete.length; i++) {
          await purchaseRepository.restore(linesToDelete[i].id)
          await stockRepository.adjustStock(stockToRevert[i].productId, stockToRevert[i].quantity)
        }
      },
    )

    setIsDeleting(false)
    onBack?.()
  }

  if (data === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Course introuvable.</p>
      </div>
    )
  }

  const { lines } = data
  const totalCost = lines.reduce((sum, l) => sum + l.purchase.price * l.purchase.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour">
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold">Détail de la course</h2>
            <p className="text-sm text-muted-foreground">{formatDate(dateKey)}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isDeleting}
          aria-label="Supprimer la course"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Lignes d'achat */}
      <Card className="divide-y divide-border">
        {lines.map(({ purchase, product }) => {
          const lineTotal = purchase.price * purchase.quantity
          return (
            <div key={purchase.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Package className="size-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">
                    {product?.name ?? <span className="text-muted-foreground italic">Produit supprimé</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {purchase.quantity}
                    {product?.unit ? ` ${product.unit}` : ''}
                    {purchase.price > 0 && ` × ${purchase.price.toFixed(2)} €`}
                  </p>
                </div>
              </div>
              {lineTotal > 0 && (
                <p className="font-semibold shrink-0">{lineTotal.toFixed(2)} €</p>
              )}
            </div>
          )
        })}

        {totalCost > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between p-4">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{totalCost.toFixed(2)} €</span>
            </div>
          </>
        )}
      </Card>

      {/* Confirmation suppression */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer cette course ?"
        description="Toutes les lignes de cette course seront supprimées. Cette action est annulable via le bouton Annuler."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
