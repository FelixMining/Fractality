import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workSessionSchema, type WorkSession } from '@/schemas/work-session.schema'
import { workSessionRepository } from '@/lib/db/repositories/work-session.repository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProjectPicker } from '@/components/shared/project-picker'
import { formatDuration } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useEffect, useMemo } from 'react'
import { z } from 'zod'

// Constantes pour les durées
const ONE_HOUR_MS = 3600000
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

// Schema conditionnel pour mode manual (validation startTime, endTime)
const workSessionManualSchema = z.object({
  startTime: z.string().min(1, 'Heure de début requise'),
  endTime: z.string().min(1, 'Heure de fin requise'),
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  productivity: z.number().int().min(1).max(10).optional(),
  concentration: z.number().int().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  location: z.string().optional(),
  images: z.array(z.string()).optional(),
})
  .refine(
    (data) => {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)
      // Vérifier que les dates sont valides
      return !isNaN(start.getTime()) && !isNaN(end.getTime())
    },
    {
      message: 'Date invalide',
      path: ['startTime'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)
      // Vérifier que les dates ne sont pas dans le futur
      const now = Date.now()
      return start.getTime() <= now && end.getTime() <= now
    },
    {
      message: 'Les dates futures ne sont pas autorisées',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    {
      message: "L'heure de fin doit être postérieure à l'heure de début",
      path: ['endTime'],
    }
  )

interface WorkSessionFormProps {
  mode?: 'timer' | 'manual'
  initialDuration?: number
  initialData?: WorkSession
  onSuccess?: () => void
  onCancel?: () => void
}

