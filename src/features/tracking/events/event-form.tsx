import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { trackingEventRepository } from '@/lib/db/repositories/event.repository'
import { eventTypeRepository } from '@/lib/db/repositories/event.repository'
import { useUndo } from '@/hooks/use-undo'
import { eventPriorityEnum } from '@/schemas/tracking-event.schema'
import { formatLocalDatetime } from '@/lib/utils'
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
import type { TrackingEvent, EventPriority } from '@/schemas/tracking-event.schema'

const eventFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  typeId: z.string().optional(),
  eventDate: z.string().min(1, 'La date est requise'),
  priority: eventPriorityEnum,
  description: z.string().optional(),
  location: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

const PRIORITY_OPTIONS: { value: EventPriority; label: string }[] = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
]

const PRIORITY_BUTTON_STYLES: Record<EventPriority, string> = {
  low: 'border-blue-500 bg-blue-500/20 text-blue-300',
  medium: 'border-yellow-500 bg-yellow-500/20 text-yellow-300',
  high: 'border-red-500 bg-red-500/20 text-red-300',
}

interface EventFormProps {
  initialData?: TrackingEvent
  onSuccess?: () => void
  onCancel?: () => void
}

export function EventForm({ initialData, onSuccess, onCancel }: EventFormProps) {
  const isEditing = Boolean(initialData)
  const { withUndo } = useUndo()
  const types = useLiveQuery(() => eventTypeRepository.getAllSorted(), [])

  const defaultDate = formatLocalDatetime(new Date())

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          typeId: initialData.typeId ?? '',
          eventDate: initialData.eventDate,
          priority: initialData.priority ?? 'medium',
          description: initialData.description ?? '',
          location: initialData.location ?? '',
        }
      : {
          title: '',
          typeId: '',
          eventDate: defaultDate,
          priority: 'medium',
          description: '',
          location: '',
        },
  })

  const currentPriority = watch('priority')
  const currentTypeId = watch('typeId')

  const onSubmit = async (data: EventFormValues) => {
    try {
      const eventData = {
        title: data.title,
        typeId: data.typeId || undefined,
        eventDate: data.eventDate,
        priority: data.priority,
        description: data.description || undefined,
        location: data.location || undefined,
      }

      if (isEditing && initialData) {
        const old = { ...initialData }
        await withUndo(
          `Événement "${old.title}" modifié`,
          async () => {
            await trackingEventRepository.update(initialData.id, eventData)
          },
          async () => {
            await trackingEventRepository.update(initialData.id, {
              title: old.title,
              typeId: old.typeId,
              eventDate: old.eventDate,
              priority: old.priority,
              description: old.description,
              location: old.location,
            })
          },
        )
        toast.success('Événement modifié')
      } else {
        const created = await trackingEventRepository.create(
          eventData as Omit<TrackingEvent, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
        )
        await withUndo(
          `Événement "${created.title}" créé`,
          async () => {
            // action déjà effectuée
          },
          async () => {
            await trackingEventRepository.softDelete(created.id)
          },
        )
        toast.success('Événement créé')
      }

      onSuccess?.()
    } catch {
      toast.error("Erreur lors de la sauvegarde de l'événement")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="event-title">Titre *</Label>
        <Input
          id="event-title"
          placeholder="Ex: Rendez-vous cardiologue, Départ en vacances…"
          {...register('title')}
          aria-describedby={errors.title ? 'event-title-error' : undefined}
        />
        {errors.title && (
          <p id="event-title-error" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="event-type">Type (optionnel)</Label>
        <Select
          value={currentTypeId || '__none__'}
          onValueChange={(v) => setValue('typeId', v === '__none__' ? '' : v)}
        >
          <SelectTrigger id="event-type">
            <SelectValue placeholder="Aucun type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Aucun type</SelectItem>
            {types?.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.icon ? `${type.icon} ` : ''}{type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date / Heure */}
      <div className="space-y-2">
        <Label htmlFor="event-date">Date et heure *</Label>
        <Input
          id="event-date"
          type="datetime-local"
          {...register('eventDate')}
          aria-describedby={errors.eventDate ? 'event-date-error' : undefined}
        />
        {errors.eventDate && (
          <p id="event-date-error" className="text-sm text-destructive">
            {errors.eventDate.message}
          </p>
        )}
      </div>

      {/* Priorité — 3 boutons radio visuels */}
      <div className="space-y-2">
        <Label>Priorité</Label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue('priority', opt.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                currentPriority === opt.value
                  ? PRIORITY_BUTTON_STYLES[opt.value]
                  : 'border-border bg-transparent text-muted-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="event-description">Description (optionnel)</Label>
        <textarea
          id="event-description"
          rows={3}
          placeholder="Détails de l'événement…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          {...register('description')}
        />
      </div>

      {/* Localisation */}
      <div className="space-y-2">
        <Label htmlFor="event-location">Localisation (optionnel)</Label>
        <Input
          id="event-location"
          placeholder="Ex: Paris, Clinique Saint-Louis, En ligne…"
          {...register('location')}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isEditing ? "Modifier l'événement" : "Créer l'événement"}
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
