import { useState } from 'react'
import { ExerciseLibrary } from './exercise-library'
import { ExerciseForm } from './exercise-form'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUndo } from '@/hooks/use-undo'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { Plus } from 'lucide-react'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'

type FormMode = 'create' | 'edit'

export function ExerciseLibraryPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)

  const { withUndo } = useUndo()

  const handleCreateNew = () => {
    setFormMode('create')
    setEditingExercise(null)
    setSheetOpen(true)
  }

  const handleEdit = async (exerciseId: string) => {
    const exercise = await workoutExerciseRepository.getById(exerciseId)
    if (exercise) {
      setFormMode('edit')
      setEditingExercise(exercise)
      setSheetOpen(true)
    }
  }

  const handleDeleteRequest = (exerciseId: string) => {
    setDeletingExerciseId(exerciseId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingExerciseId) return
    const exercise = await workoutExerciseRepository.getById(deletingExerciseId)
    if (!exercise) return
    await withUndo(
      `Exercice "${exercise.name}" supprimé`,
      async () => { await workoutExerciseRepository.softDelete(deletingExerciseId) },
      async () => { await workoutExerciseRepository.restore(deletingExerciseId) }
    )
    setDeleteDialogOpen(false)
    setDeletingExerciseId(null)
  }

  const handleFormSuccess = async (data: any) => {
    if (formMode === 'edit' && editingExercise) {
      const oldData = {
        name: editingExercise.name,
        muscleGroup: editingExercise.muscleGroup,
        description: editingExercise.description,
      }
      await withUndo(
        `Exercice "${editingExercise.name}" modifié`,
        async () => { await workoutExerciseRepository.update(editingExercise.id, data) },
        async () => { await workoutExerciseRepository.update(editingExercise.id, oldData) }
      )
    }
    setSheetOpen(false)
    setEditingExercise(null)
  }

  const handleFormCancel = () => {
    setSheetOpen(false)
    setEditingExercise(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Bibliothèque d'exercices</h1>
        <Button onClick={handleCreateNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel exercice
        </Button>
      </div>

      <ExerciseLibrary onEdit={handleEdit} onDelete={handleDeleteRequest} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {formMode === 'create' ? 'Nouvel exercice' : "Modifier l'exercice"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ExerciseForm
              mode={formMode}
              initialData={editingExercise || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Supprimer cet exercice ?"
        description="Cette action peut être annulée via le bouton Annuler qui apparaîtra."
        confirmLabel="Supprimer"
        variant="destructive"
      />
    </div>
  )
}
