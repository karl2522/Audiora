"use client"

import { logout as apiLogout, getCurrentUser } from "@/lib/api-client"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"

interface User {
  email: string
  name?: string
  picture?: string
}

// Auth state machine - prevents false unauthenticated renders
type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  authStatus: AuthStatus // Explicit state machine
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global single-flight promise to handle Strict Mode double-invocation
let globalRefreshPromise: Promise<User | null> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth state machine - authoritative source of truth
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle')
  const [user, setUser] = useState<User | null>(null)

  // Single-flight refreshUser - handles Strict Mode via global variable
  const refreshUser = useCallback(async () => {
    // If a refresh is already in flight (globally), join it
    if (globalRefreshPromise) {
      try {
        const userData = await globalRefreshPromise
        setUser(userData)
        setAuthStatus('authenticated')
      } catch (error) {
        // If the global promise failed, we fail too
        setUser(null)
        setAuthStatus('unauthenticated')
      }
      return
    }

    // Set loading state immediately
    setAuthStatus('loading')

    // Create new promise
    globalRefreshPromise = getCurrentUser({ timeout: 5000 })

    try {
      const userData = await globalRefreshPromise
      // Update state atomically - user and status together
      setUser(userData)
      setAuthStatus('authenticated')
    } catch (error: any) {
      // Handle auth timeout (AbortError from fetch)
      if (error.name === 'AbortError' || error.message === 'AUTH_TIMEOUT') {
        // Timeout = hard failure, go to unauthenticated
        setUser(null)
        setAuthStatus('unauthenticated')
        return
      }

      // Handle rate limiting - preserve previous state
      if (error?.statusCode === 429) {
        setAuthStatus('unauthenticated')
        return
      }
      // 401 or other auth errors - user is not authenticated
      setUser(null)
      setAuthStatus('unauthenticated')
    } finally {
      // Clear global promise so future retries can happen
      globalRefreshPromise = null
    }
  }, []) // No dependencies - stable callback

  // Bootstrap: One-time auth check when status is 'idle'
  // Event-driven, not timer-driven - triggers on state change
  // Skip bootstrap on callback page - let callback page handle OAuth flow
  useEffect(() => {
    if (authStatus === 'idle') {
      // Skip bootstrap on callback page - cookies aren't ready yet
      // Callback page will handle auth check with proper timing
      if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
        return
      }
      refreshUser()
    }
  }, [authStatus, refreshUser])

  const logout = useCallback(async () => {
    try {
      // Set auth status to unauthenticated immediately to update UI
      setAuthStatus('unauthenticated')
      setUser(null)

      // Call API logout
      await apiLogout()
    } catch (error) {
      // Silently handle logout errors
    } finally {
      // Ensure state is cleared
      setUser(null)
      setAuthStatus('unauthenticated')

      // Force reload to clear any in-memory state/loops
      // This is the safest way to ensure all polling/requests stop
      window.location.href = '/'
    }
  }, [])

  // Derive isLoading and isAuthenticated from authStatus
  const isLoading = authStatus === 'idle' || authStatus === 'loading'
  const isAuthenticated = authStatus === 'authenticated'

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        authStatus,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

