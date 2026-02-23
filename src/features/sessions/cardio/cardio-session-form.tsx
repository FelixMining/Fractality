import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cardioSessionRepository } from '@/lib/db/repositories/cardio-session.repository'
import type { CardioSession } from '@/schemas/cardio-session.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjectPicker } from '@/components/shared/project-picker'
import { toast } from 'sonner'
import { useState, useCallback } from 'react'
import { z } from 'zod'
import { parseGpx, GpxParseError, type GpxMetrics } from '@/lib/gpx/gpx-parser'
import { formatDuration } from '@/lib/utils'

const ACTIVITY_OPTIONS = [
  { value: 'running', label: 'Course' },
  { value: 'cycling', label: 'Vélo' },
  { value: 'swimming', label: 'Natation' },
  { value: 'hiking', label: 'Randonnée' },
  { value: 'walking', label: 'Marche' },
  { value: 'other', label: 'Autre' },
] as const

const cardioFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  activityType: z.enum(['running', 'cycling', 'swimming', 'hiking', 'walking', 'other']),
  durationHours: z.number().int().min(0).max(99),
  durationMinutes: z.number().int().min(0).max(59),
  durationSeconds: z.number().int().min(0).max(59),
  distanceKm: z
    .string()
    .regex(/^\d*\.?\d*$/, 'La distance doit être un nombre positif')
    .optional(),
  date: z.string().optional(), // Format datetime-local "YYYY-MM-DDTHH:mm" — validé conditionnellement dans onSubmit
  tags: z.array(z.string()).optional(),
  projectId: z.string().optional(),
})

type CardioFormData = z.infer<typeof cardioFormSchema>

interface CardioSessionFormProps {
  initialData?: CardioSession
  onSuccess?: () => void
  onCancel?: () => void
}

