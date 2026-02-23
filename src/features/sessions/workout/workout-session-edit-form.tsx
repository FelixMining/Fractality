import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { NumericStepper } from '@/components/shared/numeric-stepper'
import { useUndoStore } from '@/stores/undo.store'
import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutSeriesRepository } from '@/lib/db/repositories/workout-series.repository'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { painNoteRepository } from '@/lib/db/repositories/pain-note.repository'
import { supabase } from '@/lib/supabase/client'
import type { PainZone, PainNote } from '@/schemas/pain-note.schema'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'
import { toast } from 'sonner'

const PAIN_ZONE_LABELS: Record<PainZone, string> = {
  shoulder: 'Épaule',
  elbow: 'Coude',
  wrist: 'Poignet',
  back: 'Dos',
  hip: 'Hanche',
  knee: 'Genou',
  ankle: 'Cheville',
}

// Schéma de validation pour le formulaire d'édition
const editSeriesSchema = z.object({
  id: z.string(),
  reps: z.number().int().min(1).max(100),
  weight: z.number().min(0).max(500).optional(),
  restTime: z.number().int().min(0).max(3600).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
})

const editFormSchema = z
  .object({
    startedAt: z.string().min(1, 'Date de début requise'),
    completedAt: z.string().optional(),
    initialFatigue: z.number().int().min(1).max(10).optional(),
    exercises: z.array(
      z.object({
        exerciseId: z.string(),
        exerciseName: z.string(),
        muscleGroup: z.string(),
        series: z.array(editSeriesSchema).min(1),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.completedAt && data.startedAt) {
      const start = new Date(data.startedAt)
      const end = new Date(data.completedAt)
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fin doit être après le début',
          path: ['completedAt'],
        })
      }
    }
  })

type EditFormValues = z.infer<typeof editFormSchema>

interface ExerciseWithData {
  exercise: WorkoutExercise
  series: WorkoutSeries[]
  painNotes: PainNote[]
}

interface WorkoutSessionEditFormProps {
  sessionId: string
  onBack: () => void
  onSaved: () => void
}

// Convertit un ISO string en valeur pour input datetime-local
function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Convertit une valeur datetime-local en ISO string
function datetimeLocalToISO(val: string): string {
  return new Date(val).toISOString()
}

/**
 * Formulaire d'édition d'une séance de musculation passée.
 * Respecte AC1 : pré-remplissage avec toutes les données de la séance.
 * Respecte AC2 : sauvegarde avec undo via useUndoStore.
 * Story 3.5 : Modification et création rétroactive de séances
 */
