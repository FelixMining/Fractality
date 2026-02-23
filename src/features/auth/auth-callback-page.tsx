import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/client'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          navigate({ to: '/login' })
        } else {
          navigate({ to: '/' })
        }
      })
    } else {
      navigate({ to: '/login' })
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-text-secondary text-sm">Authentification en cours...</p>
    </div>
  )
}
