import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { db } from '@/lib/db/database'
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
import { ArrowLeft } from 'lucide-react'
import { ExerciseSelector } from './exercise-selector'
import type { WorkoutExercise } from '@/schemas/workout-exercise.schema'

interface SessionTemplateFormProps {
  programId: string
  onSuccess?: () => void
}

// Type pour un exercice sélectionné avec sa config
export interface SelectedExercise {
  exercise: WorkoutExercise
  defaultSets: number
  defaultReps?: number
  defaultWeight?: number
}

// Schema Zod pour l'étape 1 (nom de la séance)
const SessionNameSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
})

type SessionNameFormData = z.infer<typeof SessionNameSchema>

type Step = 'info' | 'exercises'

/**
 * Formulaire multi-step de création d'une séance-type.
 * Respecte AC3: "nom, sélection exercices avec paramètres par défaut".
 * GOTCHA #6: État local React (useState), pas Zustand.
 * GOTCHA #8: Transaction Dexie pour créer template + template_exercises atomiquement.
 * Story 3.2 : Programmes et séances-types
 */
export function SessionTemplateForm({ programId, onSuccess }: SessionTemplateFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('info')
  const [sessionName, setSessionName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])

  const form = useForm<SessionNameFormData>({
    resolver: zodResolver(SessionNameSchema),
    defaultValues: {
      name: sessionName || '',
    },
  })

  // Étape 1: Validation nom et passage à l'étape 2
  const handleNextStep = (data: SessionNameFormData) => {
    setSessionName(data.name)
    setCurrentStep('exercises')
  }

  // Retour à l'étape 1
  const handleBackStep = () => {
    setCurrentStep('info')
  }

  // Étape 2: Création de la séance-type avec transaction Dexie
  const handleSubmit = async () => {
    if (selectedExercises.length === 0) {
      toast.error('Veuillez sélectionner au moins un exercice')
      return
    }

    try {
      // GOTCHA #8: Transaction Dexie pour atomicité
      await db.transaction(
        'rw',
        [db.workout_session_templates, db.workout_template_exercises],
        async () => {
          // Créer la séance-type
          const templateId = crypto.randomUUID()
          const userId = crypto.randomUUID() // FIXED: Utiliser le même userId pour toutes les entités de cette transaction
          await db.workout_session_templates.add({
            id: templateId,
            userId,
            programId,
            name: sessionName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
            deletedAt: null,
          })

          // Créer les template_exercises avec order
          for (let i = 0; i < selectedExercises.length; i++) {
            const { exercise, defaultSets, defaultReps, defaultWeight } = selectedExercises[i]
            await db.workout_template_exercises.add({
              id: crypto.randomUUID(),
              userId, // FIXED: Même userId que la séance-type
              sessionTemplateId: templateId,
              exerciseId: exercise.id,
              order: i,
              defaultSets,
              defaultReps: defaultReps ?? undefined,
              defaultWeight: defaultWeight ?? undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: false,
              deletedAt: null,
            })
          }
        }
      )

      toast.success('Séance-type créée')
      onSuccess?.()
    } catch (error) {
      toast.error('Erreur lors de la création')
      console.error(error)
    }
  }

  // Animation transition slide horizontal
  const slideClass =
    currentStep === 'info'
      ? 'translate-x-0 opacity-100'
      : '-translate-x-4 opacity-0 pointer-events-none absolute'
  const exerciseClass =
    currentStep === 'exercises'
      ? 'translate-x-0 opacity-100'
      : 'translate-x-4 opacity-0 pointer-events-none absolute'

  return (
    <div className="relative overflow-hidden">
      {/* Étape 1: Nom de la séance */}
      <div
        className={`transition-all duration-150 ease-out ${slideClass}`}
        style={{ minHeight: '200px' }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleNextStep)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la séance</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Jour 1 - Push"
                      autoFocus
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
              <Button type="submit">Suivant</Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Étape 2: Sélection exercices */}
      <div
        className={`transition-all duration-150 ease-out ${exerciseClass}`}
        style={{ minHeight: '400px' }}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{sessionName}</h3>
            <p className="text-sm text-muted-foreground">
              Sélectionnez les exercices et configurez les paramètres par défaut
            </p>
          </div>

          <ExerciseSelector
            selectedExercises={selectedExercises}
            onSelectionChange={setSelectedExercises}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleBackStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleSubmit}>Créer la séance-type</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
