export interface ConflictResult {
  winner: 'local' | 'server'
  data: Record<string, unknown>
}

/**
 * Resolve a conflict between local and server data using last-write-wins.
 * The record with the most recent `updatedAt` timestamp wins.
 * If no local record exists, the server record wins by default.
 */
export function resolveConflict(
  local: Record<string, unknown> | undefined,
  server: Record<string, unknown>,
): ConflictResult {
  if (!local) {
    return { winner: 'server', data: server }
  }

  const localUpdatedAt = local.updatedAt as string
  const serverUpdatedAt = server.updatedAt as string

  if (serverUpdatedAt > localUpdatedAt) {
    return { winner: 'server', data: server }
  }

  return { winner: 'local', data: local }
}
