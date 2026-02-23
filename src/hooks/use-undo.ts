import { useUndoStore } from '@/stores/undo.store'

export function useUndo() {
  const pushUndo = useUndoStore((s) => s.pushUndo)
  const actions = useUndoStore((s) => s.actions)

  const withUndo = async (
    description: string,
    action: () => Promise<void>,
    undoAction: () => Promise<void>,
  ) => {
    await action()
    pushUndo(description, undoAction)
  }

  return { withUndo, undoActions: actions }
}
