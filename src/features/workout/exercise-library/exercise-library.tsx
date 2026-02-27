import { useLiveQuery } from 'dexie-react-hooks'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/schemas/workout-exercise.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

  const exercises = useLiveQuery(
    async () => workoutExerciseRepository.getAllSorted(),
    []
  )

  const filteredExercises = useMemo(() => {
    if (!exercises) return []
    let filtered = exercises
    if (selectedGroup !== 'all') {
      filtered = filtered.filter((ex) => ex.muscleGroup === selectedGroup)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(query))
    }
    return filtered
  }, [exercises, selectedGroup, searchQuery])

  if (!exercises) {
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
      {/* Filtres */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={selectedGroup} onValueChange={(v) => setSelectedGroup(v as MuscleGroup | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les groupes</SelectItem>
            {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Résultats */}
      {filteredExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            {exercises.length === 0 ? 'Bibliothèque vide' : 'Aucun résultat'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {exercises.length === 0
              ? 'Créez votre premier exercice.'
              : 'Essayez de modifier les filtres.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filteredExercises.length} exercice{filteredExercises.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{exercise.name}</p>
                    <Badge variant="outline" className="mt-1.5 text-xs">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                    </Badge>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(exercise.id)} aria-label="Modifier">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(exercise.id)} aria-label="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
