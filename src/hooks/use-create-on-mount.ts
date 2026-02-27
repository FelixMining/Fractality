import { useEffect } from 'react'
import { signalCreate, consumeCreate } from '@/lib/create-signal'

/**
 * Hook robuste pour ouvrir le formulaire de création au montage de la page.
 * Utilise setTimeout(0) pour survivre au double-montage de React Strict Mode :
 * - En Strict Mode : le cleanup s'exécute avant le timer → restaure le signal →
 *   le second montage le consomme correctement.
 * - En production : le timer se déclenche normalement → callback appelé.
 */
export function useCreateOnMount(callback: () => void) {
  useEffect(() => {
    if (!consumeCreate()) return

    const timer = setTimeout(() => {
      callback()
    }, 0)

    return () => {
      clearTimeout(timer)
      // Restaurer le signal pour que le second montage (Strict Mode) puisse le consommer
      signalCreate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
