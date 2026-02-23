import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trackingRecurringRepository } from '@/lib/db/repositories/tracking.repository'
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
import type { TrackingRecurring } from '@/schemas/tracking-recurring.schema'

const DAY_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
]

const recurringFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  responseType: z.enum(['number', 'boolean', 'choice']),
  unit: z.string().optional(),
  choicesRaw: z.string().optional(),
  recurrenceType: z.enum(['daily', 'weekly', 'custom']),
  daysOfWeek: z.array(z.number()).optional(),
  intervalDays: z.string().optional(),
})

type RecurringFormValues = z.infer<typeof recurringFormSchema>

interface RecurringFormProps {
  initialData?: TrackingRecurring
  onSuccess?: () => void
  onCancel?: () => void
}

export function RecurringForm({ initialData, onSuccess, onCancel }: RecurringFormProps) {
  const isEditing = Boolean(initialData)
  const { withUndo } = useUndo()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          responseType: initialData.responseType,
          unit: initialData.unit ?? '',
          choicesRaw: initialData.choices?.join(', ') ?? '',
          recurrenceType: initialData.recurrenceType,
          daysOfWeek: initialData.daysOfWeek ?? [],
          intervalDays: initialData.intervalDays ? String(initialData.intervalDays) : '',
        }
      : {
          name: '',
          responseType: 'number',
          unit: '',
          choicesRaw: '',
          recurrenceType: 'daily',
          daysOfWeek: [],
          intervalDays: '',
        },
  })

  const responseType = watch('responseType')
  const recurrenceType = watch('recurrenceType')
  const selectedDays = watch('daysOfWeek') ?? []

  // Réinitialiser les champs conditionnels quand le type de réponse change
  useEffect(() => {
    setValue('unit', '')
    setValue('choicesRaw', '')
  }, [responseType, setValue])

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

  const onSubmit = async (data: RecurringFormValues) => {
    // Validations transversales
    if (data.responseType === 'choice') {
      const choices = data.choicesRaw
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!choices || choices.length < 2) {
        setError('choicesRaw', { message: 'Entrez au moins 2 choix séparés par une virgule' })
        return
      }
    }
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
      const choices =
        data.responseType === 'choice'
          ? data.choicesRaw
              ?.split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined

      const recurringData = {
        name: data.name,
        responseType: data.responseType,
        unit:
          data.responseType === 'number' && data.unit ? data.unit : undefined,
        choices,
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
          `Suivi "${old.name}" modifié`,
          async () => {
            await trackingRecurringRepository.update(initialData.id, recurringData)
          },
          async () => {
            await trackingRecurringRepository.update(initialData.id, {
              name: old.name,
              responseType: old.responseType,
              unit: old.unit,
              choices: old.choices,
              recurrenceType: old.recurrenceType,
              daysOfWeek: old.daysOfWeek,
              intervalDays: old.intervalDays,
              isActive: old.isActive,
            })
          },
        )
        toast.success('Suivi mis à jour')
      } else {
        const created = await trackingRecurringRepository.create(
          recurringData as Omit<
            TrackingRecurring,
            'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'
          >,
        )
        await withUndo(
          `Suivi "${created.name}" créé`,
          async () => {
            // action déjà effectuée — rien à faire
          },
          async () => {
            await trackingRecurringRepository.softDelete(created.id)
          },
        )
        toast.success('Suivi créé')
      }

      onSuccess?.()
    } catch {
      toast.error('Erreur lors de la sauvegarde du suivi')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          placeholder="Ex: Heures de sommeil, Hydratation, Humeur…"
          {...register('name')}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Type de réponse */}
      <div className="space-y-2">
        <Label htmlFor="responseType">Type de réponse *</Label>
        <Select
          value={responseType}
          onValueChange={(v) => setValue('responseType', v as RecurringFormValues['responseType'])}
        >
          <SelectTrigger id="responseType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Valeur chiffrée (slider 1-10)</SelectItem>
            <SelectItem value="boolean">Oui / Non</SelectItem>
            <SelectItem value="choice">QCM (choix prédéfinis)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Unité (conditionnel : number) */}
      {responseType === 'number' && (
        <div className="space-y-2">
          <Label htmlFor="unit">Unité (optionnel)</Label>
          <Input
            id="unit"
            placeholder="Ex: heures, L, km, min…"
            {...register('unit')}
          />
        </div>
      )}

      {/* Choix prédéfinis (conditionnel : choice) */}
      {responseType === 'choice' && (
        <div className="space-y-2">
          <Label htmlFor="choicesRaw">Choix prédéfinis * (séparés par une virgule)</Label>
          <Input
            id="choicesRaw"
            placeholder="Ex: Excellent, Bien, Moyen, Mauvais"
            {...register('choicesRaw')}
            aria-describedby={errors.choicesRaw ? 'choices-error' : undefined}
          />
          {errors.choicesRaw && (
            <p id="choices-error" className="text-sm text-destructive">
              {errors.choicesRaw.message}
            </p>
          )}
        </div>
      )}

      {/* Type de récurrence */}
      <div className="space-y-2">
        <Label htmlFor="recurrenceType">Récurrence *</Label>
        <Select
          value={recurrenceType}
          onValueChange={(v) =>
            setValue('recurrenceType', v as RecurringFormValues['recurrenceType'])
          }
        >
          <SelectTrigger id="recurrenceType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Quotidien</SelectItem>
            <SelectItem value="weekly">Certains jours de la semaine</SelectItem>
            <SelectItem value="custom">Personnalisé (tous les N jours)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jours de la semaine (conditionnel : weekly) */}
      {recurrenceType === 'weekly' && (
        <div className="space-y-2">
          <Label>Jours de la semaine *</Label>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((day) => (
              <label key={day.value} className="flex cursor-pointer items-center gap-1.5">
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
              {errors.daysOfWeek.root?.message ??
                (errors.daysOfWeek as { message?: string }).message}
            </p>
          )}
        </div>
      )}

      {/* Intervalle (conditionnel : custom) */}
      {recurrenceType === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="intervalDays">Tous les N jours *</Label>
          <Input
            id="intervalDays"
            type="text"
            inputMode="numeric"
            placeholder="Ex: 3"
            {...register('intervalDays')}
            aria-describedby={errors.intervalDays ? 'interval-error' : undefined}
          />
          {errors.intervalDays && (
            <p id="interval-error" className="text-sm text-destructive">
              {errors.intervalDays.message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isEditing ? 'Modifier le suivi' : 'Créer le suivi'}
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
