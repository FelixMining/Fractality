import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ChevronLeft, Clock } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { NumericStepper } from '@/components/shared/numeric-stepper'
import { ExerciseSearchDialog } from './exercise-search-dialog'
import { supabase } from '@/lib/supabase/client'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import { workoutSessionTemplateRepository } from '@/lib/db/repositories/workout-session-template.repository'
import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutSeriesRepository } from '@/lib/db/repositories/workout-series.repository'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'
import type { WorkoutSessionTemplate } from '@/schemas/workout-session-template.schema'
import { toast } from 'sonner'

const todayStr = new Date().toISOString().split('T')[0]

const retroactiveSeriesSchema = z.object({
  reps: z.number().int().min(1).max(100),
  weight: z.number().min(0).max(500).optional(),
  restTime: z.number().int().min(0).max(3600).optional(),
  rpe: z.number().int().min(0).max(10).optional(),
})

const retroactiveFormSchema = z
  .object({
    date: z
      .string()
      .min(1, 'Date requise')
      .refine((val) => {
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        return new Date(val) <= todayEnd
      }, 'La date ne peut pas être dans le futur'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
    initialFatigue: z.number().int().min(1).max(10).optional(),
    programId: z.string().optional(),
    sessionTemplateId: z.string().optional(),
    exercises: z
      .array(
        z.object({
          exerciseId: z.string(),
          exerciseName: z.string(),
          muscleGroup: z.string(),
          series: z
            .array(retroactiveSeriesSchema)
            .min(1, 'Au moins une série requise'),
        }),
      )
      .min(1, 'Au moins un exercice requis'),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.date) {
      const start = new Date(`${data.date}T${data.startTime}:00`)
      const end = new Date(`${data.date}T${data.endTime}:00`)
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'heure de fin doit être après l'heure de début",
          path: ['endTime'],
        })
      }
    }
  })

type RetroactiveFormValues = z.infer<typeof retroactiveFormSchema>

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  return `${m}min`
}

interface WorkoutRetroactiveFormProps {
  onBack: () => void
}

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Formulaire de création rétroactive d'une séance de musculation.
 * Respecte AC3 : date passée, heures début/fin, programme optionnel, exercices + séries.
 * Respecte AC4 : séance créée avec status='completed', séries completed=true.
 * Story 3.5 : Modification et création rétroactive de séances
 */
