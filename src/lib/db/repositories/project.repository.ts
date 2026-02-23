import { db } from '@/lib/db/database'
import { BaseRepository } from './base.repository'
import { projectSchema, type Project } from '@/schemas/project.schema'

class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super(db.projects, projectSchema, 'projects')
  }

  /**
   * Vérifie qu'il n'y a pas de référence circulaire dans la hiérarchie.
   * @throws Error si une boucle est détectée
   */
  private async validateNoCircularReference(
    projectId: string,
    parentId: string | null
  ): Promise<void> {
    if (!parentId) return

    const allProjects = await this.getAll()
    const visited = new Set<string>([projectId])
    let currentId: string | null = parentId

    while (currentId) {
      if (visited.has(currentId)) {
        throw new Error('Référence circulaire détectée dans la hiérarchie de projets')
      }
      visited.add(currentId)

      const current = allProjects.find((p) => p.id === currentId)
      currentId = current?.parentId ?? null
    }
  }

  /**
   * Retourne tous les projets non-supprimés.
   * Le composant ProjectTree gérera la récursivité.
   */
  async getTree(): Promise<Project[]> {
    return this.getAll()
  }

  /**
   * Retourne les enfants directs d'un projet parent.
   */
  async getChildren(parentId: string | null): Promise<Project[]> {
    const allProjects = await this.getAll()
    return allProjects.filter((p) => p.parentId === parentId)
  }

  /**
   * Retourne les projets racines (sans parent).
   */
  async getRoots(): Promise<Project[]> {
    const allProjects = await this.getAll()
    return allProjects.filter((p) => p.parentId === null)
  }

  /**
   * Override create pour valider la hiérarchie
   */
  async create(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>
  ): Promise<Project> {
    // Validation: pas de boucle si parentId fourni
    if (data.parentId) {
      await this.validateNoCircularReference('temp-id', data.parentId)
    }
    return super.create(data)
  }

  /**
   * Override update pour valider la hiérarchie
   */
  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>>
  ): Promise<Project> {
    // Validation: pas de boucle si parentId modifié
    if (data.parentId !== undefined) {
      await this.validateNoCircularReference(id, data.parentId)
    }
    return super.update(id, data)
  }
}

export const projectRepository = new ProjectRepository()
