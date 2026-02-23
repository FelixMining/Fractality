import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { WorkoutLiveScreen } from './workout-live-screen'
import { WorkoutRecap } from './workout-recap'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useWorkoutStore } from '@/stores/workout.store'
import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutSessionTemplateRepository } from '@/lib/db/repositories/workout-session-template.repository'
import { getPrefillDataForSession } from '@/lib/workout/prefill'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { WorkoutSeries } from '@/schemas/workout-series.schema'

interface WorkoutLivePageProps {
  sessionTemplateId?: string
}

export function WorkoutLivePage({
  sessionTemplateId,
}: WorkoutLivePageProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [showQuitDialog, setShowQuitDialog] = useState(false)
  const [showRecap, setShowRecap] = useState(false)

  const {
    activeSession,
    startSession,
    completeSession,
    abandonSession,
    resetStore,
  } = useWorkoutStore()

  useEffect(() => {
    const initializeSession = async () => {
    try {
      setIsLoading(true)

      // Vérifier si une session active existe déjà dans le store
      if (activeSession) {
        // Session en cours déjà chargée
        setIsLoading(false)
        return
      }

      // Sinon, créer une nouvelle session
      if (!sessionTemplateId) {
        toast.error('Aucun modèle de séance spécifié')
        navigate({ to: '/sessions/workout' })
        return
      }

      // Charger le template de séance
      const template = await workoutSessionTemplateRepository.getById(
        sessionTemplateId,
      )
      if (!template) {
        toast.error('Modèle de séance introuvable')
        navigate({ to: '/sessions/workout' })
        return
      }

      // Charger les exercices du template
      const templateExercises =
        await workoutSessionTemplateRepository.getTemplateExercises(
          sessionTemplateId,
        )

      const exerciseIds = templateExercises.map((te) => te.templateExercise.exerciseId)
      const exercises = templateExercises.map((te) => te.exercise)

      // Obtenir userId actuel
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Utilisateur non authentifié')
        navigate({ to: '/' })
        return
      }

      // Créer la session
      const newSession = await workoutSessionRepository.create({
        userId: user.id,
        sessionTemplateId,
        programId: template.programId,
        startedAt: new Date().toISOString(),
        status: 'in-progress',
      })

      // Charger les données de pré-remplissage
      const prefillData = await getPrefillDataForSession(
        sessionTemplateId,
        exerciseIds,
      )

      // Créer les exercices avec séries pré-remplies
      const exercisesWithSeries = exercises.map((exercise) => {
        const prefill = prefillData.exercises.find(
          (e) => e.exerciseId === exercise.id,
        )
        const defaultSeries = prefill?.defaultSeries || []

        // Si pas de séries précédentes, créer une série par défaut
        const series: WorkoutSeries[] =
            defaultSeries.length > 0
              ? defaultSeries.map((s, sIndex) => ({
                  id: crypto.randomUUID(),
                  userId: user.id,
                  sessionId: newSession.id,
                  exerciseId: exercise.id,
                  order: sIndex,
                  reps: s.reps,
                  weight: s.weight,
                  restTime: s.restTime,
                  rpe: s.rpe,
                  completed: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  isDeleted: false,
                  deletedAt: null,
                }))
              : [
                  {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    sessionId: newSession.id,
                    exerciseId: exercise.id,
                    order: 0,
                    reps: 10,
                    weight: 0,
                    restTime: 90,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isDeleted: false,
                    deletedAt: null,
                  },
                ]

        return {
          exercise,
          series,
        }
      })

      // Démarrer la session dans le store
      startSession(newSession.id, exercisesWithSeries)
      setIsLoading(false)
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la séance:', error)
      toast.error('Impossible de démarrer la séance')
      navigate({ to: '/sessions/workout' })
    }
    }

    initializeSession()
  }, [sessionTemplateId])

  const handleQuit = () => {
    setShowQuitDialog(true)
  }

  const handleConfirmQuit = async () => {
    try {
      await abandonSession()
      toast.success('Séance abandonnée')
      navigate({ to: '/sessions/workout' })
    } catch (error) {
      console.error('Erreur lors de l\'abandon de la séance:', error)
      toast.error('Erreur lors de l\'abandon de la séance')
    }
  }

  const handleComplete = () => {
    setShowRecap(true)
  }

  const handleSaveAndFinish = async () => {
    try {
      await completeSession()
      toast.success('Séance terminée et sauvegardée !')
      resetStore()
      navigate({ to: '/sessions/workout' })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la séance:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleEditFromRecap = () => {
    setShowRecap(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Chargement de la séance...</p>
      </div>
    )
  }

  return (
    <>
      {!showRecap ? (
        <WorkoutLiveScreen onQuit={handleQuit} onComplete={handleComplete} />
      ) : (
        <WorkoutRecap onSave={handleSaveAndFinish} onEdit={handleEditFromRecap} />
      )}

      {/* Dialog confirmation quitter */}
      <AlertDialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter la séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous sauvegarder votre progression ou abandonner la séance ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmQuit}>
              Abandonner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
