import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import { db } from '@/lib/db/database'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import { workoutSessionTemplateRepository } from '@/lib/db/repositories/workout-session-template.repository'
import { ProgramDetail } from '@/features/sessions/workout/program-detail'
import { ProgramForm } from '@/features/sessions/workout/program-form'
import { SessionTemplateForm } from '@/features/sessions/workout/session-template-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUndo } from '@/hooks/use-undo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

/**
 * Page détail d'un programme avec ses séances-types.
 * URL: /sessions/workout/programs/{programId}
 * Respecte AC4: "consultation programme et liste séances-types".
 * Respecte AC5: "modification et suppression programme/séance".
 * Story 3.2 : Programmes et séances-types
 */
function ProgramDetailRoute() {
  const params = Route.useParams() as { programId: string }
  const { programId } = params
  const navigate = useNavigate()
  const { withUndo } = useUndo()

  // État local pour formulaires
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddSessionForm, setShowAddSessionForm] = useState(false)

  // État pour ConfirmDialog de suppression programme uniquement
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: '', name: '' })

  // Charger le programme avec useLiveQuery
  const program = useLiveQuery(
    () => workoutProgramRepository.getById(programId),
    [programId]
  )

  if (!program) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Programme introuvable</h2>
          <p className="text-muted-foreground">Ce programme n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    )
  }

  // Handlers pour édition programme
  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
  }

  // Handlers pour suppression programme
  const handleDelete = () => {
    setDeleteConfirm({
      open: true,
      id: program.id,
      name: program.name,
    })
  }

  // Handlers pour ajout séance-type
  const handleAddSession = () => {
    setShowAddSessionForm(true)
  }

  const handleAddSessionSuccess = () => {
    setShowAddSessionForm(false)
  }

  // Retrait d'un exercice d'une séance-type (pas de confirm dialog — undoable)
  const handleDeleteSession = async (templateExerciseId: string) => {
    await withUndo(
      'Exercice retiré de la séance',
      async () => {
        await workoutSessionTemplateRepository.removeExercise(templateExerciseId)
      },
      async () => {
        await db.workout_template_exercises.update(templateExerciseId, {
          isDeleted: false,
          deletedAt: null,
        })
      }
    )
  }

  // Confirmation suppression programme
  const handleConfirmDelete = async () => {
    const { id, name } = deleteConfirm
    try {
      await withUndo(
        `Programme "${name}" supprimé`,
        async () => {
          await workoutProgramRepository.deleteProgram(id)
          navigate({ to: '/sessions/workout/programs' })
        },
        async () => {
          await workoutProgramRepository.restoreProgram(id)
        }
      )
      setDeleteConfirm({ open: false, id: '', name: '' })
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirm({ open: false, id: '', name: '' })
  }

  return (
    <>
      <ProgramDetail
        program={program}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddSession={handleAddSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Sheet pour édition programme */}
      <Sheet open={showEditForm} onOpenChange={setShowEditForm}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Modifier le programme</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProgramForm initialData={program} onSuccess={handleEditSuccess} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet pour ajout séance-type */}
      <Sheet open={showAddSessionForm} onOpenChange={setShowAddSessionForm}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouvelle séance-type</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SessionTemplateForm programId={program.id} onSuccess={handleAddSessionSuccess} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ConfirmDialog pour suppression programme */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && handleCancelDelete()}
        title="Supprimer le programme"
        description={`Êtes-vous sûr de vouloir supprimer le programme "${deleteConfirm.name}" ? Toutes ses séances-types seront également supprimées.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </>
  )
}

export const Route = createFileRoute('/_auth/sessions/workout/programs/$programId')({
  component: () => <ProgramDetailRoute />,
})
