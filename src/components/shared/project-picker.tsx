import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { projectRepository } from '@/lib/db/repositories/project.repository'
import type { Project } from '@/schemas/project.schema'
import { ChevronDown, Check } from 'lucide-react'

interface ProjectPickerProps {
  value: string | null
  onChange: (projectId: string | null) => void
  excludeId?: string
  placeholder?: string
}

export function ProjectPicker({
  value,
  onChange,
  excludeId,
  placeholder = 'Aucun projet',
}: ProjectPickerProps) {
  // H1: useLiveQuery pour réactivité live (mise à jour si projet créé/supprimé)
  const allProjects = useLiveQuery(() => projectRepository.getTree(), []) ?? []
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // H2: filtrer projets supprimés + projets exclus + descendants
  const availableProjects = allProjects.filter((p) => {
    if (p.isDeleted) return false
    if (excludeId && (p.id === excludeId || isDescendantOf(p, excludeId, allProjects))) {
      return false
    }
    return true
  })

  // Filtrer par recherche
  const filteredProjects = searchQuery
    ? availableProjects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableProjects

  // Trouver le projet sélectionné
  const selectedProject = allProjects.find((p) => p.id === value)

  // Organiser en arbre hiérarchique
  const rootProjects = filteredProjects.filter((p) => !p.parentId)

  const handleSelect = (projectId: string | null) => {
    onChange(projectId)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-left hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          {selectedProject ? (
            <>
              <div
                className="h-3 w-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: selectedProject.color }}
              />
              <span>{selectedProject.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop pour fermer au clic */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-background shadow-lg">
            {/* Search bar si >10 projets */}
            {availableProjects.length > 10 && (
              <div className="border-b border-border p-2">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:border-primary focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Options */}
            <div className="max-h-64 overflow-y-auto p-1">
              {/* Option "Aucun projet" */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent"
              >
                <span className="text-muted-foreground">{placeholder}</span>
                {value === null && <Check className="h-4 w-4 text-primary" />}
              </button>

              {/* Projets hiérarchiques */}
              {rootProjects.map((root) => (
                <ProjectPickerNode
                  key={root.id}
                  project={root}
                  level={0}
                  selectedId={value}
                  onSelect={handleSelect}
                  allProjects={filteredProjects}
                />
              ))}

              {filteredProjects.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Aucun projet trouvé
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface ProjectPickerNodeProps {
  project: Project
  level: number
  selectedId: string | null
  onSelect: (projectId: string) => void
  allProjects: Project[]
}

function ProjectPickerNode({
  project,
  level,
  selectedId,
  onSelect,
  allProjects,
}: ProjectPickerNodeProps) {
  const children = allProjects.filter((p) => p.parentId === project.id)
  const isSelected = selectedId === project.id

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent"
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: project.color }}
          />
          <span className="truncate">{project.name}</span>
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </button>

      {/* Render children */}
      {children.map((child) => (
        <ProjectPickerNode
          key={child.id}
          project={child}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          allProjects={allProjects}
        />
      ))}
    </>
  )
}

/**
 * Vérifie si un projet est un descendant d'un ancêtre donné.
 */
function isDescendantOf(
  project: Project,
  ancestorId: string,
  allProjects: Project[]
): boolean {
  if (!project.parentId) return false
  if (project.parentId === ancestorId) return true

  const parent = allProjects.find((p) => p.id === project.parentId)
  return parent ? isDescendantOf(parent, ancestorId, allProjects) : false
}
