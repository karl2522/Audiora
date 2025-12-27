"use client"

import { useAuth } from "@/contexts/auth-context"
import { Music2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

// Force dynamic rendering - this page needs runtime data
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
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
      refreshUser()
    }
  }, [searchParams, hasStartedAuth, refreshUser, router])

  // Effect 2: Redirect when authenticated
  useEffect(() => {
    if (authStatus === 'authenticated') {
      setIsLoading(false)
      setTimeout(() => {
        router.push('/listening')
      }, 1000)
    } else if (authStatus === 'unauthenticated' && hasStartedAuth) {
      setError('Authentication failed. Please try again.')
      setIsLoading(false)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }, [authStatus, router, hasStartedAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center">
            <Music2 className="w-10 h-10 text-background" />
          </div>
        </div>

        {error ? (
          <>
            <h1 className="text-2xl font-light tracking-tight">Authentication Failed</h1>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to home...</p>
          </>
        ) : isLoading ? (
          <>
            <h1 className="text-2xl font-light tracking-tight">Signing you in...</h1>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-light tracking-tight">Welcome to Audiora!</h1>
            <p className="text-muted-foreground">Redirecting to your music...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
