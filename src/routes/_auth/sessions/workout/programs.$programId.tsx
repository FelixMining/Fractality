import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
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

  // État pour ConfirmDialog de suppression programme
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    type: 'program' | 'session'
    id: string
    name: string
  }>({ open: false, type: 'program', id: '', name: '' })

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
      type: 'program',
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

  // Handlers pour suppression séance-type
  const handleDeleteSession = async (templateId: string) => {
    const template = await workoutSessionTemplateRepository.getById(templateId)
    if (template) {
      setDeleteConfirm({
        open: true,
        type: 'session',
        id: templateId,
        name: template.name,
      })
    }
  }

  // Confirmation suppression
  const handleConfirmDelete = async () => {
    const { type, id, name } = deleteConfirm

    try {
      if (type === 'program') {
        // Suppression programme avec cascade delete
        // FIX #7: Utilise restoreProgram avec cascade restore pour le undo
        await withUndo(
          `Programme "${name}" supprimé`,
          async () => {
            await workoutProgramRepository.deleteProgram(id)
            // Rediriger vers la liste après suppression
            navigate({ to: '/sessions/workout/programs' })
          },
          async () => {
            await workoutProgramRepository.restoreProgram(id)
          }
        )
      } else {
        // Suppression séance-type
        await withUndo(
          `Séance "${name}" supprimée`,
          async () => {
            await workoutSessionTemplateRepository.softDelete(id)
          },
          async () => {
            await workoutSessionTemplateRepository.restore(id)
          }
        )
      }
      setDeleteConfirm({ open: false, type: 'program', id: '', name: '' })
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirm({ open: false, type: 'program', id: '', name: '' })
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

      {/* ConfirmDialog pour suppression */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && handleCancelDelete()}
        title={
          deleteConfirm.type === 'program'
            ? 'Supprimer le programme'
            : 'Supprimer la séance-type'
        }
        description={
          deleteConfirm.type === 'program'
            ? `Êtes-vous sûr de vouloir supprimer le programme "${deleteConfirm.name}" ? Toutes ses séances-types seront également supprimées.`
            : `Êtes-vous sûr de vouloir supprimer la séance-type "${deleteConfirm.name}" ?`
        }
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
