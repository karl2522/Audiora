"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getGoogleOAuthUrl } from "@/lib/auth"
import { Music2 } from "lucide-react"
import { useRef, useState } from "react"

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isRedirectingRef = useRef(false) // Prevent multiple redirects

  const handleGoogleSignIn = () => {
    // Prevent multiple clicks/redirects
    if (isRedirectingRef.current || isLoading) {
      return
    }

    isRedirectingRef.current = true
    setIsLoading(true)

    // Redirect to backend OAuth endpoint
    // The backend will handle the Google OAuth flow and redirect back
    window.location.href = getGoogleOAuthUrl()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border p-8 md:p-10 lg:p-12">
        <DialogHeader className="space-y-6 md:space-y-8 text-center pb-6 md:pb-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-foreground flex items-center justify-center">
              <Music2 className="w-8 h-8 md:w-10 md:h-10 text-background" />
            </div>
          </div>
          <DialogTitle className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight pt-2 text-center">
            Sign In with Audiora
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base text-muted-foreground px-2 text-center">
            Sign in with Google to personalize your music experience with AI-powered recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 md:h-14 rounded-full bg-background text-foreground border border-border hover:bg-muted transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm md:text-base font-medium">Continue with Google</span>
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to Audiora's Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

