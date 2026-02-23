import { useUndoStore } from '@/stores/undo.store'
import { Undo2 } from 'lucide-react'
import { toast } from 'sonner'

const UNDO_TIMEOUT_MS = 5000

export function UndoToast() {
  const actions = useUndoStore((s) => s.actions)
  const executeUndo = useUndoStore((s) => s.executeUndo)
  const latestAction = actions[0] ?? null

  if (!latestAction) return null

  const handleUndo = async () => {
    try {
      await executeUndo(latestAction.id)
      toast.success('Action annulée')
    } catch {
      toast.error("Échec de l'annulation")
    }
  }

  return (
    <div
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 lg:bottom-6"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <span className="text-sm text-foreground">{latestAction.description}</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Annuler
        </button>

        {/* Barre de progression */}
        <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden rounded-b-xl">
          <div
            key={latestAction.id}
            className="h-full bg-primary"
            style={{
              animation: `undo-progress ${UNDO_TIMEOUT_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes undo-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
