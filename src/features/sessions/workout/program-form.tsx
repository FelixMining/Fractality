import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { WorkoutProgram } from '@/schemas/workout-program.schema'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Schema Zod pour le formulaire (seulement les champs éditables)
const ProgramFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  description: z.string().max(1000, 'Maximum 1000 caractères').optional(),
})

type ProgramFormData = z.infer<typeof ProgramFormSchema>

interface ProgramFormProps {
  initialData?: WorkoutProgram
  onSuccess?: () => void
}

/**
 * Formulaire de création/édition d'un programme d'entraînement.
 * Respecte AC2: "nom (requis), description (optionnel, textarea)".
 * Respecte AC5: "formulaire pré-rempli avec les données actuelles" en mode édition.
 * Story 3.2 : Programmes et séances-types
 */
export function ProgramForm({ initialData, onSuccess }: ProgramFormProps) {
  const form = useForm<ProgramFormData>({
    resolver: zodResolver(ProgramFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || '',
    } : {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: ProgramFormData) => {
    try {
      if (initialData?.id) {
        await workoutProgramRepository.update(initialData.id, data as Partial<Omit<WorkoutProgram, 'id'>>)
        toast.success('Programme modifié')
      } else {
        await workoutProgramRepository.create(data as Omit<WorkoutProgram, 'id'>)
        toast.success('Programme créé')
      }
      onSuccess?.()
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du programme</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Push Pull Legs" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Objectifs, fréquence, notes..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Annuler
          </Button>
          <Button type="submit">{initialData ? 'Modifier' : 'Créer'}</Button>
        </div>
      </form>
    </Form>
  )
}
