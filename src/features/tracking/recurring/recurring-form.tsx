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

const RESPONSE_TYPES = [
  { value: 'number', label: 'Valeur libre', description: 'Tout nombre réel (ex. -15, 3,14, 30 000 000)' },
  { value: 'slider', label: 'Curseur', description: 'Échelle configurable (min, max, pas)' },
  { value: 'boolean', label: 'Oui / Non', description: 'Réponse binaire' },
  { value: 'choice', label: 'QCM', description: 'Choix parmi des options prédéfinies' },
] as const

const RECURRENCE_TYPES = [
  { value: 'daily', label: 'Quotidien', icon: '📅' },
  { value: 'weekly', label: 'Certains jours', icon: '📆' },
  { value: 'custom', label: 'Personnalisé', icon: '⚙️' },
] as const

const recurringFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  responseType: z.enum(['number', 'slider', 'boolean', 'choice']),
  unit: z.string().optional(),
  // Slider config
  sliderMin: z.string().optional(),
  sliderMax: z.string().optional(),
  sliderStep: z.string().optional(),
  // QCM
  choicesRaw: z.string().optional(),
  multiChoice: z.boolean().optional(),
  // Récurrence
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
          sliderMin: initialData.sliderMin !== undefined ? String(initialData.sliderMin) : '1',
          sliderMax: initialData.sliderMax !== undefined ? String(initialData.sliderMax) : '10',
          sliderStep: initialData.sliderStep !== undefined ? String(initialData.sliderStep) : '1',
          choicesRaw: initialData.choices?.join(', ') ?? '',
          multiChoice: initialData.multiChoice ?? false,
          recurrenceType: initialData.recurrenceType,
          daysOfWeek: initialData.daysOfWeek ?? [],
          intervalDays: initialData.intervalDays ? String(initialData.intervalDays) : '',
        }
      : {
          name: '',
          responseType: 'number',
          unit: '',
          sliderMin: '1',
          sliderMax: '10',
          sliderStep: '1',
          choicesRaw: '',
          multiChoice: false,
          recurrenceType: 'daily',
          daysOfWeek: [],
          intervalDays: '',
        },
  })

  const responseType = watch('responseType')
  const recurrenceType = watch('recurrenceType')
  const selectedDays = watch('daysOfWeek') ?? []
  const multiChoice = watch('multiChoice')
  const intervalDays = watch('intervalDays')

  // Réinitialiser les champs conditionnels quand le type de réponse change
  useEffect(() => {
    setValue('unit', '')
    setValue('choicesRaw', '')
    setValue('multiChoice', false)
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

  const adjustInterval = (delta: number) => {
    const current = parseInt(intervalDays || '1') || 1
    const next = Math.max(1, current + delta)
    setValue('intervalDays', String(next))
  }

  const onSubmit = async (data: RecurringFormValues) => {
    // Validations transversales
    if (data.responseType === 'slider') {
      const min = parseFloat(data.sliderMin ?? '')
      const max = parseFloat(data.sliderMax ?? '')
      const step = parseFloat(data.sliderStep ?? '')
      if (isNaN(min)) {
        setError('sliderMin', { message: 'Valeur minimale requise' })
        return
      }
      if (isNaN(max)) {
        setError('sliderMax', { message: 'Valeur maximale requise' })
        return
      }
      if (max <= min) {
        setError('sliderMax', { message: 'Le maximum doit être supérieur au minimum' })
        return
      }
      if (isNaN(step) || step <= 0) {
        setError('sliderStep', { message: 'Le pas doit être un nombre positif' })
        return
      }
    }

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
          (data.responseType === 'number' || data.responseType === 'slider') && data.unit
            ? data.unit
            : undefined,
        choices,
        multiChoice: data.responseType === 'choice' ? (data.multiChoice ?? false) : undefined,
        sliderMin:
          data.responseType === 'slider' ? parseFloat(data.sliderMin ?? '1') : undefined,
        sliderMax:
          data.responseType === 'slider' ? parseFloat(data.sliderMax ?? '10') : undefined,
        sliderStep:
          data.responseType === 'slider' ? parseFloat(data.sliderStep ?? '1') : undefined,
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
              multiChoice: old.multiChoice,
              sliderMin: old.sliderMin,
              sliderMax: old.sliderMax,
              sliderStep: old.sliderStep,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          placeholder="Ex : Heures de sommeil, Hydratation, Humeur…"
          {...register('name')}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Type de réponse — cartes visuelles */}
      <div className="space-y-2">
        <Label>Type de réponse *</Label>
        <div className="grid grid-cols-2 gap-2">
          {RESPONSE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() =>
                setValue('responseType', type.value as RecurringFormValues['responseType'])
              }
              className={`rounded-lg border p-3 text-left transition-colors ${
                responseType === type.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <p className="text-sm font-medium">{type.label}</p>
              <p className="mt-0.5 text-xs opacity-70">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Unité (number ou slider) */}
      {(responseType === 'number' || responseType === 'slider') && (
        <div className="space-y-2">
          <Label htmlFor="unit">Unité (optionnel)</Label>
          <Input
            id="unit"
            placeholder="Ex : heures, L, km, min, °C…"
            {...register('unit')}
          />
        </div>
      )}

      {/* Config curseur (slider) */}
      {responseType === 'slider' && (
        <div className="space-y-3 rounded-lg border border-border bg-card/50 p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Configuration du curseur
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sliderMin" className="text-xs">Minimum *</Label>
              <Input
                id="sliderMin"
                type="number"
                step="any"
                placeholder="1"
                {...register('sliderMin')}
                aria-describedby={errors.sliderMin ? 'sliderMin-error' : undefined}
              />
              {errors.sliderMin && (
                <p id="sliderMin-error" className="text-xs text-destructive">
                  {errors.sliderMin.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sliderMax" className="text-xs">Maximum *</Label>
              <Input
                id="sliderMax"
                type="number"
                step="any"
                placeholder="10"
                {...register('sliderMax')}
                aria-describedby={errors.sliderMax ? 'sliderMax-error' : undefined}
              />
              {errors.sliderMax && (
                <p id="sliderMax-error" className="text-xs text-destructive">
                  {errors.sliderMax.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sliderStep" className="text-xs">Pas *</Label>
              <Input
                id="sliderStep"
                type="number"
                step="any"
                min="0.001"
                placeholder="1"
                {...register('sliderStep')}
                aria-describedby={errors.sliderStep ? 'sliderStep-error' : undefined}
              />
              {errors.sliderStep && (
                <p id="sliderStep-error" className="text-xs text-destructive">
                  {errors.sliderStep.message}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Exemple : min=0, max=100, pas=5 → valeurs 0, 5, 10, 15…, 100
          </p>
        </div>
      )}

      {/* Choix prédéfinis (choice) */}
      {responseType === 'choice' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="choicesRaw">Choix prédéfinis * (séparés par une virgule)</Label>
            <Input
              id="choicesRaw"
              placeholder="Ex : Excellent, Bien, Moyen, Mauvais"
              {...register('choicesRaw')}
              aria-describedby={errors.choicesRaw ? 'choices-error' : undefined}
            />
            {errors.choicesRaw && (
              <p id="choices-error" className="text-sm text-destructive">
                {errors.choicesRaw.message}
              </p>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={multiChoice ?? false}
              onCheckedChange={(checked) => setValue('multiChoice', !!checked)}
            />
            <span className="text-sm">
              Autoriser plusieurs sélections simultanées
            </span>
          </label>
        </div>
      )}

      {/* ─── Récurrence ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <Label>Récurrence *</Label>

        {/* Sélection du type — 3 boutons visuels */}
        <div className="grid grid-cols-3 gap-2">
          {RECURRENCE_TYPES.map((rt) => (
            <button
              key={rt.value}
              type="button"
              onClick={() =>
                setValue('recurrenceType', rt.value as RecurringFormValues['recurrenceType'])
              }
              className={`rounded-lg border py-2.5 text-center transition-colors ${
                recurrenceType === rt.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <div className="text-base">{rt.icon}</div>
              <div className="mt-0.5 text-xs font-medium">{rt.label}</div>
            </button>
          ))}
        </div>

        {/* Jours de la semaine (weekly) — toggles visuels */}
        {recurrenceType === 'weekly' && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {DAY_OPTIONS.map((day) => {
                const isSelected = selectedDays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
            {errors.daysOfWeek && (
              <p className="text-sm text-destructive">
                {errors.daysOfWeek.root?.message ??
                  (errors.daysOfWeek as { message?: string }).message}
              </p>
            )}
          </div>
        )}

        {/* Intervalle (custom) — contrôle +/- */}
        {recurrenceType === 'custom' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <span className="text-sm text-muted-foreground">Tous les</span>
              <button
                type="button"
                onClick={() => adjustInterval(-1)}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-sm font-bold hover:bg-accent"
              >
                −
              </button>
              <Input
                type="text"
                inputMode="numeric"
                className="w-16 text-center"
                {...register('intervalDays')}
                aria-describedby={errors.intervalDays ? 'interval-error' : undefined}
              />
              <button
                type="button"
                onClick={() => adjustInterval(1)}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-sm font-bold hover:bg-accent"
              >
                +
              </button>
              <span className="text-sm text-muted-foreground">
                jour{parseInt(intervalDays || '1') > 1 ? 's' : ''}
              </span>
            </div>
            {errors.intervalDays && (
              <p id="interval-error" className="text-sm text-destructive">
                {errors.intervalDays.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
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
