import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { purchaseRepository } from '@/lib/db/repositories/purchase.repository'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const purchaseLineSchema = z.object({
  productId: z.string().min(1, 'Sélectionnez un produit'),
  quantity: z
    .string()
    .regex(/^(\d+(\.\d+)?)$/, 'Quantité invalide')
    .refine((v) => parseFloat(v) > 0, 'La quantité doit être positive'),
  price: z
    .string()
    .regex(/^(\d+(\.\d+)?)$/, 'Prix invalide'),
})

const shoppingFormSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  lines: z.array(purchaseLineSchema).min(1, 'Ajoutez au moins un produit'),
})

type ShoppingFormValues = z.infer<typeof shoppingFormSchema>

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

interface ShoppingFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ShoppingForm({ onSuccess, onCancel }: ShoppingFormProps) {
  const products = useLiveQuery(() => stockRepository.getAllSorted(), [])
  const { withUndo } = useUndo()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShoppingFormValues>({
    resolver: zodResolver(shoppingFormSchema),
    defaultValues: {
      date: toDatetimeLocal(new Date()),
      lines: [{ productId: '', quantity: '', price: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  const watchedLines = watch('lines')

  const handleProductSelect = (index: number, productId: string) => {
    setValue(`lines.${index}.productId`, productId)
    const product = products?.find((p) => p.id === productId)
    if (product?.basePrice !== undefined) {
      setValue(`lines.${index}.price`, String(product.basePrice))
    }
  }

  const onSubmit = async (data: ShoppingFormValues) => {
    const lines = data.lines.map((l) => ({
      productId: l.productId,
      quantity: parseFloat(l.quantity),
      price: parseFloat(l.price),
    }))

    let created: Awaited<ReturnType<typeof purchaseRepository.createMultiplePurchases>> = []

    try {
      await withUndo(
        `Course (${lines.length} produit${lines.length > 1 ? 's' : ''}) annulée`,
        async () => {
          created = await purchaseRepository.createMultiplePurchases(lines, data.date)
        },
        async () => {
          for (let i = 0; i < created.length; i++) {
            await purchaseRepository.softDelete(created[i].id)
            await stockRepository.adjustStock(lines[i].productId, -lines[i].quantity)
          }
        },
      )

      toast.success('Course enregistrée')
      onSuccess?.()
    } catch {
      toast.error("Erreur lors de l'enregistrement de la course")
    }
  }

  if (products === undefined) {
    return <p className="text-muted-foreground py-4">Chargement des produits…</p>
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Aucun produit dans votre inventaire. Créez d'abord des produits dans l'onglet Inventaire.
        </p>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Fermer
          </Button>
        )}
      </div>
    )
  }

  const totalCost = watchedLines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0
    const price = parseFloat(l.price) || 0
    return sum + qty * price
  }, 0)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date de la course */}
      <div className="space-y-2">
        <Label htmlFor="date">Date de la course *</Label>
        <Input
          id="date"
          type="datetime-local"
          {...register('date')}
          aria-describedby={errors.date ? 'date-error' : undefined}
        />
        {errors.date && (
          <p id="date-error" className="text-sm text-destructive">
            {errors.date.message}
          </p>
        )}
      </div>

      {/* Lignes d'achat */}
      <div className="space-y-3">
        <Label>Produits achetés *</Label>
        {errors.lines?.root && (
          <p className="text-sm text-destructive">{errors.lines.root.message}</p>
        )}

        {fields.map((field, index) => {
          const lineErrors = errors.lines?.[index]
          const selectedProductId = watchedLines[index]?.productId
          const selectedProduct = products.find((p) => p.id === selectedProductId)

          return (
            <Card key={field.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Produit {index + 1}
                </span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={isSubmitting}
                    aria-label="Retirer ce produit"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              {/* Sélecteur produit */}
              <div className="space-y-1">
                <Select
                  value={watchedLines[index]?.productId ?? ''}
                  onValueChange={(v) => handleProductSelect(index, v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    aria-describedby={lineErrors?.productId ? `product-error-${index}` : undefined}
                  >
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.unit && ` (${p.unit})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lineErrors?.productId && (
                  <p id={`product-error-${index}`} className="text-sm text-destructive">
                    {lineErrors.productId.message}
                  </p>
                )}
              </div>

              {/* Quantité et Prix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`qty-${index}`}>
                    Quantité{selectedProduct?.unit ? ` (${selectedProduct.unit})` : ''} *
                  </Label>
                  <Input
                    id={`qty-${index}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 2"
                    {...register(`lines.${index}.quantity`)}
                    disabled={isSubmitting}
                    aria-describedby={lineErrors?.quantity ? `qty-error-${index}` : undefined}
                  />
                  {lineErrors?.quantity && (
                    <p id={`qty-error-${index}`} className="text-sm text-destructive">
                      {lineErrors.quantity.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`price-${index}`}>Prix (€) *</Label>
                  <Input
                    id={`price-${index}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 29.99"
                    {...register(`lines.${index}.price`)}
                    disabled={isSubmitting}
                    aria-describedby={lineErrors?.price ? `price-error-${index}` : undefined}
                  />
                  {lineErrors?.price && (
                    <p id={`price-error-${index}`} className="text-sm text-destructive">
                      {lineErrors.price.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ productId: '', quantity: '', price: '' })}
          disabled={isSubmitting}
          className="w-full gap-2"
        >
          <Plus className="size-4" />
          Ajouter un produit
        </Button>
      </div>

      {/* Total */}
      {totalCost > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Total estimé</span>
            <span className="text-lg font-bold">{totalCost.toFixed(2)} €</span>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer la course'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        )}
      </div>
    </form>
  )
}
