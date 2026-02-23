import { useState, useEffect } from 'react'
import { projectRepository } from '@/lib/db/repositories/project.repository'
import type { Project } from '@/schemas/project.schema'
import { ProjectTree } from './project-tree'
import { ProjectForm } from './project-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUndo } from '@/hooks/use-undo'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { withUndo } = useUndo()

  // State pour le ConfirmDialog de suppression
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    projectId: string
    projectName: string
  }>({ open: false, projectId: '', projectName: '' })

  const loadProjects = async () => {
    try {
      const allProjects = await projectRepository.getTree()
      setProjects(allProjects)
      setError(null)
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Impossible de charger les projets')
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreateClick = () => {
    setEditingProject(null)
    setShowForm(true)
  }

  const handleEditClick = (project: Project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDeleteClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    setDeleteConfirm({
      open: true,
      projectId,
      projectName: project?.name || '',
    })
  }

  const handleConfirmDelete = async () => {
    const { projectId, projectName } = deleteConfirm
    try {
      await withUndo(
        `Projet "${projectName}" supprimé`,
        async () => {
          await projectRepository.softDelete(projectId)
          await loadProjects()
        },
        async () => {
          await projectRepository.restore(projectId)
          await loadProjects()
        },
      )
    } catch (err) {
      console.error('Error deleting project:', err)
      setError('Impossible de supprimer le projet')
    }
  }

  const handleFormSuccess = async () => {
    setShowForm(false)
    setEditingProject(null)
    await loadProjects()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProject(null)
  }

  const isEmpty = projects.length === 0

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projets</h1>
          {!isEmpty && (
            <button
              onClick={handleCreateClick}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Nouveau projet
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-500">
            {error}
          </div>
        )}
        {isEmpty && !showForm ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 text-6xl opacity-20">📁</div>
            <h2 className="mb-2 text-lg font-medium text-foreground">
              Aucun projet pour l'instant
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Organisez vos entrées en créant votre premier projet
            </p>
            <button
              onClick={handleCreateClick}
              className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Créer mon premier projet
            </button>
          </div>
        ) : showForm ? (
          <ProjectForm
            project={editingProject}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        ) : (
          <ProjectTree
            projects={projects}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </main>

      {/* ConfirmDialog pour la suppression */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((s) => ({ ...s, open }))}
        title={`Supprimer "${deleteConfirm.projectName}" ?`}
        description="Ce projet sera déplacé dans la corbeille. Vous pourrez le restaurer depuis la page Corbeille."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
