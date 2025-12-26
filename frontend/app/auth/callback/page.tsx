"use client"

import { useAuth } from "@/contexts/auth-context"
import { Music2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser, authStatus } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStartedAuth, setHasStartedAuth] = useState(false)

  // Effect 1: Start authentication process when success param is present
  useEffect(() => {
    const success = searchParams.get('success')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(errorParam)
      setIsLoading(false)
      setTimeout(() => {
        router.push('/')
      }, 3000)
      return
    }

    if (success === 'true' && !hasStartedAuth) {
      setHasStartedAuth(true)

      // State-driven authentication flow - await refreshUser
      // Rule: Callback page must verify authStatus === 'authenticated' before redirecting
      const completeAuth = async (retryCount = 0) => {
        try {
          // Wait for cookies to be available (OAuth redirect sets them)
          if (retryCount === 0) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }

          // Await refreshUser - single-flight ensures no duplicates
          // refreshUser() will update authStatus atomically
          await refreshUser()

          // State will be updated by refreshUser() - Effect 2 will handle redirect
        } catch (err: any) {
          // Handle rate limiting with exponential backoff
          if (err?.statusCode === 429) {
            if (retryCount < 2) {
              const delay = Math.pow(2, retryCount) * 1000
              await new Promise(resolve => setTimeout(resolve, delay))
              return completeAuth(retryCount + 1)
            }
            setError('Too many requests. Please wait a moment and try again.')
            setIsLoading(false)
            setTimeout(() => {
              router.push('/')
            }, 3000)
            return
          }

          // Retry once for 401 (cookie timing issue)
          if (retryCount === 0 && err?.statusCode === 401) {
            await new Promise(resolve => setTimeout(resolve, 500))
            return completeAuth(1)
          }

          setError('Failed to complete authentication')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      }

      completeAuth()
    } else if (success !== 'true' && !hasStartedAuth) {
      setError('Authentication failed')
      setIsLoading(false)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }, [searchParams, router, refreshUser, hasStartedAuth])

  // Effect 2: Watch authStatus and redirect when authenticated
  // CRITICAL: Verify authStatus === 'authenticated' before redirecting
  // This guarantees the listening page never renders unauthenticated
  // Effect 1 handles all error cases with retry logic, so Effect 2 only handles success
  // Effect 2: Watch authStatus and redirect when authenticated or handle failure
  // CRITICAL: Verify authStatus === 'authenticated' before redirecting
  // This guarantees the listening page never renders unauthenticated
  useEffect(() => {
    if (!hasStartedAuth) return

    if (authStatus === 'authenticated') {
      // Small delay to ensure React state propagates to all components
      const timer = setTimeout(() => {
        router.push('/listening')
      }, 100)
      return () => clearTimeout(timer)
    } else if (authStatus === 'unauthenticated') {
      // Handle failure case (timeout or invalid token)
      // Only set error if one isn't already set
      setError(prev => prev || 'Authentication failed. Please try again.')
      setIsLoading(false)
      const timer = setTimeout(() => {
        router.push('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [authStatus, hasStartedAuth, router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center animate-pulse">
            <Music2 className="w-8 h-8 text-background" />
          </div>
        </div>

        {isLoading ? (
          <>
            <h1 className="text-2xl font-light">Completing sign in...</h1>
            <p className="text-muted-foreground">Please wait while we authenticate you.</p>
          </>
        ) : error ? (
          <>
            <h1 className="text-2xl font-light text-destructive">Authentication Error</h1>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to home page...</p>
          </>
        ) : null}
      </div>
    </main>
  )
}

