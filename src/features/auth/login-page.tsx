import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { signInWithGoogle, signInWithPassword, signUp } from '@/lib/supabase/auth'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  function resetMessages() {
    setError(null)
    setSuccess(null)
  }

  function toggleMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    resetMessages()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    resetMessages()

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    setIsLoading(true)

    if (mode === 'login') {
      const { error } = await signInWithPassword(email, password)
      if (error) {
        setError(error.message)
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Un email de confirmation a été envoyé. Vérifiez votre boîte de réception.')
        setEmail('')
        setPassword('')
      }
    }

    setIsLoading(false)
  }

  async function handleGoogleLogin() {
    resetMessages()
    setIsGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setIsGoogleLoading(false)
    }
  }

  const hasError = !!error

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-text-primary text-2xl font-semibold">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-text-secondary text-sm">
            {mode === 'login'
              ? 'Connectez-vous pour accéder à Fractality.'
              : 'Inscrivez-vous pour commencer.'}
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner />
              Connexion...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <GoogleIcon />
              Continuer avec Google
            </span>
          )}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-text-muted text-xs">ou</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={hasError}
              aria-describedby={hasError ? 'form-error' : undefined}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={hasError}
              aria-describedby={hasError ? 'form-error' : undefined}
              disabled={isLoading}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p id="form-error" className="text-sm text-[#EF4444]" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-[#10B981]" role="status">
              {success}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner />
                {mode === 'login' ? 'Connexion...' : 'Inscription...'}
              </span>
            ) : mode === 'login' ? (
              'Se connecter'
            ) : (
              "S'inscrire"
            )}
          </Button>
        </form>

        <p className="text-text-secondary text-center text-sm">
          {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-accent-primary hover:underline"
          >
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
