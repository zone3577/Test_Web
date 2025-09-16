'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { clearAuthData, isAuthSessionError, handleAuthError } from '@/utils/authUtils'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error)
        
        // If there's an auth error, handle it properly
        if (isAuthSessionError(error)) {
          handleAuthError(error)
        }
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session)
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Clear any potentially stale data
        if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
          clearAuthData()
        }
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    try {
      console.log('Starting signOut process...')
      
      // Check if there's a current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        handleAuthError(sessionError)
      }
      
      if (!session) {
        console.log('No active session found, clearing local state')
        // If no session exists, just clear the local state and auth data
        setUser(null)
        setSession(null)
        clearAuthData()
        return { error: null }
      }
      
      // Attempt to sign out
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('SignOut error:', error)
        
        // Check if it's a session-related error we can handle gracefully
        if (isAuthSessionError(error)) {
          console.log('Session already invalid, clearing local state')
          setUser(null)
          setSession(null)
          clearAuthData()
          return { error: null }
        }
        
        return { error }
      }
      
      console.log('SignOut successful')
      // Clear local state and auth data
      setUser(null)
      setSession(null)
      clearAuthData()
      return { error: null }
    } catch (err: any) {
      console.error('SignOut exception:', err)
      
      // For auth session errors, consider it successful and clear state
      if (isAuthSessionError(err)) {
        console.log('Auth session already invalid, clearing local state')
        setUser(null)
        setSession(null)
        clearAuthData()
        return { error: null }
      }
      
      return { error: err }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}