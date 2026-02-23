import { useState, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import {
  MUSCLE_GROUP_LABELS,
  type WorkoutExercise,
} from '@/schemas/workout-exercise.schema'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Dumbbell } from 'lucide-react'

interface ExerciseSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (exercise: WorkoutExercise) => void
}

/**
 * Dialog de recherche d'exercice pour ajout spontané à une séance en cours.
 * Respecte AC1: "ajouter exercice spontané depuis bibliothèque".
 * Story 3.4 : Personnalisation spontanée et notes de douleur
 */
export function ExerciseSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: ExerciseSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Charger tous les exercices avec useLiveQuery
  const exercises = useLiveQuery(() => workoutExerciseRepository.getAll(), [])

  // Filtrer les exercices par recherche (nom + groupe musculaire)
  const filteredExercises = useMemo(() => {
    if (!exercises) return []

    if (!searchQuery) return exercises

    const query = searchQuery.toLowerCase()

    return exercises.filter((exercise) => {
      const matchesName = exercise.name.toLowerCase().includes(query)
      const matchesGroup = MUSCLE_GROUP_LABELS[exercise.muscleGroup]
        ?.toLowerCase()
        .includes(query)

      return matchesName || matchesGroup
    })
  }, [exercises, searchQuery])

  // Focus automatique sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (open) {
      setSearchQuery('')
      // Focus sera géré par autoFocus sur l'Input
    }
  }, [open])

  // Sélectionner un exercice et fermer le dialog
  const handleSelectExercise = (exercise: WorkoutExercise) => {
    onSelect(exercise)
    onOpenChange(false)
  }

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent, exercise: WorkoutExercise) => {
    if (e.key === 'Enter') {
      handleSelectExercise(exercise)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Ajouter un exercice
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Rechercher un exercice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto px-6 pb-6">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun exercice trouvé</p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelectExercise(exercise)}
                  onKeyDown={(e) => handleKeyDown(e, exercise)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      {exercise.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {exercise.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
