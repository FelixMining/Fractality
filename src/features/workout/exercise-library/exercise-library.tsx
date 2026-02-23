import { useLiveQuery } from 'dexie-react-hooks'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/schemas/workout-exercise.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Trash2, Dumbbell, Search, X } from 'lucide-react'
import { useState, useMemo } from 'react'

interface ExerciseLibraryProps {
  onEdit?: (exerciseId: string) => void
  onDelete?: (exerciseId: string) => void
}

export function ExerciseLibrary({ onEdit, onDelete }: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all')

  // Charger tous les exercices triés
  const exercises = useLiveQuery(
    async () => workoutExerciseRepository.getAllSorted(),
    []
  )

  // Filtrer les exercices selon les critères
  const filteredExercises = useMemo(() => {
    if (!exercises) return []

    let filtered = exercises

    // Filtre par groupe musculaire
    if (selectedGroup !== 'all') {
      filtered = filtered.filter((ex) => ex.muscleGroup === selectedGroup)
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(query))
    }

    return filtered
  }, [exercises, selectedGroup, searchQuery])

  if (!exercises) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="space-y-4">
        {/* Recherche */}
        <div className="relative space-y-2">
          <Label htmlFor="search">Rechercher un exercice</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom de l'exercice..."
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filtre groupe musculaire */}
        <div className="space-y-2">
          <Label htmlFor="muscleGroup">Groupe musculaire</Label>
          <Select
            value={selectedGroup}
            onValueChange={(value) => setSelectedGroup(value as MuscleGroup | 'all')}
          >
            <SelectTrigger id="muscleGroup">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Résultats */}
      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          {filteredExercises.length} exercice{filteredExercises.length > 1 ? 's' : ''}
        </p>

        {filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12">
            <Dumbbell className="size-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {exercises.length === 0
                  ? 'Aucun exercice dans la bibliothèque'
                  : 'Aucun exercice ne correspond aux filtres'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {exercises.length === 0
                  ? 'Créez votre premier exercice pour commencer.'
                  : 'Essayez de modifier les critères de recherche.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Nom et groupe musculaire */}
                    <div>
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                      </Badge>
                    </div>

                    {/* Description */}
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {exercise.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(exercise.id)}
                        title="Modifier"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(exercise.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
