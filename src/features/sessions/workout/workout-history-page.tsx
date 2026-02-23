import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkoutHistoryList } from './workout-history-list'
import { WorkoutRetroactiveForm } from './workout-retroactive-form'
import { useNavigate } from '@tanstack/react-router'
import type { WorkoutSession } from '@/schemas/workout-session.schema'

type View = 'list' | 'retroactive'

/**
 * Page historique des séances de musculation.
 * Respecte AC1 : affiche toutes les séances complétées.
 * Respecte AC3 : bouton "Ajouter une séance passée" → formulaire rétroactif.
 * Story 3.5 : Modification et création rétroactive de séances
 */
export function WorkoutHistoryPage() {
  const [view, setView] = useState<View>('list')
  const navigate = useNavigate()

  const handleEdit = (session: WorkoutSession) => {
    navigate({ to: '/sessions/workout/$sessionId/edit', params: { sessionId: session.id } })
  }

  if (view === 'retroactive') {
    return <WorkoutRetroactiveForm onBack={() => setView('list')} />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Historique des séances</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setView('retroactive')}
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Ajouter une séance passée
        </Button>
      </div>

      <WorkoutHistoryList
        onEdit={handleEdit}
        onAddRetroactive={() => setView('retroactive')}
      />
    </div>
  )
}
