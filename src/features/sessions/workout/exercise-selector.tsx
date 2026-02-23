import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import {
  MUSCLE_GROUP_LABELS,
  muscleGroupEnum,
  type MuscleGroup,
  type WorkoutExercise,
} from '@/schemas/workout-exercise.schema'
import type { SelectedExercise } from './session-template-form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Dumbbell } from 'lucide-react'

interface ExerciseSelectorProps {
  selectedExercises: SelectedExercise[]
  onSelectionChange: (selected: SelectedExercise[]) => void
}

/**
 * Sélecteur d'exercices avec filtres et configuration inline.
 * Respecte AC3: "recherche par nom, filtre groupe musculaire, config séries/reps/charge".
 * GOTCHA #7: defaultSets requis, defaultReps/defaultWeight optionnels.
 * GOTCHA #12: Poids par 0.5kg avec step="0.5".
 * Story 3.2 : Programmes et séances-types
 */
export function ExerciseSelector({
  selectedExercises,
  onSelectionChange,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('all')

  // Charger tous les exercices avec useLiveQuery
  const exercises = useLiveQuery(() => workoutExerciseRepository.getAll(), [])

  // Filtrer les exercices par recherche et groupe musculaire
  const filteredExercises = useMemo(() => {
    if (!exercises) return []

    return exercises.filter((exercise) => {
      const matchesSearch =
        !searchQuery ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGroup =
        muscleGroupFilter === 'all' || exercise.muscleGroup === muscleGroupFilter

      return matchesSearch && matchesGroup
    })
  }, [exercises, searchQuery, muscleGroupFilter])

  // Vérifier si un exercice est sélectionné
  const isExerciseSelected = (exerciseId: string) => {
    return selectedExercises.some((se) => se.exercise.id === exerciseId)
  }

  // Récupérer la config d'un exercice sélectionné
  const getExerciseConfig = (exerciseId: string): SelectedExercise | undefined => {
    return selectedExercises.find((se) => se.exercise.id === exerciseId)
  }

  // Toggle sélection d'un exercice
  const handleToggleExercise = (exercise: WorkoutExercise, checked: boolean) => {
    if (checked) {
      // Ajouter avec config par défaut
      onSelectionChange([
        ...selectedExercises,
        {
          exercise,
          defaultSets: 3, // Valeur par défaut
          defaultReps: undefined,
          defaultWeight: undefined,
        },
      ])
    } else {
      // Retirer
      onSelectionChange(
        selectedExercises.filter((se) => se.exercise.id !== exercise.id)
      )
    }
  }

  // Mettre à jour la config d'un exercice
  const handleUpdateConfig = (
    exerciseId: string,
    field: 'defaultSets' | 'defaultReps' | 'defaultWeight',
    value: number | undefined
  ) => {
    onSelectionChange(
      selectedExercises.map((se) => {
        if (se.exercise.id === exerciseId) {
          return { ...se, [field]: value }
        }
        return se
      })
    )
  }

  // EmptyState si aucun exercice dans la bibliothèque
  if (!exercises || exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
        <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Bibliothèque vide</h3>
        <p className="text-muted-foreground">
          Créez des exercices d'abord pour les ajouter à une séance-type
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un exercice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtre groupe musculaire */}
        <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tous les groupes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les groupes</SelectItem>
            {muscleGroupEnum.options.map((group) => (
              <SelectItem key={group} value={group}>
                {MUSCLE_GROUP_LABELS[group as MuscleGroup]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste scrollable d'exercices */}
      <div className="border rounded-lg max-h-[400px] overflow-y-auto">
        {filteredExercises.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucun exercice trouvé
          </div>
        ) : (
          <div className="divide-y">
            {filteredExercises.map((exercise) => {
              const isSelected = isExerciseSelected(exercise.id)
              const config = getExerciseConfig(exercise.id)

              return (
                <div key={exercise.id} className="p-4 space-y-3">
                  {/* Ligne principale: Checkbox + nom + badge */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`exercise-${exercise.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked: boolean) =>
                        handleToggleExercise(exercise, checked)
                      }
                    />
                    <Label
                      htmlFor={`exercise-${exercise.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium">{exercise.name}</span>
                    </Label>
                    <Badge variant="outline">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                    </Badge>
                  </div>

                  {/* Configuration inline si sélectionné */}
                  {isSelected && config && (
                    <div className="pl-7 grid grid-cols-3 gap-2">
                      {/* Séries (requis) */}
                      <div>
                        <Label
                          htmlFor={`sets-${exercise.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Séries *
                        </Label>
                        <Input
                          id={`sets-${exercise.id}`}
                          type="number"
                          min={1}
                          max={10}
                          value={config.defaultSets}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10)
                            if (!isNaN(value) && value >= 1 && value <= 10) {
                              handleUpdateConfig(exercise.id, 'defaultSets', value)
                            }
                          }}
                          className="mt-1"
                        />
                      </div>

                      {/* Reps (optionnel) */}
                      <div>
                        <Label
                          htmlFor={`reps-${exercise.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Reps
                        </Label>
                        <Input
                          id={`reps-${exercise.id}`}
                          type="number"
                          min={1}
                          max={100}
                          placeholder="Non défini"
                          value={config.defaultReps ?? ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10)
                            handleUpdateConfig(
                              exercise.id,
                              'defaultReps',
                              isNaN(value) ? undefined : value
                            )
                          }}
                          className="mt-1"
                        />
                      </div>

                      {/* Charge (optionnel, step 0.5) */}
                      <div>
                        <Label
                          htmlFor={`weight-${exercise.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Charge (kg)
                        </Label>
                        <Input
                          id={`weight-${exercise.id}`}
                          type="number"
                          step="0.5"
                          min={0}
                          max={500}
                          placeholder="Non défini"
                          value={config.defaultWeight ?? ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            handleUpdateConfig(
                              exercise.id,
                              'defaultWeight',
                              isNaN(value) ? undefined : value
                            )
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Compteur d'exercices sélectionnés */}
      {selectedExercises.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {selectedExercises.length} exercice{selectedExercises.length > 1 ? 's' : ''}{' '}
          sélectionné{selectedExercises.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
