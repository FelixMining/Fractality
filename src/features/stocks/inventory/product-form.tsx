import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
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
import { toast } from 'sonner'
import type { StockProduct } from '@/schemas/stock-product.schema'

const productFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  productType: z.enum(['liquid', 'quantity', 'bulk']),
  unit: z.string().optional(),
  basePrice: z.string().regex(/^(\d+(\.\d+)?)?$/, 'Prix invalide').optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormProps {
  initialData?: StockProduct
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = Boolean(initialData)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      productType: initialData?.productType ?? 'quantity',
      unit: initialData?.unit ?? '',
      basePrice: initialData?.basePrice !== undefined ? String(initialData.basePrice) : '',
    },
  })

  const productType = watch('productType')

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = {
        name: data.name,
        productType: data.productType,
        unit: data.unit || undefined,
        basePrice: data.basePrice ? parseFloat(data.basePrice) : undefined,
      }

      if (isEditing && initialData) {
        await stockRepository.update(initialData.id, {
          ...payload,
          currentStock: initialData.currentStock,
        })
        toast.success('Produit mis à jour')
      } else {
        await stockRepository.create({
          ...payload,
          currentStock: 0,
        } as Omit<StockProduct, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>)
        toast.success('Produit créé')
      }

      onSuccess?.()
    } catch {
      toast.error('Erreur lors de la sauvegarde du produit')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          placeholder="Ex: Whey protéine, Huile d'olive…"
          {...register('name')}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Type de produit */}
      <div className="space-y-2">
        <Label htmlFor="productType">Type *</Label>
        <Select
          value={productType}
          onValueChange={(v) => setValue('productType', v as ProductFormValues['productType'])}
        >
          <SelectTrigger id="productType">
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quantity">Quantité (unités, comprimés…)</SelectItem>
            <SelectItem value="liquid">Liquide (litres, cl…)</SelectItem>
            <SelectItem value="bulk">Vrac (grammes, kg…)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Unité */}
      <div className="space-y-2">
        <Label htmlFor="unit">Unité (optionnel)</Label>
        <Input
          id="unit"
          placeholder={
            productType === 'liquid' ? 'Ex: L, mL' :
            productType === 'bulk' ? 'Ex: g, kg' :
            'Ex: unité, gélule, comprimé'
          }
          {...register('unit')}
        />
      </div>

      {/* Prix de base */}
      <div className="space-y-2">
        <Label htmlFor="basePrice">Prix de base (€, optionnel)</Label>
        <Input
          id="basePrice"
          type="text"
          inputMode="decimal"
          placeholder="Ex: 29.99"
          {...register('basePrice')}
          aria-describedby={errors.basePrice ? 'basePrice-error' : undefined}
        />
        {errors.basePrice && (
          <p id="basePrice-error" className="text-sm text-destructive">
            {errors.basePrice.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isEditing ? 'Modifier' : 'Créer le produit'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  )
}
