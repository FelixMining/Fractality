import { supabase } from './client'

const AUTH_CALLBACK_URL = `${window.location.origin}/auth/callback`

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: AUTH_CALLBACK_URL,
    },
  })
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: AUTH_CALLBACK_URL,
    },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}
