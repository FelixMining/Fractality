import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type WorkoutExercise,
  type MuscleGroup,
  MUSCLE_GROUP_LABELS,
  muscleGroupEnum,
} from '@/schemas/workout-exercise.schema'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useState } from 'react'
import { z } from 'zod'

// Schema spécifique pour le formulaire (seulement les champs nécessaires)
const exerciseFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  muscleGroup: muscleGroupEnum,
  description: z.string().max(500, 'Maximum 500 caractères').optional(),
})

type ExerciseFormData = z.infer<typeof exerciseFormSchema>

interface ExerciseFormProps {
  mode?: 'create' | 'edit'
  initialData?: WorkoutExercise
  onSuccess?: (data: ExerciseFormData) => void | Promise<void>
  onCancel?: () => void
}

export function ExerciseForm({
  mode = 'create',
  initialData,
  onSuccess,
  onCancel,
}: ExerciseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = mode === 'edit'

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          muscleGroup: initialData.muscleGroup,
          description: initialData.description,
        }
      : {
          name: '',
          muscleGroup: 'chest',
          description: undefined,
        },
  })

  const onSubmit = async (data: ExerciseFormData) => {
    setIsSubmitting(true)
    try {
      if (isEdit && initialData) {
        // Mode édition: déléguer à la page pour withUndo (AC3)
        await onSuccess?.(data)
        toast.success('Exercice modifié')
      } else {
        // Mode création: appel direct au repository
        await workoutExerciseRepository.create(data as any)
        toast.success('Exercice créé')
        onSuccess?.(data)
      }
    } catch (error) {
      // Gestion d'erreurs spécifique
      if (error instanceof z.ZodError) {
        toast.error('Données invalides. Veuillez vérifier le formulaire.')
      } else if (error instanceof Error) {
        toast.error(`Erreur: ${error.message}`)
      } else {
        toast.error("Erreur lors de l'enregistrement")
      }
      console.error('Erreur soumission formulaire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Récupérer les valeurs valides du enum pour le Select
  const muscleGroups = muscleGroupEnum.options as MuscleGroup[]

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom de l'exercice *</Label>
        <Input
          id="name"
          {...form.register('name')}
          placeholder="Ex: Développé couché"
          autoFocus
          aria-invalid={form.formState.errors.name ? 'true' : 'false'}
          aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
        />
        {form.formState.errors.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Groupe musculaire */}
      <div className="space-y-2">
        <Label htmlFor="muscleGroup">Groupe musculaire *</Label>
        <Controller
          control={form.control}
          name="muscleGroup"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="muscleGroup">
                <SelectValue placeholder="Sélectionner un groupe" />
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {MUSCLE_GROUP_LABELS[group]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.muscleGroup && (
          <p id="muscleGroup-error" className="text-sm text-destructive" role="alert">
            {form.formState.errors.muscleGroup.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Notes additionnelles sur l'exercice"
          rows={4}
        />
        {form.formState.errors.description && (
          <p id="description-error" className="text-sm text-destructive" role="alert">
            {form.formState.errors.description.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Maximum 500 caractères
        </p>
      </div>

      {/* Boutons */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
