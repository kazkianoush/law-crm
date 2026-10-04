'use client'

import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Role = 'admin' | 'user'

type AuthState = {
  session: Session | null
  role: Role
  isLoading: boolean
}

const AuthContext = createContext<AuthState>({
  session: null,
  role: 'user',
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fires on load (with any saved session), and again on every
    // sign in, sign out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setIsLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // app_metadata can only be set server-side, so it's safe to trust for the UI.
  // (The backend re-checks the role on every request; this only drives what's shown.)
  const role: Role =
    session?.user.app_metadata?.role === 'admin' ? 'admin' : 'user'

  return (
    <AuthContext.Provider value={{ session, role, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
