import { useMemo } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import { Button } from '@/components/ui/button'
import { History, Play, Plus, ChevronRight } from 'lucide-react'

export function WorkoutPage() {
  const navigate = useNavigate()

  const programs = useLiveQuery(() => workoutProgramRepository.getAllSorted(), [])

  const programsWithTemplates = useLiveQuery(async () => {
    if (!programs) return undefined
    return Promise.all(
      programs.map(async (program) => {
        const templates = await workoutProgramRepository.getSessionTemplates(program.id)
        return { program, templates }
      })
    )
  }, [programs])

  const hasPrograms = useMemo(
    () => programsWithTemplates && programsWithTemplates.length > 0,
    [programsWithTemplates],
  )

  if (programsWithTemplates === undefined) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-xl bg-card" />
        <div className="h-20 animate-pulse rounded-xl bg-card" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Mes séances</h1>
        <Button variant="outline" size="sm" asChild>
          <Link to="/sessions/workout/history">
            <History className="h-4 w-4 mr-2" aria-hidden="true" />
            Historique
          </Link>
        </Button>
      </div>

      {!hasPrograms ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">Aucun programme créé pour l'instant.</p>
          <Button onClick={() => void navigate({ to: '/sessions/workout/programs' })}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un programme
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {programsWithTemplates!.map(({ program, templates }) => (
            <div key={program.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold">{program.name}</span>
                <Link
                  to="/sessions/workout/programs/$programId"
                  params={{ programId: program.id }}
                  className="text-xs text-muted-foreground hover:text-text-primary flex items-center gap-1"
                >
                  Gérer <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {templates.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Aucune séance-type.{' '}
                  <Link
                    to="/sessions/workout/programs/$programId"
                    params={{ programId: program.id }}
                    className="text-primary underline underline-offset-4"
                  >
                    En ajouter une
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      onClick={() =>
                        void navigate({
                          to: '/sessions/workout/live/$sessionTemplateId',
                          params: { sessionTemplateId: template.id },
                        })
                      }
                    >
                      <span className="text-sm font-medium">{template.name}</span>
                      <Play className="h-4 w-4 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
