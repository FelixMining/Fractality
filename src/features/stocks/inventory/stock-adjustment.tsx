import { useState } from 'react'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { StockProduct } from '@/schemas/stock-product.schema'

interface StockAdjustmentProps {
  product: StockProduct
  onAdjusted?: (updated: StockProduct) => void
}

export function StockAdjustment({ product, onAdjusted }: StockAdjustmentProps) {
  const [delta, setDelta] = useState<string>('1')
  const [isPending, setIsPending] = useState(false)
  const { withUndo } = useUndo()

  const parsedDelta = Math.max(0.1, parseFloat(delta) || 1)

  const handleAdjust = async (direction: 1 | -1) => {
    const amount = parsedDelta * direction
    const previousStock = product.currentStock
    const newStock = Math.max(0, previousStock + amount)

    if (newStock === previousStock && direction === -1 && previousStock === 0) {
      toast.error('Le stock est déjà à 0')
      return
    }

    setIsPending(true)
    try {
      let updated: StockProduct | null = null

      await withUndo(
        `Stock ${product.name} : ${direction > 0 ? '+' : ''}${amount}`,
        async () => {
          updated = await stockRepository.adjustStock(product.id, amount)
        },
        async () => {
          // Remettre au stock précédent
          const diff = previousStock - (updated?.currentStock ?? newStock)
          await stockRepository.adjustStock(product.id, diff)
        },
      )

      if (updated) {
        onAdjusted?.(updated)
      }
    } catch {
      toast.error('Erreur lors de l\'ajustement du stock')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="stock-delta">Quantité à ajuster</Label>
        <Input
          id="stock-delta"
          type="number"
          min="0.1"
          step="0.1"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          className="w-32"
          aria-label="Quantité à ajuster"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleAdjust(-1)}
          disabled={isPending || product.currentStock === 0}
          aria-label={`Retirer ${parsedDelta}${product.unit ? ` ${product.unit}` : ''}`}
        >
          <Minus className="size-4" />
        </Button>

        <span className="min-w-[4rem] text-center text-lg font-semibold">
          {product.currentStock}
          {product.unit && <span className="ml-1 text-sm text-muted-foreground">{product.unit}</span>}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleAdjust(1)}
          disabled={isPending}
          aria-label={`Ajouter ${parsedDelta}${product.unit ? ` ${product.unit}` : ''}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}
