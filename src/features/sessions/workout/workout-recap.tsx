import {
  CheckCircle,
  Clock,
  Weight,
  Dumbbell,
  ListChecks,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useWorkoutStore } from '@/stores/workout.store'
import { useState } from 'react'

interface WorkoutRecapProps {
  onSave: () => void
  onEdit: () => void
}

export function WorkoutRecap({ onSave, onEdit }: WorkoutRecapProps) {
  const { exercises, elapsedTime } = useWorkoutStore()
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(
    new Set(),
  )

  const totalSeries = exercises.reduce((sum, ex) => sum + ex.series.length, 0)
  const totalVolume = exercises.reduce(
    (sum, ex) =>
      sum +
      ex.series.reduce((seriesSum, s) => seriesSum + s.reps * (s.weight || 0), 0),
    0,
  )

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return [hours, minutes, secs]
      .map((val) => val.toString().padStart(2, '0'))
      .join(':')
  }

  const toggleExercise = (index: number) => {
    setExpandedExercises((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-3xl font-bold">Séance terminée</h1>
          <p className="text-muted-foreground">Félicitations !</p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
              <p className="text-xs text-muted-foreground">Durée totale</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Weight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVolume.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Volume (kg)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exercises.length}</div>
              <p className="text-xs text-muted-foreground">Exercices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSeries}</div>
              <p className="text-xs text-muted-foreground">Séries</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste exercices */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Détail des exercices</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {exercises.map((ex, index) => {
              const exerciseVolume = ex.series.reduce(
                (sum, s) => sum + s.reps * (s.weight || 0),
                0,
              )
              const isExpanded = expandedExercises.has(index)

              return (
                <Collapsible
                  key={ex.exercise.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExercise(index)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ex.exercise.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {ex.series.length} série{ex.series.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {exerciseVolume.toFixed(0)} kg
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-2">
                    <div className="space-y-1 pl-4">
                      {ex.series.map((s, sIndex) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span className="text-muted-foreground">
                            Série {sIndex + 1}:
                          </span>
                          <span>
                            {s.reps} reps × {s.weight || 0} kg
                          </span>
                          {s.rpe && (
                            <span className="text-muted-foreground">
                              RPE {s.rpe}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </CardContent>
        </Card>

        {/* Boutons action */}
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={onSave}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
          >
            Sauvegarder et terminer
          </Button>

          <Button type="button" variant="outline" onClick={onEdit}>
            Modifier
          </Button>
        </div>
      </div>
    </div>
  )
}
