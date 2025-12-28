"use client"

import { useAuth } from "@/contexts/auth-context"
import { Music2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

// Force dynamic rendering - this page needs runtime data
export const dynamic = 'force-dynamic'

// Deterministic particle positions to avoid hydration mismatch
const particlePositions = [
  { left: 23.4, top: 81.3, delay: 4.4, duration: 8.8 },
  { left: 91.9, top: 88.0, delay: 0.2, duration: 8.5 },
  { left: 27.3, top: 20.9, delay: 0.8, duration: 8.3 },
  { left: 55.2, top: 23.1, delay: 4.4, duration: 13.8 },
  { left: 0.5, top: 57.1, delay: 0.7, duration: 12.4 },
  { left: 60.2, top: 83.3, delay: 2.8, duration: 5.8 },
  { left: 52.7, top: 49.2, delay: 3.0, duration: 11.9 },
  { left: 14.3, top: 46.9, delay: 1.8, duration: 8.5 },
  { left: 75.6, top: 55.5, delay: 3.0, duration: 9.9 },
  { left: 56.1, top: 36.0, delay: 3.4, duration: 7.4 },
  { left: 81.5, top: 2.0, delay: 2.4, duration: 6.3 },
  { left: 36.0, top: 73.8, delay: 3.6, duration: 6.7 },
  { left: 95.5, top: 8.1, delay: 3.9, duration: 9.3 },
  { left: 65.4, top: 18.7, delay: 1.9, duration: 13.5 },
  { left: 35.2, top: 0.1, delay: 2.6, duration: 6.6 },
  { left: 80.9, top: 48.3, delay: 4.2, duration: 10.7 },
  { left: 37.6, top: 43.8, delay: 1.2, duration: 6.2 },
  { left: 81.8, top: 86.8, delay: 0.5, duration: 6.4 },
  { left: 59.8, top: 28.0, delay: 1.0, duration: 6.3 },
  { left: 30.7, top: 36.1, delay: 3.5, duration: 11.2 },
]

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser, authStatus } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStartedAuth, setHasStartedAuth] = useState(false)
  const [showParticles, setShowParticles] = useState(false)

  // Show particles only on client side to avoid hydration issues
  useEffect(() => {
    setShowParticles(true)
  }, [])

  // Effect 1: Exchange authorization code for tokens
  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      console.error('OAuth error:', errorParam)
      setError(errorParam)
      setIsLoading(false)
      setTimeout(() => {
        router.push('/')
      }, 3000)
      return
    }

    if (code && !hasStartedAuth) {
      console.log('🔑 Starting code exchange...', { code: code.substring(0, 10) + '...' })
      setHasStartedAuth(true)

      // Exchange code for tokens
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      console.log('📡 API URL:', API_URL)

      fetch(`${API_URL}/auth/exchange-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ code }),
      })
        .then(async (res) => {
          console.log('📥 Exchange response status:', res.status)
          if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ Exchange failed:', errorText)
            throw new Error('Code exchange failed')
          }
          return res.json()
        })
        .then((data) => {
          console.log('✅ Code exchange successful:', data)
          console.log('🔄 Refreshing user...')
          // Small delay to ensure cookies are set by browser
          setTimeout(() => {
            refreshUser()
          }, 100)
        })
        .catch((err) => {
          console.error('❌ Code exchange error:', err)
          setError('Authentication failed. Please try again.')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/')
          }, 3000)
        })
    }
  }, [searchParams, hasStartedAuth, refreshUser, router])

  // Effect 2: Redirect when authenticated
  useEffect(() => {
    console.log('🔍 Auth status changed:', authStatus, 'hasStartedAuth:', hasStartedAuth)

    if (authStatus === 'authenticated') {
      console.log('✅ Authenticated! Redirecting to /listening...')
      setIsLoading(false)
      setTimeout(() => {
        router.push('/listening')
      }, 1000)
    } else if (authStatus === 'unauthenticated' && hasStartedAuth) {
      console.error('❌ Authentication failed after code exchange')
      setError('Authentication failed. Please try again.')
      setIsLoading(false)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }, [authStatus, router, hasStartedAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-accent/10" />

      {/* Floating particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particlePositions.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-foreground/20 rounded-full animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-md w-full space-y-12 text-center relative z-10">
        {/* Logo with waveform animation */}
        <div className="flex flex-col items-center gap-8">
          {/* Main logo container */}
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-foreground/20 animate-ping-slow" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-2 border-foreground/30 animate-ping-slower" />
            </div>

            {/* Logo */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-2xl animate-float-gentle">
              <Music2 className="w-12 h-12 text-background" />
            </div>
          </div>

          {/* Waveform bars */}
          {!error && (
            <div className="flex items-center justify-center gap-1.5 h-16">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-foreground/40 to-foreground rounded-full animate-waveform"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: '100%',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {error ? (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-3xl font-light tracking-tight text-destructive">
              Authentication Failed
            </h1>
            <p className="text-muted-foreground text-lg">{error}</p>
            <p className="text-sm text-muted-foreground animate-pulse">
              Redirecting to home...
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent animate-gradient">
              Signing you in
            </h1>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl font-light tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
              Welcome to Audiora!
            </h1>
            <p className="text-muted-foreground text-lg animate-pulse">
              Redirecting to your music...
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }

        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            opacity: 0.2;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        @keyframes ping-slower {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            opacity: 0.15;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes waveform {
          0%, 100% {
            transform: scaleY(0.3);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-float-gentle {
          animation: float-gentle 3s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-waveform {
          animation: waveform 1.2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
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