export function CardioSessionForm({ initialData, onSuccess, onCancel }: CardioSessionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'gpx' | 'manual'>(
    initialData?.inputMode || 'gpx',
  )
  const [gpxMetrics, setGpxMetrics] = useState<GpxMetrics | null>(null)
  const [gpxError, setGpxError] = useState<string | null>(null)
  const [gpxFileName, setGpxFileName] = useState<string | null>(null)

  const form = useForm<CardioFormData>({
    resolver: zodResolver(cardioFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description || '',
          activityType: initialData.activityType,
          durationHours: Math.floor(initialData.duration / 3600),
          durationMinutes: Math.floor((initialData.duration % 3600) / 60),
          durationSeconds: initialData.duration % 60,
          distanceKm: initialData.distance
            ? (initialData.distance / 1000).toString()
            : '',
          date: initialData.inputMode === 'manual'
            ? new Date(initialData.date).toISOString().slice(0, 16)
            : undefined,
          tags: initialData.tags || [],
          projectId: initialData.projectId,
        }
      : {
          title: '',
          description: '',
          activityType: 'running' as const,
          durationHours: 0,
          durationMinutes: 0,
          durationSeconds: 0,
          distanceKm: '',
          date: new Date().toISOString().slice(0, 16),
          tags: [],
          projectId: undefined,
        },
  })

  const handleGpxFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setGpxError(null)
      setGpxFileName(file.name)

      try {
        const text = await file.text()
        const metrics = parseGpx(text)

        setGpxMetrics(metrics)

        // Pré-remplir le formulaire
        const totalSeconds = metrics.duration
        form.setValue('durationHours', Math.floor(totalSeconds / 3600))
        form.setValue('durationMinutes', Math.floor((totalSeconds % 3600) / 60))
        form.setValue('durationSeconds', totalSeconds % 60)

        if (metrics.distance > 0) {
          form.setValue('distanceKm', (metrics.distance / 1000).toFixed(2))
        }

        if (metrics.startLocation) {
          form.setValue('title', metrics.startLocation)
        }
      } catch (error) {
        if (error instanceof GpxParseError) {
          setGpxError(error.message)
        } else {
          setGpxError('Erreur inattendue lors de la lecture du fichier')
        }
        setGpxMetrics(null)
      }
    },
    [form],
  )

  const onSubmit = async (data: CardioFormData) => {
    // Validation conditionnelle : date requise en mode manuel
    if (selectedMode === 'manual' && !data.date) {
      form.setError('date', { message: 'La date est requise' })
      return
    }

    setIsSubmitting(true)
    try {
      const totalDuration =
        data.durationHours * 3600 + data.durationMinutes * 60 + data.durationSeconds

      if (totalDuration <= 0) {
        toast.error('La durée doit être supérieure à 0')
        return
      }

      const distanceMeters = data.distanceKm
        ? parseFloat(data.distanceKm) * 1000
        : undefined

      // Calcul vitesse moyenne auto si distance fournie (mode manuel)
      let avgSpeed = gpxMetrics?.avgSpeed
      let maxSpeed = gpxMetrics?.maxSpeed
      let avgPace = gpxMetrics?.avgPace
      let elevationGain = gpxMetrics?.elevationGain
      let elevationLoss = gpxMetrics?.elevationLoss
      let startLocation = gpxMetrics?.startLocation

      if (selectedMode === 'manual' && distanceMeters && distanceMeters > 0) {
        avgSpeed = (distanceMeters / 1000) / (totalDuration / 3600)
        avgPace = totalDuration / (distanceMeters / 1000)
      }

      // En mode manuel : date saisie par l'utilisateur
      // En mode GPX édition : conserver la date originale (initialData) si pas de re-import GPX
      // En mode GPX création : date extraite du fichier GPX ou maintenant
      const sessionDate =
        selectedMode === 'manual' && data.date
          ? new Date(data.date).toISOString()
          : gpxMetrics?.startDate ?? initialData?.date ?? new Date().toISOString()

      const sessionData = {
        title: data.title,
        description: data.description || undefined,
        date: sessionDate,
        activityType: data.activityType,
        duration: totalDuration,
        distance: distanceMeters && distanceMeters > 0 ? Math.round(distanceMeters) : undefined,
        avgSpeed: avgSpeed && avgSpeed > 0 ? Math.round(avgSpeed * 100) / 100 : undefined,
        maxSpeed: maxSpeed && maxSpeed > 0 ? Math.round(maxSpeed * 100) / 100 : undefined,
        elevationGain: elevationGain && elevationGain > 0 ? Math.round(elevationGain) : undefined,
        elevationLoss: elevationLoss && elevationLoss > 0 ? Math.round(elevationLoss) : undefined,
        avgPace: avgPace && avgPace > 0 ? Math.round(avgPace) : undefined,
        startLocation: startLocation || undefined,
        inputMode: selectedMode as 'gpx' | 'manual',
        tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
        projectId: data.projectId || undefined,
      }

      if (initialData) {
        await cardioSessionRepository.update(initialData.id, sessionData)
        toast.success('Session cardio modifiée')
      } else {
        // userId auto-récupéré par BaseRepository.create() via supabase.auth.getUser()
        await cardioSessionRepository.create(sessionData as any)
        toast.success('Session cardio créée')
      }

      onSuccess?.()
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Données invalides. Veuillez vérifier le formulaire.')
      } else if (error instanceof Error) {
        toast.error(`Erreur: ${error.message}`)
      } else {
        toast.error("Erreur lors de l'enregistrement")
      }
      console.error('Erreur soumission formulaire cardio:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchDistanceKm = form.watch('distanceKm')
  const watchDurationH = form.watch('durationHours')
  const watchDurationM = form.watch('durationMinutes')
  const watchDurationS = form.watch('durationSeconds')
  const totalDurationPreview = watchDurationH * 3600 + watchDurationM * 60 + watchDurationS

  // Calcul vitesse preview
  const distancePreview = watchDistanceKm ? parseFloat(watchDistanceKm) : 0
  const speedPreview =
    selectedMode === 'manual' && distancePreview > 0 && totalDurationPreview > 0
      ? (distancePreview / (totalDurationPreview / 3600)).toFixed(1)
      : null

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Tabs GPX / Manuel */}
      {!initialData && (
        <Tabs
          value={selectedMode}
          onValueChange={(v) => {
            setSelectedMode(v as 'gpx' | 'manual')
            setGpxMetrics(null)
            setGpxError(null)
            setGpxFileName(null)
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gpx">Import GPX</TabsTrigger>
            <TabsTrigger value="manual">Saisie manuelle</TabsTrigger>
          </TabsList>

          <TabsContent value="gpx" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gpx-file">Fichier GPX</Label>
              <Input
                id="gpx-file"
                type="file"
                accept=".gpx"
                onChange={handleGpxFile}
                aria-describedby="gpx-help"
              />
              <p id="gpx-help" className="text-xs text-muted-foreground">
                Sélectionnez un fichier .gpx exporté depuis votre application GPS
              </p>
            </div>

            {gpxError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{gpxError}</p>
              </div>
            )}

            {gpxMetrics && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">Métriques extraites de {gpxFileName}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Durée : </span>
                    <span className="font-medium">{formatDuration(gpxMetrics.duration)}</span>
                  </div>
                  {gpxMetrics.distance > 0 && (
                    <div>
                      <span className="text-muted-foreground">Distance : </span>
                      <span className="font-medium">
                        {(gpxMetrics.distance / 1000).toFixed(2)} km
                      </span>
                    </div>
                  )}
                  {gpxMetrics.avgSpeed > 0 && (
                    <div>
                      <span className="text-muted-foreground">Vitesse moy. : </span>
                      <span className="font-medium">{gpxMetrics.avgSpeed.toFixed(1)} km/h</span>
                    </div>
                  )}
                  {gpxMetrics.elevationGain > 0 && (
                    <div>
                      <span className="text-muted-foreground">Dénivelé+ : </span>
                      <span className="font-medium">{gpxMetrics.elevationGain} m</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-6" />
        </Tabs>
      )}

      {/* Type d'activité */}
      <div className="space-y-2">
        <Label htmlFor="activityType">Type d'activité *</Label>
        <Controller
          control={form.control}
          name="activityType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="activityType">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Date et heure (mode manuel uniquement) */}
      {(selectedMode === 'manual' || initialData?.inputMode === 'manual') && (
        <div className="space-y-2">
          <Label htmlFor="date">Date et heure *</Label>
          <Input
            id="date"
            type="datetime-local"
            {...form.register('date')}
            aria-label="Date et heure de la session"
          />
          {form.formState.errors.date && (
            <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
          )}
        </div>
      )}

      {/* Durée */}
      {selectedMode === 'manual' || (selectedMode === 'gpx' && !gpxMetrics) ? (
        <div className="space-y-2">
          <Label>Durée *</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                max={99}
                placeholder="HH"
                {...form.register('durationHours', { valueAsNumber: true })}
                aria-label="Heures"
              />
            </div>
            <span className="text-muted-foreground">h</span>
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                max={59}
                placeholder="MM"
                {...form.register('durationMinutes', { valueAsNumber: true })}
                aria-label="Minutes"
              />
            </div>
            <span className="text-muted-foreground">m</span>
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                max={59}
                placeholder="SS"
                {...form.register('durationSeconds', { valueAsNumber: true })}
                aria-label="Secondes"
              />
            </div>
            <span className="text-muted-foreground">s</span>
          </div>
          {totalDurationPreview > 0 && (
            <p className="text-xs text-muted-foreground">
              = {formatDuration(totalDurationPreview)}
            </p>
          )}
        </div>
      ) : gpxMetrics ? (
        <div className="space-y-2">
          <Label>Durée (depuis GPX)</Label>
          <Input
            value={formatDuration(gpxMetrics.duration)}
            disabled
            className="bg-muted"
          />
        </div>
      ) : null}

      {/* Distance (mode manuel) */}
      {selectedMode === 'manual' && (
        <div className="space-y-2">
          <Label htmlFor="distanceKm">Distance (km) — optionnel</Label>
          <Input
            id="distanceKm"
            type="number"
            step="0.01"
            min="0"
            {...form.register('distanceKm')}
            placeholder="Ex: 5.50"
          />
          {form.formState.errors.distanceKm && (
            <p className="text-sm text-destructive">{form.formState.errors.distanceKm.message}</p>
          )}
          {speedPreview && !form.formState.errors.distanceKm && (
            <p className="text-xs text-muted-foreground">
              Vitesse moyenne calculée : {speedPreview} km/h
            </p>
          )}
        </div>
      )}

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="Ex: Course matinale au parc"
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
              .filter((t) => t.length > 0 && t.length <= 50)
              .filter((t, index, self) => self.indexOf(t) === index)
              .slice(0, 20)
            form.setValue('tags', tags)
          }}
          placeholder="Ex: trail, montagne"
        />
      </div>

      {/* Boutons */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? 'Enregistrement...'
            : initialData
              ? 'Modifier'
              : 'Créer la session'}
        </Button>
      </div>
    </form>
  )
}