export function WorkoutRetroactiveForm({ onBack }: WorkoutRetroactiveFormProps) {
  const navigate = useNavigate()
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState(false)
  const [templates, setTemplates] = useState<WorkoutSessionTemplate[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const programs = useLiveQuery(() => workoutProgramRepository.getAllSorted(), [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<RetroactiveFormValues>({
    resolver: zodResolver(retroactiveFormSchema),
    defaultValues: {
      date: todayStr,
      startTime: '10:00',
      endTime: '11:00',
      exercises: [],
    },
  })

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
    update: updateExercise,
  } = useFieldArray({ control, name: 'exercises' })

  const watchDate = watch('date')
  const watchStartTime = watch('startTime')
  const watchEndTime = watch('endTime')
  const watchInitialFatigue = watch('initialFatigue') ?? 5
  const watchProgramId = watch('programId')
  const watchSessionTemplateId = watch('sessionTemplateId')

  // Durée calculée en temps réel
  const calculatedDuration = (() => {
    if (!watchDate || !watchStartTime || !watchEndTime) return null
    const start = new Date(`${watchDate}T${watchStartTime}:00`)
    const end = new Date(`${watchDate}T${watchEndTime}:00`)
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000)
    return diff > 0 ? diff : null
  })()

  // Charger les séances-types quand le programme change
  useEffect(() => {
    if (!watchProgramId) {
      setTemplates([])
      setValue('sessionTemplateId', undefined)
      return
    }
    workoutProgramRepository
      .getSessionTemplates(watchProgramId)
      .then(setTemplates)
      .catch(() => setTemplates([]))
  }, [watchProgramId, setValue])

  // Pré-remplir les exercices quand une séance-type est sélectionnée
  useEffect(() => {
    if (!watchSessionTemplateId) return
    workoutSessionTemplateRepository
      .getTemplateExercises(watchSessionTemplateId)
      .then((templateExercises) => {
        const newExercises = templateExercises
          .filter(({ exercise }) => !!exercise)
          .map(({ templateExercise, exercise }) => ({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            muscleGroup: exercise.muscleGroup,
            series: Array.from({ length: templateExercise.defaultSets }, () => ({
              reps: templateExercise.defaultReps ?? 10,
              weight: templateExercise.defaultWeight,
              restTime: 90,
              rpe: undefined as number | undefined,
            })),
          }))
        setValue('exercises', newExercises)
      })
      .catch(console.error)
  }, [watchSessionTemplateId, setValue])

  const handleAddExercise = (exercise: WorkoutExercise) => {
    if (exerciseFields.some((f) => f.exerciseId === exercise.id)) {
      toast.info('Exercice déjà dans la séance')
      return
    }
    appendExercise({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      series: [{ reps: 10, weight: undefined, restTime: 90, rpe: undefined }],
    })
    setExerciseSearchOpen(false)
  }

  const onSubmit = async (formData: RetroactiveFormValues) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Non authentifié')
        return
      }

      const startedAt = new Date(`${formData.date}T${formData.startTime}:00`).toISOString()
      const completedAt = new Date(`${formData.date}T${formData.endTime}:00`).toISOString()
      const totalDuration = Math.floor(
        (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
      )
      const totalVolume = formData.exercises
        .flatMap((ex) => ex.series)
        .reduce((sum, s) => sum + s.reps * (s.weight ?? 0), 0)

      const session = await workoutSessionRepository.create({
        userId: user.id,
        startedAt,
        completedAt,
        status: 'completed',
        totalDuration,
        totalVolume,
        ...(formData.initialFatigue !== undefined && { initialFatigue: formData.initialFatigue }),
        ...(formData.programId && { programId: formData.programId }),
        ...(formData.sessionTemplateId && { sessionTemplateId: formData.sessionTemplateId }),
      })

      let order = 0
      for (const ex of formData.exercises) {
        for (const s of ex.series) {
          await workoutSeriesRepository.create({
            userId: user.id,
            sessionId: session.id,
            exerciseId: ex.exerciseId,
            order: order++,
            reps: s.reps,
            ...(s.weight !== undefined && { weight: s.weight }),
            ...(s.restTime !== undefined && { restTime: s.restTime }),
            ...(s.rpe !== undefined && s.rpe > 0 && { rpe: s.rpe }),
            completed: true,
          })
        }
      }

      toast.success('Séance créée')
      await navigate({ to: '/sessions/workout/history' })
    } catch (error) {
      console.error('Failed to create retroactive session:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
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
          aria-label="Retour"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <h1 className="text-xl font-bold">Ajouter une séance passée</h1>
      </div>

      {/* Section Quand */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Quand ?</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              type="date"
              max={todayStr}
              {...register('date')}
              className={INPUT_CLASS}
              aria-describedby={errors.date ? 'date-error' : undefined}
            />
            {errors.date && (
              <p id="date-error" className="text-sm text-destructive" role="alert">
                {errors.date.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="startTime" className="text-sm font-medium">
                Heure début
              </label>
              <input
                id="startTime"
                type="time"
                {...register('startTime')}
                className={INPUT_CLASS}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.startTime.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="endTime" className="text-sm font-medium">
                Heure fin
              </label>
              <input
                id="endTime"
                type="time"
                {...register('endTime')}
                className={INPUT_CLASS}
                aria-describedby={errors.endTime ? 'endTime-error' : undefined}
              />
              {errors.endTime && (
                <p id="endTime-error" className="text-sm text-destructive" role="alert">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {calculatedDuration !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Durée : {formatDuration(calculatedDuration)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Programme (optionnel) */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">
            Programme{' '}
            <span className="text-muted-foreground font-normal text-sm">(optionnel)</span>
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="programId" className="text-sm font-medium">
              Programme
            </label>
            <select id="programId" {...register('programId')} className={INPUT_CLASS}>
              <option value="">— Aucun programme —</option>
              {programs?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {watchProgramId && templates.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="sessionTemplateId" className="text-sm font-medium">
                Séance-type
              </label>
              <select
                id="sessionTemplateId"
                {...register('sessionTemplateId')}
                className={INPUT_CLASS}
              >
                <option value="">— Aucune séance-type —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Sélectionner une séance-type pré-remplit les exercices
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Fatigue initiale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Fatigue initiale{' '}
              <span className="text-muted-foreground font-normal text-sm">(optionnel)</span>
            </h2>
            <Badge variant="secondary" className="min-w-8 justify-center">
              {watchInitialFatigue}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Fatigué</span>
            <Slider
              value={[watchInitialFatigue]}
              onValueChange={(val) => setValue('initialFatigue', val[0])}
              min={1}
              max={10}
              step={1}
              className="flex-1"
              aria-label="Fatigue initiale (1-10)"
            />
            <span className="text-xs text-muted-foreground">En forme</span>
          </div>
        </CardContent>
      </Card>

      {/* Section Exercices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Exercices</h2>
        </div>

        {exerciseFields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ajoutez au moins un exercice pour créer la séance
          </p>
        )}

        {exerciseFields.map((exerciseField, exIndex) => (
          <Card key={exerciseField.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{exerciseField.exerciseName}</h3>
                  <p className="text-sm text-muted-foreground">{exerciseField.muscleGroup}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeExercise(exIndex)}
                  aria-label={`Retirer ${exerciseField.exerciseName}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
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
                <div key={sIndex} className="grid grid-cols-4 gap-2 items-center">
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
                  <div className="flex items-center gap-1">
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
                    {exerciseField.series.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 text-muted-foreground"
                        onClick={() => {
                          const updated = { ...exerciseField }
                          updated.series = updated.series.filter((_, i) => i !== sIndex)
                          updateExercise(exIndex, updated)
                        }}
                        aria-label={`Supprimer série ${sIndex + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Ajouter série */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  const updated = { ...exerciseField }
                  const last = updated.series[updated.series.length - 1]
                  updated.series = [
                    ...updated.series,
                    {
                      reps: last?.reps ?? 10,
                      weight: last?.weight,
                      restTime: last?.restTime,
                      rpe: last?.rpe,
                    },
                  ]
                  updateExercise(exIndex, updated)
                }}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Ajouter une série
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setExerciseSearchOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Ajouter un exercice
        </Button>
      </div>

      <ExerciseSearchDialog
        open={exerciseSearchOpen}
        onOpenChange={setExerciseSearchOpen}
        onSelect={handleAddExercise}
      />

      {/* Footer sticky */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création...' : 'Créer la séance'}
          </Button>
        </div>
      </div>
    </form>
  )
}
