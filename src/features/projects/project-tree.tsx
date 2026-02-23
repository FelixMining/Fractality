import { useState } from 'react'
import type { Project } from '@/schemas/project.schema'
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react'

interface ProjectTreeProps {
  projects: Project[]
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}

interface ProjectTreeNodeProps {
  project: Project
  level: number
  children: Project[]
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  allProjects: Project[]
}

function ProjectTreeNode({
  project,
  level,
  children,
  onEdit,
  onDelete,
  allProjects,
}: ProjectTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showActions, setShowActions] = useState(false)

  const hasChildren = children.length > 0

  const handleDelete = () => {
    onDelete(project.id)
  }

  return (
    <div>
      <div
        className="group relative flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
        style={{ marginLeft: `${level * 24}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/Collapse chevron */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="h-4 w-4 flex-shrink-0" />
        )}

        {/* Color indicator */}
        <div
          className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: project.color }}
        />

        {/* Project name */}
        <span className="flex-1 truncate font-medium">{project.name}</span>

        {/* Actions (desktop) */}
        {showActions && (
          <div className="hidden gap-1 md:flex">
            <button
              onClick={() => onEdit(project)}
              className="rounded p-1 hover:bg-background"
              aria-label="Modifier"
            >
              <Edit className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded p-1 hover:bg-background"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile swipe actions - placeholder for now */}
      {/* TODO: Implement swipe gestures for mobile in future enhancement */}

      {/* Render children recursively */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <ProjectTreeNode
              key={child.id}
              project={child}
              level={level + 1}
              children={allProjects.filter((p) => p.parentId === child.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              allProjects={allProjects}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProjectTree({ projects, onEdit, onDelete }: ProjectTreeProps) {
  // Get root projects (no parent)
  const rootProjects = projects.filter((p) => !p.parentId)

  if (projects.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      {rootProjects.map((root) => (
        <ProjectTreeNode
          key={root.id}
          project={root}
          level={0}
          children={projects.filter((p) => p.parentId === root.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          allProjects={projects}
        />
      ))}
    </div>
  )
}
