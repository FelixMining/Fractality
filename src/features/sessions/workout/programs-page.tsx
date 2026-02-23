import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import type { WorkoutProgram } from '@/schemas/workout-program.schema'
import { ProgramList } from './program-list'
import { ProgramForm } from './program-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Plus } from 'lucide-react'

/**
 * Page principale de gestion des programmes d'entraînement.
 * Respecte AC1: "liste triée alphabétiquement avec bouton création".
 * Utilise Sheet pour affichage formulaire (AC 10.3).
 * Intègre ConfirmDialog + useUndo pour suppression (AC 10.4, 10.5).
 * Story 3.2 : Programmes et séances-types
 */
export function ProgramsPage() {
  const navigate = useNavigate()
  const { withUndo } = useUndo()

  // État local pour formulaire
  const [showForm, setShowForm] = useState(false)
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null)

  // État pour ConfirmDialog de suppression
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    programId: string
    programName: string
  }>({ open: false, programId: '', programName: '' })

  // Handlers pour création
  const handleCreateClick = () => {
    setEditingProgram(null)
    setShowForm(true)
  }

  // Handlers pour édition
  const handleEdit = (program: WorkoutProgram) => {
    setEditingProgram(program)
    setShowForm(true)
  }

  // Handlers pour vue détail
  const handleView = (program: WorkoutProgram) => {
    navigate({
      to: '/sessions/workout/programs/$programId',
      params: { programId: program.id },
    })
  }

  // Handlers pour suppression
  const handleDelete = (program: WorkoutProgram) => {
    setDeleteConfirm({
      open: true,
      programId: program.id,
      programName: program.name,
    })
  }

  const handleConfirmDelete = async () => {
    const { programId, programName } = deleteConfirm
    try {
      // GOTCHA #2: Utilise deleteProgram avec cascade delete
      // FIX #7: Utilise restoreProgram avec cascade restore pour le undo
      await withUndo(
        `Programme "${programName}" supprimé`,
        async () => {
          await workoutProgramRepository.deleteProgram(programId)
        },
        async () => {
          await workoutProgramRepository.restoreProgram(programId)
        }
      )
      setDeleteConfirm({ open: false, programId: '', programName: '' })
    } catch (error) {
      console.error('Error deleting program:', error)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirm({ open: false, programId: '', programName: '' })
  }

  // Handlers pour formulaire
  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProgram(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Mes programmes</h1>
          <Button onClick={handleCreateClick} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Créer un programme
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        <ProgramList onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
      </main>

      {/* Sheet pour formulaire création/édition */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingProgram ? 'Modifier le programme' : 'Nouveau programme'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProgramForm initialData={editingProgram || undefined} onSuccess={handleFormSuccess} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ConfirmDialog pour suppression */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && handleCancelDelete()}
        title="Supprimer le programme"
        description={`Êtes-vous sûr de vouloir supprimer le programme "${deleteConfirm.programName}" ? Toutes ses séances-types seront également supprimées.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  )
}
