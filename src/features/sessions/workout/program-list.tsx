import { useLiveQuery } from 'dexie-react-hooks'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import type { WorkoutProgram } from '@/schemas/workout-program.schema'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, Eye, Pencil, Trash2 } from 'lucide-react'

interface ProgramListProps {
  onView: (program: WorkoutProgram) => void
  onEdit: (program: WorkoutProgram) => void
  onDelete: (program: WorkoutProgram) => void
}

/**
 * Liste des programmes d'entraînement triés alphabétiquement.
 * Respecte AC1: "programmes triés alphabétiquement par nom".
 * Respecte AC1: "état vide avec CTA".
 * Utilise useLiveQuery pour réactivité automatique (GOTCHA #8).
 * Story 3.2 : Programmes et séances-types
 */
export function ProgramList({ onView, onEdit, onDelete }: ProgramListProps) {
  const programs = useLiveQuery(() => workoutProgramRepository.getAllSorted(), [])

  if (!programs) {
    return <div>Chargement...</div>
  }

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun programme</h3>
        <p className="text-muted-foreground mb-4">
          Créez votre premier programme pour structurer vos entraînements
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {programs.map((program) => (
        <Card key={program.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{program.name}</h3>
              {program.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {program.description}
                </p>
              )}
              {/* TODO: Badge nombre séances-types (AC1) - nécessite count depuis repository */}
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="ghost" size="icon" onClick={() => onView(program)} aria-label="Voir le détail">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(program)} aria-label="Modifier">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(program)} aria-label="Supprimer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
