"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { getCurrentUser, logout as apiLogout } from "@/lib/api-client"

interface User {
  email: string
  name?: string
  picture?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    // SECURITY FIX: Always try to fetch user - authentication is determined by httpOnly cookies
    // The API will return 401 if not authenticated, which we handle below
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (error) {
      // User is not authenticated or token expired
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const logout = async () => {
    try {
      await apiLogout()
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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

