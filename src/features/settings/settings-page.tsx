import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { signOut } from '@/lib/supabase/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function SettingsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  async function handleSignOut() {
    setIsLoading(true)
    await signOut()
    navigate({ to: '/login' })
  }

  // Initiale(s) pour l'avatar de secours
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : user?.user_metadata?.name
      ? (user.user_metadata.name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
      : '??'

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? '') as string

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Paramètres</h1>

      {/* Compte connecté */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Compte connecté
        </h2>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-lg font-bold text-primary">{initials}</span>
            )}
          </div>

          {/* Infos */}
          <div className="min-w-0 flex-1">
            {displayName && displayName !== user?.email && (
              <p className="truncate font-medium">{displayName}</p>
            )}
            <p className="truncate text-sm text-muted-foreground">{user?.email ?? '—'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user ? 'Connecté' : 'Chargement…'}
            </p>
          </div>

          {/* Icône */}
          <User size={20} className="shrink-0 text-muted-foreground" />
        </div>
      </section>

      {/* Déconnexion */}
      <section className="rounded-xl border border-destructive/20 bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Session
        </h2>
        <Button
          variant="destructive"
          onClick={handleSignOut}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <LogOut size={16} />
          {isLoading ? 'Déconnexion…' : 'Se déconnecter'}
        </Button>
      </section>
    </div>
  )
}
