import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { routineRepository } from '@/lib/db/repositories/routine.repository'
import { stockRepository } from '@/lib/db/repositories/stock.repository'
import {
  createTrackingForRoutine,
  syncTrackingForRoutine,
} from '@/lib/services/routine-tracking.service'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { StockRoutine } from '@/schemas/stock-routine.schema'

const DAY_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
]

const routineFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  productId: z.string().min(1, 'Sélectionnez un produit'),
  quantity: z.string().regex(/^(\d+(\.\d+)?)$/, 'Quantité invalide (ex: 2 ou 1.5)'),
  recurrenceType: z.enum(['daily', 'weekly', 'custom']),
  daysOfWeek: z.array(z.number()).optional(),
  intervalDays: z.string().optional(),
})

type RoutineFormValues = z.infer<typeof routineFormSchema>

interface RoutineFormProps {
  initialData?: StockRoutine
  onSuccess?: () => void
  onCancel?: () => void
}

export function RoutineForm({ initialData, onSuccess, onCancel }: RoutineFormProps) {
  const isEditing = Boolean(initialData)
  const products = useLiveQuery(() => stockRepository.getAllSorted(), [])
  const { withUndo } = useUndo()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          productId: initialData.productId,
          quantity: String(initialData.quantity),
          recurrenceType: initialData.recurrenceType,
          daysOfWeek: initialData.daysOfWeek ?? [],
          intervalDays: initialData.intervalDays ? String(initialData.intervalDays) : '',
        }
      : {
          name: '',
          productId: '',
          quantity: '',
          recurrenceType: 'daily',
          daysOfWeek: [],
          intervalDays: '',
        },
  })

  const recurrenceType = watch('recurrenceType')
  const selectedDays = watch('daysOfWeek') ?? []

  // Réinitialiser les champs conditionnels quand le type de récurrence change
  useEffect(() => {
    if (recurrenceType === 'daily') {
      setValue('daysOfWeek', [])
      setValue('intervalDays', '')
    } else if (recurrenceType === 'weekly') {
      setValue('intervalDays', '')
    } else if (recurrenceType === 'custom') {
      setValue('daysOfWeek', [])
    }
  }, [recurrenceType, setValue])

  const toggleDay = (day: number) => {
    const current = selectedDays
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day]
    setValue('daysOfWeek', updated)
  }

  const onSubmit = async (data: RoutineFormValues) => {
    // Validation transversale
    if (data.recurrenceType === 'weekly' && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
      setError('daysOfWeek', { message: 'Sélectionnez au moins un jour' })
      return
    }
    if (data.recurrenceType === 'custom' && !data.intervalDays) {
      setError('intervalDays', { message: "L'intervalle est requis" })
      return
    }
    if (
      data.recurrenceType === 'custom' &&
      data.intervalDays &&
      parseInt(data.intervalDays) < 1
    ) {
      setError('intervalDays', { message: "L'intervalle doit être d'au moins 1 jour" })
      return
    }

    try {
      const routineData = {
        name: data.name,
        productId: data.productId,
        quantity: parseFloat(data.quantity),
        recurrenceType: data.recurrenceType,
        daysOfWeek: data.recurrenceType === 'weekly' ? data.daysOfWeek : undefined,
        intervalDays:
          data.recurrenceType === 'custom' && data.intervalDays
            ? parseInt(data.intervalDays)
            : undefined,
        isActive: isEditing && initialData ? initialData.isActive : true,
      }

      if (isEditing && initialData) {
        const old = { ...initialData }
        await withUndo(
          `Routine "${old.name}" modifiée`,
          async () => {
            await routineRepository.update(initialData.id, routineData)
          },
          async () => {
            await routineRepository.update(initialData.id, {
              name: old.name,
              productId: old.productId,
              quantity: old.quantity,
              recurrenceType: old.recurrenceType,
              daysOfWeek: old.daysOfWeek,
              intervalDays: old.intervalDays,
              isActive: old.isActive,
            })
          },
        )
        toast.success('Routine mise à jour')
        // Story 6.4 — Synchroniser le suivi lié (non-bloquant)
        try {
          const updatedRoutine = await routineRepository.getById(initialData.id)
          if (updatedRoutine) await syncTrackingForRoutine(updatedRoutine)
        } catch {
          // non-bloquant
        }
      } else {
        const created = await routineRepository.create(
          routineData as Omit<StockRoutine, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
        )
        await withUndo(
          `Routine "${created.name}" créée`,
          async () => {
            // action déjà effectuée — rien à faire
          },
          async () => {
            await routineRepository.softDelete(created.id)
          },
        )
        toast.success('Routine créée')
        // Story 6.4 — Créer le suivi lié (non-bloquant)
        try {
          await createTrackingForRoutine(created)
        } catch {
          // Echec silencieux — la routine est créée, le suivi peut être recréé manuellement
        }
      }

      onSuccess?.()
    } catch {
      toast.error('Erreur lors de la sauvegarde de la routine')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          placeholder="Ex: Protéines du soir, Vitamine D…"
          {...register('name')}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Produit */}
      <div className="space-y-2">
        <Label htmlFor="productId">Produit *</Label>
        <Select
          value={watch('productId')}
          onValueChange={(v) => setValue('productId', v)}
        >
          <SelectTrigger id="productId">
            <SelectValue placeholder="Sélectionner un produit" />
          </SelectTrigger>
          <SelectContent>
            {products?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}{p.unit ? ` (${p.unit})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.productId && (
          <p className="text-sm text-destructive">{errors.productId.message}</p>
        )}
      </div>

      {/* Quantité */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantité consommée *</Label>
        <Input
          id="quantity"
          type="text"
          inputMode="decimal"
          placeholder="Ex: 2 ou 1.5"
          {...register('quantity')}
          aria-describedby={errors.quantity ? 'quantity-error' : undefined}
        />
        {errors.quantity && (
          <p id="quantity-error" className="text-sm text-destructive">
            {errors.quantity.message}
          </p>
        )}
      </div>

      {/* Type de récurrence */}
      <div className="space-y-2">
        <Label htmlFor="recurrenceType">Récurrence *</Label>
        <Select
          value={recurrenceType}
          onValueChange={(v) =>
            setValue('recurrenceType', v as RoutineFormValues['recurrenceType'])
          }
        >
          <SelectTrigger id="recurrenceType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Quotidien</SelectItem>
            <SelectItem value="weekly">Hebdomadaire (jours spécifiques)</SelectItem>
            <SelectItem value="custom">Personnalisé (tous les N jours)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jours de la semaine (weekly) */}
      {recurrenceType === 'weekly' && (
        <div className="space-y-2">
          <Label>Jours de la semaine *</Label>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((day) => (
              <label
                key={day.value}
                className="flex cursor-pointer items-center gap-1.5"
              >
                <Checkbox
                  checked={selectedDays.includes(day.value)}
                  onCheckedChange={() => toggleDay(day.value)}
                />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
          {errors.daysOfWeek && (
            <p className="text-sm text-destructive">
              {errors.daysOfWeek.root?.message ?? (errors.daysOfWeek as { message?: string }).message}
            </p>
          )}
        </div>
      )}

      {/* Intervalle (custom) */}
      {recurrenceType === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="intervalDays">Tous les N jours *</Label>
          <Input
            id="intervalDays"
            type="text"
            inputMode="numeric"
            placeholder="Ex: 3"
            {...register('intervalDays')}
            aria-describedby={errors.intervalDays ? 'intervalDays-error' : undefined}
          />
          {errors.intervalDays && (
            <p id="intervalDays-error" className="text-sm text-destructive">
              {errors.intervalDays.message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isEditing ? 'Modifier la routine' : 'Créer la routine'}
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
