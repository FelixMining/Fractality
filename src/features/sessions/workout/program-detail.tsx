import { useLiveQuery } from 'dexie-react-hooks'
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
import { Calendar, Pencil, Plus, Trash2, X } from 'lucide-react'
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
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{program.name}</h1>
        {program.description && (
          <p className="text-muted-foreground mt-2">{program.description}</p>
        )}
        <div className="flex gap-2 mt-4">
          <Button onClick={onAddSession}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une séance-type
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Séances-types */}
      {templatesWithExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune séance-type</h3>
          <p className="text-muted-foreground mb-4">
            Ajoutez votre première séance-type pour structurer ce programme
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {templatesWithExercises.map(({ template, exercises }) => (
            <AccordionItem key={template.id} value={template.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  <Badge variant="secondary">{exercises.length} exercices</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
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
                        onClick={() => onDeleteSession(template.id)}
                        aria-label="Retirer exercice"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
