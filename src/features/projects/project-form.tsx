import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Project } from '@/schemas/project.schema'
import { projectRepository } from '@/lib/db/repositories/project.repository'
import { ProjectPicker } from '@/components/shared/project-picker'
import { useUndo } from '@/hooks/use-undo'

interface ProjectFormProps {
  project: Project | null
  onSuccess: () => void
  onCancel: () => void
}

const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B500',
  '#52B788',
  '#EF476F',
  '#06FFA5',
]

// Schema pour le formulaire (sans les champs auto-générés)
const projectFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format couleur invalide (#RRGGBB)'),
  parentId: z.string().uuid().nullable(),
})

type ProjectFormData = z.infer<typeof projectFormSchema>

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const isEdit = !!project
  const { withUndo } = useUndo()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || '',
      color: project?.color || PRESET_COLORS[0],
      parentId: project?.parentId || null,
    },
  })

  const selectedColor = watch('color')
  const selectedParentId = watch('parentId')

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEdit && project) {
        // Capturer l'ancien état pour le undo
        const oldData = { name: project.name, color: project.color, parentId: project.parentId }
        await withUndo(
          `Projet "${project.name}" modifié`,
          async () => {
            await projectRepository.update(project.id, data as Partial<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>>)
          },
          async () => {
            await projectRepository.update(project.id, oldData as Partial<Omit<Project, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>>)
          },
        )
        toast.success('Projet modifié !')
      } else {
        await projectRepository.create(data as Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>)
        toast.success('Projet créé !')
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-2xl font-semibold">
        {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nom */}
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Nom du projet
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Ex: Projet personnel"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Couleur */}
        <div>
          <label className="mb-2 block text-sm font-medium">Couleur</label>
          <div className="space-y-3">
            {/* Palette prédéfinie */}
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className="h-10 w-10 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#fff' : 'transparent',
                    boxShadow: selectedColor === color ? '0 0 0 2px currentColor' : 'none',
                  }}
                  aria-label={`Couleur ${color}`}
                />
              ))}
            </div>

            {/* Color picker natif */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register('color')}
                className="h-10 w-16 cursor-pointer rounded-lg border border-border"
              />
              <span className="text-sm text-muted-foreground">
                ou choisissez une couleur personnalisée
              </span>
            </div>
          </div>
          {errors.color && (
            <p className="mt-1 text-sm text-red-500">{errors.color.message}</p>
          )}
        </div>

        {/* Projet parent */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Projet parent (optionnel)
          </label>
          <ProjectPicker
            value={selectedParentId}
            onChange={(projectId) => setValue('parentId', projectId)}
            excludeId={project?.id}
            placeholder="Aucun projet parent"
          />
          {errors.parentId && (
            <p className="mt-1 text-sm text-red-500">{errors.parentId.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-6 py-3 font-medium hover:bg-accent"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
