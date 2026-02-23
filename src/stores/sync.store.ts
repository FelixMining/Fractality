import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

interface SyncState {
  status: SyncStatus
  lastSyncTimestamp: string | null
  queueSize: number
  lastError: string | null
  setStatus: (status: SyncStatus) => void
  setLastSync: (ts: string) => void
  setQueueSize: (size: number) => void
  setError: (error: string | null) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      lastSyncTimestamp: null,
      queueSize: 0,
      lastError: null,
      setStatus: (status) => set({ status }),
      setLastSync: (ts) => set({ lastSyncTimestamp: ts }),
      setQueueSize: (size) => set({ queueSize: size }),
      setError: (error) => set({ lastError: error }),
    }),
    {
      name: 'fractality-sync',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lastSyncTimestamp: state.lastSyncTimestamp }),
    },
  ),
)