export function WorkSessionForm({
  mode = 'timer',
  initialDuration,
  initialData,
  onSuccess,
  onCancel,
}: WorkSessionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'timer' | 'manual'>(mode)

  // Mémoriser la date actuelle pour éviter les stale closures
  const now = useMemo(() => new Date(), [])
  const defaultDate = useMemo(() => now.toISOString().slice(0, 16), [now])

  // Précalculer les limites min/max pour les champs datetime-local
  const minDateTime = useMemo(
    () => new Date(Date.now() - ONE_YEAR_MS).toISOString().slice(0, 16),
    []
  )
  const maxDateTime = useMemo(
    () => new Date().toISOString().slice(0, 16),
    []
  )

  // Schema conditionnel selon le mode
  const schema = selectedMode === 'manual'
    ? workSessionManualSchema
    : workSessionSchema.omit({
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        isDeleted: true,
        deletedAt: true,
      })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          duration: initialData.duration,
          date: initialData.date,
          productivity: initialData.productivity,
          concentration: initialData.concentration,
          tags: initialData.tags,
          projectId: initialData.projectId,
          location: initialData.location,
          images: initialData.images,
        }
      : selectedMode === 'manual' ? {
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // +1h par défaut
          title: '',
          description: '',
          productivity: 5,
          concentration: 5,
          tags: [],
          projectId: undefined,
          location: '',
          images: [],
        }
      : {
          title: '',
          description: '',
          duration: initialDuration || 0,
          date: now.toISOString(),
          productivity: 5,
          concentration: 5,
          tags: [],
          projectId: undefined,
          location: '',
          images: [],
        },
  })

  // Calcul automatique de la durée en mode manual
  const startTime = useWatch({ control: form.control, name: 'startTime' })
  const endTime = useWatch({ control: form.control, name: 'endTime' })

  const calculatedDuration = selectedMode === 'manual' && startTime && endTime
    ? Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
    : 0

  // Réinitialiser le formulaire quand on change de mode
  useEffect(() => {
    const currentTime = Date.now()
    const defaults = selectedMode === 'manual' ? {
      startTime: new Date(currentTime).toISOString().slice(0, 16),
      endTime: new Date(currentTime + ONE_HOUR_MS).toISOString().slice(0, 16),
      title: '',
      description: '',
      productivity: 5,
      concentration: 5,
      tags: [],
      projectId: undefined,
      location: '',
      images: [],
    } : {
      title: '',
      description: '',
      duration: initialDuration || 0,
      date: now.toISOString(),
      productivity: 5,
      concentration: 5,
      tags: [],
      projectId: undefined,
      location: '',
      images: [],
    }
    form.reset(defaults)
  }, [selectedMode, initialDuration, now, form])

  const onSubmit = async (data: z.infer<typeof workSessionManualSchema> | Partial<WorkSession>) => {
    setIsSubmitting(true)
    try {
      let sessionData: Partial<Omit<WorkSession, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>>

      if (selectedMode === 'manual') {
        // Transformer les données mode manual vers WorkSession
        const manualData = data as z.infer<typeof workSessionManualSchema>
        const { startTime, endTime, ...rest } = manualData
        sessionData = {
          ...rest,
          duration: calculatedDuration, // Durée calculée en secondes
          date: new Date(startTime).toISOString(), // Date de début comme date de la session
        }
      } else {
        // Mode timer — données déjà au bon format
        sessionData = data as Partial<WorkSession>
      }

      // Le repository validera avec workSessionSchema et ajoutera les champs manquants (userId, id, etc.)
      if (initialData) {
        await workSessionRepository.update(initialData.id, sessionData as any)
        toast.success('Session modifiée')
      } else {
        await workSessionRepository.create(sessionData as any)
        toast.success('Session enregistrée')
      }
      onSuccess?.()
    } catch (error) {
      // Gestion d'erreurs spécifique selon le type
      if (error instanceof z.ZodError) {
        toast.error('Données invalides. Veuillez vérifier le formulaire.')
      } else if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Erreur réseau. Vérifiez votre connexion.')
        } else if (error.message.includes('auth')) {
          toast.error('Session expirée. Reconnectez-vous.')
        } else {
          toast.error(`Erreur: ${error.message}`)
        }
      } else {
        toast.error("Erreur lors de l'enregistrement")
      }
      console.error('Erreur soumission formulaire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full overflow-x-hidden">
      {/* Tabs pour switcher entre modes */}
      <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as 'timer' | 'manual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">Chronomètre</TabsTrigger>
          <TabsTrigger value="manual">Saisie manuelle</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-6 mt-6">
          {/* Durée (read-only en mode chronomètre) */}
          {initialDuration !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="duration">Durée enregistrée</Label>
              <Input
                id="duration"
                value={formatDuration(form.watch('duration'))}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Date/heure */}
          <div className="space-y-2">
            <Label htmlFor="date">Date et heure</Label>
            <Input
              id="date"
              type="datetime-local"
              className="w-full min-w-0"
              value={form.watch('date') ? new Date(form.watch('date')).toISOString().slice(0, 16) : defaultDate}
              onChange={(e) => {
                const isoString = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()
                form.setValue('date', isoString)
              }}
              min={minDateTime}
              max={maxDateTime}
            />
            <p className="text-xs text-muted-foreground">
              Max 1 an dans le passé, pas de dates futures
            </p>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6 mt-6">
          {/* Champs startTime et endTime */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Début</Label>
            <Input
              id="startTime"
              type="datetime-local"
              className="w-full min-w-0"
              {...form.register('startTime')}
              autoFocus
              aria-invalid={(form.formState.errors as any).startTime ? 'true' : 'false'}
              aria-describedby={(form.formState.errors as any).startTime ? 'startTime-error' : undefined}
              min={minDateTime}
              max={maxDateTime}
            />
            {(form.formState.errors as any).startTime && (
              <p id="startTime-error" className="text-sm text-destructive" role="alert">
                {String((form.formState.errors as any).startTime.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Fin</Label>
            <Input
              id="endTime"
              type="datetime-local"
              className="w-full min-w-0"
              {...form.register('endTime')}
              aria-invalid={(form.formState.errors as any).endTime ? 'true' : 'false'}
              aria-describedby={(form.formState.errors as any).endTime ? 'endTime-error' : undefined}
              min={minDateTime}
              max={maxDateTime}
            />
            {(form.formState.errors as any).endTime && (
              <p id="endTime-error" className="text-sm text-destructive" role="alert">
                {String((form.formState.errors as any).endTime.message)}
              </p>
            )}
          </div>

          {/* Durée calculée read-only */}
          {calculatedDuration > 0 && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
              <Label className="text-sm font-medium text-muted-foreground">Durée calculée</Label>
              <div className="text-2xl font-mono font-bold text-primary">
                {formatDuration(calculatedDuration)}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="Ex: Développement feature X"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Notes additionnelles (optionnel)"
          rows={3}
        />
      </div>

      {/* Productivité */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Productivité</Label>
          <span className="text-sm text-muted-foreground">
            {form.watch('productivity') || 5}/10
          </span>
        </div>
        <Controller
          control={form.control}
          name="productivity"
          render={({ field }) => (
            <Slider
              min={1}
              max={10}
              step={1}
              value={[field.value || 5]}
              onValueChange={(vals) => field.onChange(vals[0])}
            />
          )}
        />
      </div>

      {/* Concentration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Concentration</Label>
          <span className="text-sm text-muted-foreground">
            {form.watch('concentration') || 5}/10
          </span>
        </div>
        <Controller
          control={form.control}
          name="concentration"
          render={({ field }) => (
            <Slider
              min={1}
              max={10}
              step={1}
              value={[field.value || 5]}
              onValueChange={(vals) => field.onChange(vals[0])}
            />
          )}
        />
      </div>

      {/* Projet */}
      <div className="space-y-2">
        <Label>Projet</Label>
        <Controller
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <ProjectPicker
              value={field.value || null}
              onChange={(val) => field.onChange(val)}
              placeholder="Aucun projet"
            />
          )}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (séparés par virgules)</Label>
        <Input
          id="tags"
          value={(form.watch('tags') || []).join(', ')}
          onChange={(e) => {
            const tags = e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0 && t.length <= 50) // Limite 50 caractères par tag
              .filter((t, index, self) => self.indexOf(t) === index) // Dédoublonnage
              .slice(0, 20) // Maximum 20 tags
            form.setValue('tags', tags)
          }}
          placeholder="Ex: urgent, client-abc"
        />
        {(form.watch('tags')?.length ?? 0) > 0 && (
          <p className="text-xs text-muted-foreground">
            {form.watch('tags')?.length ?? 0} tag(s) · Max 20 tags, 50 caractères/tag
          </p>
        )}
      </div>

      {/* Boutons */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Enregistrement...' : initialData ? 'Modifier' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
