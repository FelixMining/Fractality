import { Pause, Play, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ExerciseBlock } from './exercise-block'
import { ExerciseSearchDialog } from './exercise-search-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useWorkoutStore } from '@/stores/workout.store'
import { useWorkoutTimer } from '@/hooks/use-workout-timer'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'
import type { PainNote } from '@/schemas/pain-note.schema'
import { toast } from 'sonner'

interface WorkoutLiveScreenProps {
  onQuit: () => void
  onComplete: () => void
}

export function WorkoutLiveScreen({
  onQuit,
  onComplete,
}: WorkoutLiveScreenProps) {
  const {
    currentExerciseIndex,
    exercises,
    painNotes,
    isPaused,
    pauseSession,
    resumeSession,
    nextExercise,
    previousExercise,
    addSeries,
    updateSeries,
    deleteSeries,
    completeSeries,
    addExerciseToSession,
    removeExerciseFromSession,
    addPainNote,
    removePainNote,
  } = useWorkoutStore()

  const { formattedTime } = useWorkoutTimer()
  const [initialFatigue, setInitialFatigue] = useState<number | null>(null)
  const [showFatigueSlider, setShowFatigueSlider] = useState(
    currentExerciseIndex === 0,
  )
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [exerciseToRemoveIndex, setExerciseToRemoveIndex] = useState<number | null>(
    null,
  )

  const currentExercise = exercises[currentExerciseIndex]
  const isFirstExercise = currentExerciseIndex === 0
  const isLastExercise = currentExerciseIndex === exercises.length - 1

  const allSeriesCompleted = currentExercise?.series.every((s) => s.completed)
  const canComplete = isLastExercise && allSeriesCompleted

  const progressPercentage = ((currentExerciseIndex + 1) / exercises.length) * 100

  useEffect(() => {
    if (currentExerciseIndex > 0 && showFatigueSlider) {
      setShowFatigueSlider(false)
    }
  }, [currentExerciseIndex, showFatigueSlider])

  const handleValidateFatigue = () => {
    setShowFatigueSlider(false)
    // Ici on pourrait mettre à jour la session avec initialFatigue
  }

  const handleAddExercise = async (exercise: WorkoutExercise) => {
    try {
      await addExerciseToSession(exercise.id)
      toast.success('Exercice ajouté')
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'exercice')
      console.error('Failed to add exercise:', error)
    }
  }

  const handleRequestRemoveExercise = () => {
    setExerciseToRemoveIndex(currentExerciseIndex)
    setConfirmRemoveOpen(true)
  }

  const handleConfirmRemoveExercise = () => {
    if (exerciseToRemoveIndex !== null) {
      removeExerciseFromSession(exerciseToRemoveIndex)
      toast.success('Exercice retiré')
      setExerciseToRemoveIndex(null)
    }
  }

  const handleAddPainNote = async (data: {
    zone: PainNote['zone']
    intensity: number
    note?: string
  }) => {
    try {
      await addPainNote(currentExerciseIndex, {
        ...data,
        sessionId: currentExercise.series[0]?.sessionId || '',
        exerciseId: currentExercise.exercise.id,
      })
      toast.success('Note de douleur enregistrée')
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement de la note')
      console.error('Failed to add pain note:', error)
    }
  }

  const handleRemovePainNote = async (painNoteId: string) => {
    try {
      await removePainNote(painNoteId)
      toast.success('Note de douleur supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error('Failed to remove pain note:', error)
    }
  }

  // Filtrer les notes de douleur pour l'exercice actuel
  const currentExercisePainNotes = painNotes.filter(
    (note) => note.exerciseId === currentExercise.exercise.id,
  )

  if (!currentExercise) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Aucun exercice trouvé</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header fixe */}
      <div className="border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          {/* Timer */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {formattedTime}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={isPaused ? resumeSession : pauseSession}
              aria-label={isPaused ? 'Reprendre' : 'Pause'}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Bouton Quitter */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onQuit}
            aria-label="Quitter"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progression */}
        <div className="mx-auto mt-4 max-w-3xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Exercice {currentExerciseIndex + 1}/{exercises.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExerciseSearchOpen(true)}
                aria-label="Ajouter un exercice"
              >
                <Plus className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
              <span className="text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Slider fatigue initiale */}
          {showFatigueSlider && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 font-medium">Comment te sens-tu ?</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Fatigué</span>
                <Slider
                  value={[initialFatigue || 5]}
                  onValueChange={(val) => setInitialFatigue(val[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                  aria-label="Fatigue initiale (1-10)"
                />
                <span className="text-sm text-muted-foreground">En forme</span>
                <Badge variant="secondary" className="min-w-10 justify-center">
                  {initialFatigue || 5}
                </Badge>
              </div>
              <Button
                type="button"
                onClick={handleValidateFatigue}
                className="mt-3 w-full"
              >
                Valider
              </Button>
            </div>
          )}

          {/* Bloc exercice actuel */}
          <ExerciseBlock
            exercise={currentExercise.exercise}
            series={currentExercise.series}
            painNotes={currentExercisePainNotes}
            onAddSeries={() => addSeries(currentExerciseIndex)}
            onUpdateSeries={(index, data) =>
              updateSeries(currentExerciseIndex, index, data)
            }
            onDeleteSeries={(index) => deleteSeries(currentExerciseIndex, index)}
            onCompleteSeries={(index) =>
              completeSeries(currentExerciseIndex, index)
            }
            onAddPainNote={handleAddPainNote}
            onRemovePainNote={handleRemovePainNote}
            onRemoveExercise={handleRequestRemoveExercise}
          />
        </div>
      </div>

      {/* Dialog recherche exercice */}
      <ExerciseSearchDialog
        open={exerciseSearchOpen}
        onOpenChange={setExerciseSearchOpen}
        onSelect={handleAddExercise}
      />

      {/* Dialog confirmation retrait exercice */}
      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title="Retirer cet exercice ?"
        description="L'exercice sera retiré de la séance en cours. Cette action est annulable."
        confirmLabel="Retirer"
        variant="destructive"
        onConfirm={handleConfirmRemoveExercise}
      />

      {/* Footer fixe - Navigation */}
      <div className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={previousExercise}
            disabled={isFirstExercise}
            className={cn(isFirstExercise && 'invisible')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          {!isLastExercise && (
            <Button type="button" onClick={nextExercise}>
              Suivant
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {isLastExercise && (
            <Button
              type="button"
              onClick={onComplete}
              disabled={!canComplete}
              className={cn(
                'bg-gradient-to-r from-blue-500 to-violet-500',
                'hover:from-blue-600 hover:to-violet-600',
                !canComplete && 'opacity-50',
              )}
            >
              Terminer la séance
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
