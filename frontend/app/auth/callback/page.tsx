"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Music2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const success = searchParams.get('success')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(errorParam)
      setIsLoading(false)
      // Redirect to home after showing error
      setTimeout(() => {
        router.push('/')
      }, 3000)
      return
    }

    if (success === 'true') {
      try {
        // Access token is now in httpOnly cookie, no need to store in localStorage
        // Just refresh user data - the API client will use the cookie automatically
        refreshUser()
        
        // Redirect to listening page
        router.push('/listening')
      } catch (err) {
        setError('Failed to complete authentication')
        setIsLoading(false)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } else {
      setError('Authentication failed')
      setIsLoading(false)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }, [searchParams, router, refreshUser])

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

