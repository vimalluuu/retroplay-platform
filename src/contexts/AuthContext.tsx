import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isSupabaseReady: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    // Check existing session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user
        setUser({
          id: u.id,
          email: u.email || '',
          username: u.user_metadata?.username,
          avatarUrl: u.user_metadata?.avatar_url,
          createdAt: u.created_at || new Date().toISOString(),
        })
      }
      if (!data.session?.user) setIsLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        setUser({
          id: u.id,
          email: u.email || '',
          username: u.user_metadata?.username,
          avatarUrl: u.user_metadata?.avatar_url,
          createdAt: u.created_at || new Date().toISOString(),
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => { listener?.subscription.unsubscribe() }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }

  const signUp = async (email: string, password: string, username: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    return { error: error?.message || null }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isSupabaseReady: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
