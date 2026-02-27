import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import { workoutSessionTemplateRepository } from '@/lib/db/repositories/workout-session-template.repository'
import type { WorkoutProgram } from '@/schemas/workout-program.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Calendar, Pencil, Play, Plus, Trash2, X } from 'lucide-react'
import { MUSCLE_GROUP_LABELS } from '@/schemas/workout-exercise.schema'

interface ProgramDetailProps {
  program: WorkoutProgram
  onEdit: () => void
  onDelete: () => void
  onAddSession: () => void
  onDeleteSession: (templateId: string) => void
}

/**
 * Vue détail d'un programme avec ses séances-types en Accordion.
 * Respecte AC4: "nom, description, liste séances-types, développer pour voir exercices".
 * Utilise Accordion shadcn/ui (GOTCHA #11).
 * Story 3.2 : Programmes et séances-types
 */
export function ProgramDetail({
  program,
  onEdit,
  onDelete,
  onAddSession,
  onDeleteSession,
}: ProgramDetailProps) {
  const navigate = useNavigate()

  const templates = useLiveQuery(
    () => workoutProgramRepository.getSessionTemplates(program.id),
    [program.id]
  )

  // Charger les exercices pour chaque template
  const templatesWithExercises = useLiveQuery(async () => {
    if (!templates) return []

    return Promise.all(
      templates.map(async (template) => {
        const exercises = await workoutSessionTemplateRepository.getTemplateExercises(template.id)
        return { template, exercises }
      })
    )
  }, [templates])

  if (!templatesWithExercises) {
    return (
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded-xl bg-card" />
        <div className="h-16 animate-pulse rounded-xl bg-card" />
        <div className="h-16 animate-pulse rounded-xl bg-card" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">{program.name}</h1>
          {program.description && (
            <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Modifier">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Supprimer">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button size="sm" onClick={onAddSession} className="self-start">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une séance-type
      </Button>

      {/* Séances-types */}
      {templatesWithExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Aucune séance-type</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoutez votre première séance-type.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {templatesWithExercises.map(({ template, exercises }) => (
            <AccordionItem key={template.id} value={template.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  <Badge variant="secondary">{exercises.length} exercice{exercises.length !== 1 ? 's' : ''}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 pb-1">
                  {exercises.map(({ templateExercise, exercise }) => (
                    <div
                      key={templateExercise.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                          </Badge>
                          <span>
                            {templateExercise.defaultSets} séries
                            {templateExercise.defaultReps && ` × ${templateExercise.defaultReps} reps`}
                            {templateExercise.defaultWeight && ` @ ${templateExercise.defaultWeight}kg`}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteSession(templateExercise.id)}
                        aria-label="Retirer l'exercice"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Bouton lancer la séance */}
                  <Button
                    className="w-full mt-3"
                    onClick={() =>
                      void navigate({
                        to: '/sessions/workout/live/$sessionTemplateId',
                        params: { sessionTemplateId: template.id },
                      })
                    }
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Lancer la séance
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
