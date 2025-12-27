"use client"

import { useAuth } from "@/contexts/auth-context"
import { Music2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

// Force dynamic rendering - this page needs runtime data
export const dynamic = 'force-dynamic'

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
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes music-bar {
          0%, 100% { height: 15%; opacity: 0.3; }
          50% { height: 100%; opacity: 1; }
        }
        .animate-music-bar {
          animation: music-bar 0.8s ease-in-out infinite;
        }
      `}} />

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 p-8 max-w-md w-full">
        {/* Music Visualizer Logo */}
        <div className="flex items-center justify-center gap-2 h-16 mb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2.5 bg-foreground rounded-full animate-music-bar"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: '100%' // Initial height, overridden by animation
              }}
            />
          ))}
        </div>

        {isLoading ? (
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tighter">Audiora</h1>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Completing sign in...
              </p>
              <p className="text-xs text-muted-foreground/60">
                Setting up your personal stage
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center space-y-3 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <Music2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-destructive">Authentication Error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground/60 mt-4">Redirecting you home...</p>
          </div>
        ) : null}
      </div>
    </main>
  )
}

