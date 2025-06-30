import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (firstName: string, lastName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  console.log('AuthProvider: Initializing...')

  // Load user profile from database
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('AuthProvider: Loading user profile for:', userId)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('AuthProvider: Error loading user profile:', error)
        throw error
      }

      if (data) {
        console.log('AuthProvider: User profile loaded:', data)
        setProfile(data)
      } else {
        console.log('AuthProvider: No user profile found')
        setProfile(null)
      }
    } catch (error) {
      console.error('AuthProvider: Error loading user profile:', error)
      setProfile(null)
    }
  }

  // Sign up new user
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('AuthProvider: Signing up user:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error('AuthProvider: Signup error:', error)
        throw error
      }

      if (data.user) {
        console.log('AuthProvider: User created, creating profile...')
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            first_name: firstName,
            last_name: lastName
          })

        if (profileError) {
          console.error('AuthProvider: Profile creation error:', profileError)
          throw profileError
        }
        
        console.log('AuthProvider: Profile created successfully')
      }
    } catch (error) {
      console.error('AuthProvider: SignUp failed:', error)
      throw error
    }
  }

  // Sign in user
  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing in user:', email)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('AuthProvider: SignIn error:', error)
        throw error
      }
      
      console.log('AuthProvider: SignIn successful')
    } catch (error) {
      console.error('AuthProvider: SignIn failed:', error)
      throw error
    }
  }

  // Sign out user
  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out user')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('AuthProvider: SignOut error:', error)
        throw error
      }
      
      setUser(null)
      setProfile(null)
      setSession(null)
      
      console.log('AuthProvider: SignOut successful')
    } catch (error) {
      console.error('AuthProvider: SignOut failed:', error)
      throw error
    }
  }

  // Update user profile
  const updateProfile = async (firstName: string, lastName: string) => {
    if (!user) throw new Error('No user logged in')

    try {
      console.log('AuthProvider: Updating profile for user:', user.id)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('AuthProvider: Profile update error:', error)
        throw error
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      } : null)
      
      console.log('AuthProvider: Profile updated successfully')
    } catch (error) {
      console.error('AuthProvider: Profile update failed:', error)
      throw error
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthProvider: Error getting initial session:', error)
      } else {
        console.log('AuthProvider: Initial session:', session ? 'Found' : 'None')
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        loadUserProfile(session.user.id)
      }
      
      setLoading(false)
    }).catch(error => {
      console.error('AuthProvider: Failed to get initial session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session ? 'Session exists' : 'No session')
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      console.log('AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }

  console.log('AuthProvider: Rendering with state:', {
    user: !!user,
    profile: !!profile,
    session: !!session,
    loading
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}