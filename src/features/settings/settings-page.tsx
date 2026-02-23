import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/supabase/auth'

export function SettingsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    setIsLoading(true)
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-semibold">Paramètres</h1>
      <p className="text-text-secondary text-sm">
        Les paramètres seront disponibles prochainement.
      </p>
      <div className="pt-4">
        <Button variant="destructive" onClick={handleSignOut} disabled={isLoading}>
          {isLoading ? 'Déconnexion...' : 'Déconnexion'}
        </Button>
      </div>
    </div>
  )
}
