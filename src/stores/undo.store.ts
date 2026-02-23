import { create } from 'zustand'

export interface UndoAction {
  id: string
  description: string
  undo: () => Promise<void>
  timestamp: number
  timeoutId: ReturnType<typeof setTimeout>
}

interface UndoState {
  actions: UndoAction[]
  pushUndo: (description: string, undoFn: () => Promise<void>) => void
  executeUndo: (id: string) => Promise<void>
  removeAction: (id: string) => void
  clearAll: () => void
}

const MAX_UNDO_ACTIONS = 20
const UNDO_TIMEOUT_MS = 5000

export const useUndoStore = create<UndoState>()((set, get) => ({
  actions: [],

  pushUndo: (description, undoFn) => {
    const id = crypto.randomUUID()

    const timeoutId = setTimeout(() => {
      get().removeAction(id)
    }, UNDO_TIMEOUT_MS)

    const action: UndoAction = {
      id,
      description,
      undo: undoFn,
      timestamp: Date.now(),
      timeoutId,
    }

    set((state) => {
      const newActions = [action, ...state.actions]

      // Supprimer les plus anciennes si on dépasse la limite
      if (newActions.length > MAX_UNDO_ACTIONS) {
        const removed = newActions.splice(MAX_UNDO_ACTIONS)
        for (const r of removed) {
          clearTimeout(r.timeoutId)
        }
      }

      return { actions: newActions }
    })
  },

  executeUndo: async (id) => {
    const action = get().actions.find((a) => a.id === id)
    if (!action) return

    // Stopper le timer d'expiration avant l'exécution
    clearTimeout(action.timeoutId)

    try {
      await action.undo()
    } finally {
      // Retirer l'action du store APRÈS l'exécution (même en cas d'erreur)
      get().removeAction(id)
    }
  },

  removeAction: (id) => {
    set((state) => {
      const action = state.actions.find((a) => a.id === id)
      if (action) {
        clearTimeout(action.timeoutId)
      }
      return { actions: state.actions.filter((a) => a.id !== id) }
    })
  },

  clearAll: () => {
    const { actions } = get()
    for (const action of actions) {
      clearTimeout(action.timeoutId)
    }
    set({ actions: [] })
  },
}))