export function WorkoutSessionEditForm({
  sessionId,
  onBack,
  onSaved,
}: WorkoutSessionEditFormProps) {
  const [loading, setLoading] = useState(true)
  const [exercisesWithData, setExercisesWithData] = useState<ExerciseWithData[]>([])
  const [painNotes, setPainNotes] = useState<PainNote[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const pushUndo = useUndoStore((s) => s.pushUndo)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      exercises: [],
    },
  })

  const { fields: exerciseFields, update: updateExercise } = useFieldArray({
    control,
    name: 'exercises',
  })

  const initialFatigue = watch('initialFatigue') ?? 5

  // Chargement des données de la session
  const loadSessionData = useCallback(async () => {
    setLoading(true)
    try {
      const session = await workoutSessionRepository.getById(sessionId)
      if (!session) {
        toast.error('Séance introuvable')
        onBack()
        return
      }

      const allSeries = await workoutSessionRepository.getSessionSeries(sessionId)
      const allPainNotes = await painNoteRepository.getNotesForSession(sessionId)

      // Dédupliquer les exerciceIds dans l'ordre d'apparition
      const seen = new Set<string>()
      const orderedExerciseIds: string[] = []
      for (const s of allSeries) {
        if (!seen.has(s.exerciseId)) {
          seen.add(s.exerciseId)
          orderedExerciseIds.push(s.exerciseId)
        }
      }

      // Charger les exercices en parallèle
      const exercises = await Promise.all(
        orderedExerciseIds.map((id) => workoutExerciseRepository.getById(id))
      )

      const exercisesData: ExerciseWithData[] = exercises
        .filter(Boolean)
        .map((exercise) => ({
          exercise: exercise!,
          series: allSeries
            .filter((s) => s.exerciseId === exercise!.id)
            .sort((a, b) => a.order - b.order),
          painNotes: allPainNotes.filter((n) => n.exerciseId === exercise!.id),
        }))

      setExercisesWithData(exercisesData)
      setPainNotes(allPainNotes)

      // Initialiser le formulaire
      setValue('startedAt', isoToDatetimeLocal(session.startedAt))
      if (session.completedAt) {
        setValue('completedAt', isoToDatetimeLocal(session.completedAt))
      }
      if (session.initialFatigue) {
        setValue('initialFatigue', session.initialFatigue)
      }
      setValue(
        'exercises',
        exercisesData.map((ex) => ({
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.name,
          muscleGroup: ex.exercise.muscleGroup,
          series: ex.series.map((s) => ({
            id: s.id,
            reps: s.reps,
            weight: s.weight,
            restTime: s.restTime,
            rpe: s.rpe,
          })),
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [sessionId, onBack, setValue])

  useEffect(() => {
    loadSessionData()
  }, [loadSessionData])

  const onSubmit = async (formData: EditFormValues) => {
    setIsSaving(true)
    try {
      // Capturer snapshot avant modification pour undo
      const session = await workoutSessionRepository.getById(sessionId)
      if (!session) throw new Error('Session not found')
      const seriesSnapshot = await workoutSessionRepository.getSessionSeries(sessionId)

      // IDs des séries existantes en DB (pour distinguer nouvelles vs existantes)
      const originalSeriesIds = new Set(seriesSnapshot.map((s) => s.id))

      // Récupérer userId pour créer les nouvelles séries
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Track IDs des nouvelles séries créées (pour undo)
      const newSeriesIds: string[] = []

      // Sauvegarder chaque série : update si existante, create si nouvelle
      for (const exData of formData.exercises) {
        for (let sIdx = 0; sIdx < exData.series.length; sIdx++) {
          const s = exData.series[sIdx]
          if (originalSeriesIds.has(s.id)) {
            // Série existante → update via pattern get+put
            await workoutSeriesRepository.update(s.id, {
              reps: s.reps,
              weight: s.weight,
              restTime: s.restTime,
              rpe: s.rpe,
            })
          } else {
            // Nouvelle série ajoutée en édition → create
            const created = await workoutSeriesRepository.create({
              userId: user.id,
              sessionId,
              exerciseId: exData.exerciseId,
              order: sIdx,
              reps: s.reps,
              ...(s.weight !== undefined && { weight: s.weight }),
              ...(s.restTime !== undefined && { restTime: s.restTime }),
              ...(s.rpe !== undefined && s.rpe > 0 && { rpe: s.rpe }),
              completed: true,
            })
            newSeriesIds.push(created.id)
          }
        }
      }

      // Recalculer les totaux
      const totalVolume = formData.exercises
        .flatMap((ex) => ex.series)
        .reduce((sum, s) => sum + s.reps * (s.weight || 0), 0)

      const startedAt = datetimeLocalToISO(formData.startedAt)
      const completedAt = formData.completedAt
        ? datetimeLocalToISO(formData.completedAt)
        : session.completedAt

      const totalDuration = completedAt
        ? Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)
        : session.totalDuration

      // Mettre à jour la session
      await workoutSessionRepository.update(sessionId, {
        startedAt,
        ...(completedAt && { completedAt }),
        ...(formData.initialFatigue !== undefined && { initialFatigue: formData.initialFatigue }),
        totalVolume,
        ...(totalDuration !== undefined && { totalDuration }),
      })

      // Enregistrer dans le store undo
      pushUndo('Séance modifiée', async () => {
        // Restaurer les séries originales
        for (const s of seriesSnapshot) {
          await workoutSeriesRepository.update(s.id, {
            reps: s.reps,
            weight: s.weight,
            restTime: s.restTime,
            rpe: s.rpe,
          })
        }
        // Supprimer les nouvelles séries créées pendant l'édition
        for (const newId of newSeriesIds) {
          await workoutSeriesRepository.softDelete(newId)
        }
        // Restaurer la session
        await workoutSessionRepository.update(sessionId, {
          startedAt: session.startedAt,
          ...(session.completedAt && { completedAt: session.completedAt }),
          ...(session.initialFatigue !== undefined && { initialFatigue: session.initialFatigue }),
          totalVolume: session.totalVolume,
          ...(session.totalDuration !== undefined && { totalDuration: session.totalDuration }),
        })
      })

      toast.success('Séance modifiée')
      onSaved()
    } catch (error) {
      console.error('Failed to save session:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePainNote = async (painNoteId: string) => {
    try {
      await painNoteRepository.softDelete(painNoteId)
      setPainNotes((prev) => prev.filter((n) => n.id !== painNoteId))
      toast.success('Note de douleur supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4" aria-label="Chargement du formulaire">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Retour à l'historique"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <h1 className="text-xl font-bold">Modifier la séance</h1>
      </div>

      {/* Section métadonnées */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Détails de la séance</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="startedAt" className="text-sm font-medium">
              Date et heure de début
            </label>
            <input
              id="startedAt"
              type="datetime-local"
              {...register('startedAt')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-describedby={errors.startedAt ? 'startedAt-error' : undefined}
            />
            {errors.startedAt && (
              <p id="startedAt-error" className="text-sm text-destructive" role="alert">
                {errors.startedAt.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="completedAt" className="text-sm font-medium">
              Date et heure de fin <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="completedAt"
              type="datetime-local"
              {...register('completedAt')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-describedby={errors.completedAt ? 'completedAt-error' : undefined}
            />
            {errors.completedAt && (
              <p id="completedAt-error" className="text-sm text-destructive" role="alert">
                {errors.completedAt.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Fatigue initiale <span className="text-muted-foreground">(optionnel)</span>
              </label>
              <Badge variant="secondary" className="min-w-8 justify-center">
                {initialFatigue}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">Fatigué</span>
              <Slider
                value={[initialFatigue]}
                onValueChange={(val) => setValue('initialFatigue', val[0])}
                min={1}
                max={10}
                step={1}
                className="flex-1"
                aria-label="Fatigue initiale (1-10)"
              />
              <span className="text-xs text-muted-foreground">En forme</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section exercices */}
      {exerciseFields.map((exerciseField, exIndex) => {
        const exData = exercisesWithData[exIndex]
        const exercisePainNotes = painNotes.filter(
          (n) => n.exerciseId === exerciseField.exerciseId
        )

        return (
          <Card key={exerciseField.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{exerciseField.exerciseName}</h3>
                  <p className="text-sm text-muted-foreground">{exerciseField.muscleGroup}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* En-têtes colonnes */}
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium px-1">
                <span>Reps</span>
                <span>Charge (kg)</span>
                <span>Repos (s)</span>
                <span>RPE</span>
              </div>

              {/* Séries */}
              {exerciseField.series.map((series, sIndex) => (
                <div key={series.id} className="grid grid-cols-4 gap-2 items-center">
                  <NumericStepper
                    value={series.reps}
                    onChange={(val) => {
                      const updated = { ...exerciseField }
                      updated.series = [...updated.series]
                      updated.series[sIndex] = { ...updated.series[sIndex], reps: val }
                      updateExercise(exIndex, updated)
                    }}
                    min={1}
                    max={100}
                    step={1}
                    compact
                    aria-label={`Reps série ${sIndex + 1}`}
                  />
                  <NumericStepper
                    value={series.weight ?? 0}
                    onChange={(val) => {
                      const updated = { ...exerciseField }
                      updated.series = [...updated.series]
                      updated.series[sIndex] = { ...updated.series[sIndex], weight: val }
                      updateExercise(exIndex, updated)
                    }}
                    min={0}
                    max={500}
                    step={0.5}
                    compact
                    aria-label={`Charge série ${sIndex + 1}`}
                  />
                  <NumericStepper
                    value={series.restTime ?? 90}
                    onChange={(val) => {
                      const updated = { ...exerciseField }
                      updated.series = [...updated.series]
                      updated.series[sIndex] = { ...updated.series[sIndex], restTime: val }
                      updateExercise(exIndex, updated)
                    }}
                    min={0}
                    max={3600}
                    step={5}
                    compact
                    aria-label={`Repos série ${sIndex + 1}`}
                  />
                  <NumericStepper
                    value={series.rpe ?? 0}
                    onChange={(val) => {
                      const updated = { ...exerciseField }
                      updated.series = [...updated.series]
                      updated.series[sIndex] = {
                        ...updated.series[sIndex],
                        rpe: val > 0 ? val : undefined,
                      }
                      updateExercise(exIndex, updated)
                    }}
                    min={0}
                    max={10}
                    step={1}
                    compact
                    aria-label={`RPE série ${sIndex + 1}`}
                  />
                </div>
              ))}

              {/* Bouton ajouter série */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  const updated = { ...exerciseField }
                  const lastSeries = updated.series[updated.series.length - 1]
                  updated.series = [
                    ...updated.series,
                    {
                      id: crypto.randomUUID(),
                      reps: lastSeries?.reps ?? 10,
                      weight: lastSeries?.weight,
                      restTime: lastSeries?.restTime,
                      rpe: lastSeries?.rpe,
                    },
                  ]
                  updateExercise(exIndex, updated)
                }}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Ajouter une série
              </Button>

              {/* Notes de douleur */}
              {exercisePainNotes.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Notes de douleur ({exercisePainNotes.length})
                  </h4>
                  {exercisePainNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={note.intensity > 7 ? 'destructive' : 'secondary'}
                        >
                          {PAIN_ZONE_LABELS[note.zone]} — {note.intensity}/10
                        </Badge>
                        {note.note && (
                          <span className="text-xs text-muted-foreground">{note.note}</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeletePainNote(note.id)}
                        aria-label="Supprimer cette note de douleur"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Avertissement si exercice non trouvé dans la DB */}
              {!exData && (
                <p className="text-xs text-muted-foreground italic">
                  Exercice supprimé — données conservées
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Bouton sauvegarder sticky */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" aria-hidden="true" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </form>
  )
}
