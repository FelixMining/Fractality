import { Plus, ChevronDown, ChevronUp, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { SeriesRow } from './series-row'
import { PainNoteForm } from './pain-note-form'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'
import { MUSCLE_GROUP_LABELS } from '@/schemas/workout-exercise.schema'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'
import type { PainNote } from '@/schemas/pain-note.schema'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const PAIN_ZONE_LABELS: Record<string, string> = {
  shoulder: 'Épaule',
  elbow: 'Coude',
  wrist: 'Poignet',
  back: 'Dos',
  hip: 'Hanche',
  knee: 'Genou',
  ankle: 'Cheville',
}

interface ExerciseBlockProps {
  exercise: WorkoutExercise
  series: WorkoutSeries[]
  previousSeries?: WorkoutSeries[]
  painNotes?: PainNote[]
  onAddSeries: () => void
  onUpdateSeries: (seriesIndex: number, data: Partial<WorkoutSeries>) => void
  onDeleteSeries: (seriesIndex: number) => void
  onCompleteSeries: (seriesIndex: number) => void
  onAddPainNote?: (data: Omit<PainNote, 'id' | 'userId' | 'sessionId' | 'exerciseId' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>) => void | Promise<void>
  onRemovePainNote?: (painNoteId: string) => void | Promise<void>
  onRemoveExercise?: () => void
}

export function ExerciseBlock({
  exercise,
  series,
  previousSeries = [],
  painNotes = [],
  onAddSeries,
  onUpdateSeries,
  onDeleteSeries,
  onCompleteSeries,
  onAddPainNote,
  onRemovePainNote,
  onRemoveExercise,
}: ExerciseBlockProps) {
  const [showPrevious, setShowPrevious] = useState(false)
  const [showPainNotes, setShowPainNotes] = useState(false)
  const [painNoteDialogOpen, setPainNoteDialogOpen] = useState(false)

  // Vérifier s'il y a des douleurs fortes (> 7)
  const hasStrongPain = painNotes.some((note) => note.intensity > 7)

  const handleAddPainNote = async (data: {
    zone: PainNote['zone']
    intensity: number
    note?: string
  }) => {
    if (onAddPainNote) {
      await onAddPainNote(data)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">{exercise.name}</h2>
              {hasStrongPain && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Douleur
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onAddPainNote && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPainNoteDialogOpen(true)}
                aria-label="Noter une douleur"
                className="text-warning hover:text-warning"
              >
                <AlertCircle className="h-5 w-5" />
              </Button>
            )}
            {onRemoveExercise && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemoveExercise}
                aria-label="Retirer l'exercice"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Badge variant="secondary">
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Liste des séries actuelles */}
        <div
          className={cn(
            'space-y-2',
            series.length > 5 && 'max-h-[60vh] overflow-y-auto',
          )}
        >
          {series.map((s, index) => (
            <SeriesRow
              key={s.id}
              series={s}
              seriesNumber={index + 1}
              onUpdate={(data) => onUpdateSeries(index, data)}
              onComplete={() => onCompleteSeries(index)}
              onDelete={() => onDeleteSeries(index)}
            />
          ))}
        </div>

        {/* Bouton ajouter une série */}
        <Button
          type="button"
          variant="outline"
          onClick={onAddSeries}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une série
        </Button>

        {/* Séries précédentes */}
        {previousSeries.length > 0 && (
          <Collapsible open={showPrevious} onOpenChange={setShowPrevious}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between"
              >
                <span className="text-sm text-muted-foreground">
                  Voir séries précédentes ({previousSeries.length})
                </span>
                {showPrevious ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-2">
              {previousSeries.map((s, index) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm"
                >
                  <Badge variant="outline" className="min-w-8 justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex flex-1 gap-4">
                    <span>
                      {s.reps} reps
                    </span>
                    {s.weight && (
                      <span className="text-muted-foreground">
                        {s.weight} kg
                      </span>
                    )}
                    {s.restTime && (
                      <span className="text-muted-foreground">
                        {s.restTime}s repos
                      </span>
                    )}
                    {s.rpe && (
                      <span className="text-muted-foreground">RPE {s.rpe}</span>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Notes de douleur */}
        {painNotes.length > 0 && (
          <Collapsible open={showPainNotes} onOpenChange={setShowPainNotes}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between"
              >
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Notes de douleur ({painNotes.length})
                </span>
                {showPainNotes ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-2">
              {painNotes.map((painNote) => (
                <div
                  key={painNote.id}
                  className={cn(
                    'flex items-start justify-between gap-3 rounded-lg border p-3 text-sm',
                    painNote.intensity > 7 && 'border-destructive/50 bg-destructive/5',
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={painNote.intensity > 7 ? 'destructive' : 'secondary'}>
                        {PAIN_ZONE_LABELS[painNote.zone]}
                      </Badge>
                      <span className="font-medium">
                        Intensité: {painNote.intensity}/10
                      </span>
                    </div>
                    {painNote.note && (
                      <p className="text-muted-foreground">{painNote.note}</p>
                    )}
                  </div>
                  {onRemovePainNote && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemovePainNote(painNote.id)}
                      aria-label="Supprimer la note"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>

      {/* Dialog pour ajouter une note de douleur */}
      {onAddPainNote && (
        <PainNoteForm
          open={painNoteDialogOpen}
          onOpenChange={setPainNoteDialogOpen}
          onSubmit={handleAddPainNote}
        />
      )}
    </Card>
  )
}
