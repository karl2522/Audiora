"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music2, Clock, ListMusic } from "lucide-react"
import { SignInModal } from "@/components/auth/sign-in-modal"
import { useAuth } from "@/contexts/auth-context"
import { useMusicPlayerContext } from "@/contexts/music-player-context"
import { Track } from "@/lib/music-client"
import Image from "next/image"

export function SuggestionsPanel() {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { queue, currentTrack, play } = useMusicPlayerContext()

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTrackClick = (track: Track) => {
    play(track)
  }

  return (
    <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 xl:gap-6 h-full min-h-0">
      {/* Sign In Button - Only show if not authenticated */}
      {!isAuthenticated && (
        <Card className="bg-foreground text-background border-none rounded-lg md:rounded-xl lg:rounded-2xl xl:rounded-3xl flex-shrink-0">
          <CardContent className="p-3 md:p-4 lg:p-6 xl:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-3 lg:gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base lg:text-lg xl:text-xl font-medium mb-0.5 md:mb-1">Personalize your experience</h3>
                <p className="text-xs md:text-sm lg:text-base text-white/70">
                  Sign in to get AI-powered recommendations tailored to your taste.
                </p>
              </div>
              <Button 
                onClick={() => setIsSignInOpen(true)}
                className="bg-background text-foreground hover:bg-background/90 rounded-full px-3 py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-xs md:text-sm lg:text-base whitespace-nowrap w-full sm:w-auto cursor-pointer"
              >
                Sign in to personalize
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue List */}
      <Card className="flex-1 flex flex-col bg-background border-border rounded-lg md:rounded-xl lg:rounded-2xl xl:rounded-3xl overflow-hidden min-h-0">
        <CardHeader className="pb-2 md:pb-3 lg:pb-4 flex-shrink-0 p-3 md:p-4 lg:p-6">
          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
            <Music2 className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-muted-foreground" />
            <CardTitle className="text-sm md:text-base lg:text-lg xl:text-xl">Queued songs</CardTitle>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">Up next in your queue</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0 p-3 md:p-4 lg:p-6 pt-0">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-muted flex items-center justify-center mb-4 md:mb-6">
                <ListMusic className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-muted-foreground" />
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-medium mb-2">Your queue is empty</h3>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground max-w-sm">
                Search for songs to add them to your queue and start listening
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 md:space-y-1 lg:space-y-2">
              {queue.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id
                
                return (
                  <button
                    key={track.id}
                    onClick={() => handleTrackClick(track)}
                    className={`w-full flex items-center gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 p-1.5 md:p-2 lg:p-3 xl:p-4 rounded-md md:rounded-lg lg:rounded-xl hover:bg-muted transition-colors text-left group ${
                      isCurrentTrack ? 'bg-muted ring-2 ring-primary' : ''
                    }`}
                  >
                    {/* Track Artwork */}
                    <div className="relative w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-md md:rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src="/images/minimalist-abstract-music-waves.jpg"
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 28px, (max-width: 1024px) 32px, (max-width: 1280px) 40px, 48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm lg:text-base font-medium truncate">{track.title}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{formatDuration(track.duration)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SignInModal open={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </div>
  )
}

