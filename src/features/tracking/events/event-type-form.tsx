import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { eventTypeRepository } from '@/lib/db/repositories/event.repository'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { EventType } from '@/schemas/tracking-event-type.schema'

const eventTypeFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  icon: z.string().optional(),
  // Union explicite : soit une valeur hex valide, soit une chaîne vide (= pas de couleur)
  color: z
    .union([
      z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format hex invalide (ex: #F59E0B)'),
      z.literal(''),
    ])
    .optional(),
})

type EventTypeFormValues = z.infer<typeof eventTypeFormSchema>

interface EventTypeFormProps {
  initialData?: EventType
  onSuccess?: () => void
  onCancel?: () => void
}

export function EventTypeForm({ initialData, onSuccess, onCancel }: EventTypeFormProps) {
  const isEditing = Boolean(initialData)
  const { withUndo } = useUndo()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          icon: initialData.icon ?? '',
          color: initialData.color ?? '',
        }
      : {
          name: '',
          icon: '',
          color: '',
        },
  })

  // Valeur observée pour synchroniser le color picker natif
  const currentColor = watch('color')
  const pickerValue = currentColor?.match(/^#[0-9A-Fa-f]{6}$/) ? currentColor : '#000000'

  const onSubmit = async (data: EventTypeFormValues) => {
    try {
      const typeData = {
        name: data.name,
        icon: data.icon || undefined,
        color: data.color || undefined,
      }

      if (isEditing && initialData) {
        const old = { ...initialData }
        await withUndo(
          `Type "${old.name}" modifié`,
          async () => {
            await eventTypeRepository.update(initialData.id, typeData)
          },
          async () => {
            await eventTypeRepository.update(initialData.id, {
              name: old.name,
              icon: old.icon,
              color: old.color,
            })
          },
        )
        toast.success('Type mis à jour')
      } else {
        // La création est faite en avance ; withUndo enregistre uniquement le softDelete comme annulation
        const created = await eventTypeRepository.create(
          typeData as Omit<EventType, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
        )
        await withUndo(
          `Type "${created.name}" créé`,
          async () => {
            // action déjà effectuée
          },
          async () => {
            await eventTypeRepository.softDelete(created.id)
          },
        )
        toast.success('Type créé')
      }

      onSuccess?.()
    } catch {
      toast.error('Erreur lors de la sauvegarde du type')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="type-name">Nom *</Label>
        <Input
          id="type-name"
          placeholder="Ex: Rendez-vous médical, Voyage, Sport…"
          {...register('name')}
          aria-describedby={errors.name ? 'type-name-error' : undefined}
        />
        {errors.name && (
          <p id="type-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Icône */}
      <div className="space-y-2">
        <Label htmlFor="type-icon">Icône (optionnel)</Label>
        <Input
          id="type-icon"
          placeholder="Ex: 🏃 💊 📅 ✈️"
          {...register('icon')}
        />
        <p className="text-xs text-muted-foreground">Un emoji pour identifier visuellement ce type</p>
      </div>

      {/* Couleur */}
      <div className="space-y-2">
        <Label htmlFor="type-color">Couleur (optionnel)</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="type-color"
            placeholder="#F59E0B"
            {...register('color')}
            aria-describedby={errors.color ? 'type-color-error' : undefined}
            className="flex-1"
          />
          {/* Color picker : utilise setValue pour mettre à jour react-hook-form (H1 fix)
              et value= pour refléter la couleur existante en mode édition (H2 fix) */}
          <input
            type="color"
            value={pickerValue}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
            onChange={(e) => {
              setValue('color', e.target.value, { shouldValidate: true })
            }}
            aria-label="Sélecteur visuel"
          />
        </div>
        {errors.color && (
          <p id="type-color-error" className="text-sm text-destructive">
            {errors.color.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isEditing ? 'Modifier le type' : 'Créer le type'}
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
