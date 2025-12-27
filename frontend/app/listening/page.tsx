"use client"

import { SignInModal } from "@/components/auth/sign-in-modal"
import { DJSelector } from "@/components/listening/dj-selector"
import { MusicPlayer } from "@/components/listening/music-player"
import { QueuePanel } from "@/components/listening/queue-panel"
import { SearchBar } from "@/components/listening/search-bar"
import { SuggestionsPanel } from "@/components/listening/suggestions-panel"
import { TrackList } from "@/components/listening/track-list"
import { UserProfile } from "@/components/listening/user-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useMusicPlayerContext } from "@/contexts/music-player-context"
import { useListeningHistory } from "@/hooks/use-listening-history"
import { searchTracks, Track } from "@/lib/music-client"
import { ArrowLeft, Music2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { toast } from "sonner"

export default function ListeningPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)

  const { play, addToQueue, currentTrack } = useMusicPlayerContext()
  const { isAuthenticated, isLoading: isAuthLoading, authStatus } = useAuth()
  const [isSignInOpen, setIsSignInOpen] = useState(false)

  // Initialize listening history tracking (only tracks if authenticated)
  useListeningHistory()

  const handleSearch = useCallback(async (query: string, retryCount = 0) => {
    // SECURITY: Validate and sanitize input
    if (!query || typeof query !== 'string') {
      setSearchQuery("")
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    // SECURITY: Limit input length to prevent DoS
    const MAX_QUERY_LENGTH = 200
    const trimmedQuery = query.trim()
    if (trimmedQuery.length > MAX_QUERY_LENGTH) {
      toast.error('Search query too long. Maximum 200 characters.')
      return
    }

    if (!trimmedQuery) {
      setSearchQuery("")
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const normalizedQuery = trimmedQuery
    setSearchQuery(normalizedQuery)
    setIsLoading(true)
    setShowSearchResults(true)

    try {
      const response = await searchTracks(normalizedQuery, 20)
      const tracks = response?.tracks || []

      // Debug: Log tracks received
      if (tracks.length > 0) {
        console.log('[DEBUG] ListeningPage received tracks:', tracks.length);
        console.log('[DEBUG] First track:', {
          title: tracks[0].title,
          duration: tracks[0].duration,
          durationType: typeof tracks[0].duration,
        });
      }

      if (tracks.length > 0) {
        setSearchResults(tracks)
      } else {
        setSearchResults([])
      }
    } catch (error: any) {
      // Handle rate limiting with retry
      if (error?.statusCode === 429 && retryCount < 2) {
        // Wait with exponential backoff: 2s, 4s
        const delay = Math.pow(2, retryCount + 1) * 1000
        console.warn(`⚠️ Rate limited, retrying in ${delay}ms... (attempt ${retryCount + 1}/2)`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return handleSearch(normalizedQuery, retryCount + 1)
      }

      // Log error only if not rate limited or max retries reached
      if (error?.statusCode !== 429) {
        console.error("Error searching tracks:", error?.message || error)
      } else {
        console.warn("⚠️ Rate limit exceeded. Using cached results if available.")
        // Try to get from cache even if expired
        const { musicCache } = await import('@/lib/music-cache')
        const cached = musicCache.getSearch(normalizedQuery.toLowerCase(), 20, 0)
        if (cached && cached.tracks) {
          console.log("✅ Using cached results despite rate limit")
          setSearchResults(cached.tracks)
          setIsLoading(false)
          return
        }
      }

      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCloseSearch = () => {
    setShowSearchResults(false)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleTrackSelect = async (track: Track) => {
    // SECURITY: Validate track object
    if (!track || typeof track !== 'object' || !track.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Invalid track object:", track)
      }
      return
    }

    // Ensure track has streamUrl before playing
    if (!track.streamUrl || typeof track.streamUrl !== 'string' || track.streamUrl.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.error("Track missing streamUrl:", track.id)
      }
      toast.error('Track is not available for playback')
      return
    }

    // play() will add to queue automatically, so we don't need to call addToQueue separately
    play(track)
  }

  const handleAddToQueue = (track: Track) => {
    const result = addToQueue(track)
    if (result === 'success') {
      toast.success(`${track.title} added to queue`, {
        description: `By ${track.artist}`,
        duration: 3000,
      })
    } else if (result === 'duplicate') {
      toast.info(`${track.title} is already in queue`, {
        duration: 2000,
      })
    } else if (result === 'already-playing') {
      toast.info(`${track.title} is currently playing`, {
        duration: 2000,
      })
    }
  }

  // Removed debug useEffect - was causing unnecessary re-renders

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground bg-pattern-grid-light">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 lg:top-8 lg:left-12 lg:right-12 z-10 flex items-center">
        {/* Back Button - Only show when NOT logged in */}
        {!isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background hover:scale-105 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        )}

        {/* User Profile */}
        <div className="ml-auto">
          <UserProfile />
        </div>
      </div>

      <div className="w-full h-screen flex flex-col pt-16 md:pt-20 lg:pt-24 px-4 md:px-8 lg:px-12 xl:px-20 pb-4 md:pb-6 lg:pb-8">
        <div className="max-w-6xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 min-h-0 overflow-hidden">
          {/* Left Side - Music Player */}
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 xl:gap-6 min-h-0 overflow-hidden">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <MusicPlayer />
            </div>
          </div>

          {/* Right Side - DJ Selector + Queue (when logged in) or Search Results */}
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 xl:gap-6 min-h-0 overflow-hidden">
            {showSearchResults ? (
              <>
                {/* Personalize Card - Show when not logged in (only after auth check completes) */}
                {!isAuthLoading && !isAuthenticated && (
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

                <Card className="flex-1 flex flex-col bg-background border-border rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden min-h-0">
                  <CardHeader className="pb-2 md:pb-3 flex-shrink-0 p-3 md:p-4 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Music2 className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                        <CardTitle className="text-sm md:text-base lg:text-lg">
                          Search Results{searchQuery ? ` for "${searchQuery}"` : ""}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseSearch}
                        className="h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto min-h-0 p-3 md:p-4 pt-0">
                    <TrackList
                      tracks={searchResults}
                      onTrackSelect={handleTrackSelect}
                      onAddToQueue={handleAddToQueue}
                      currentTrackId={currentTrack?.id}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>
              </>
            ) : isAuthLoading || authStatus === 'loading' || authStatus === 'idle' ? (
              // Show loading state while checking authentication (state machine)
              <Card className="flex-1 flex flex-col bg-background border-border rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden min-h-0">
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </CardContent>
              </Card>
            ) : authStatus === 'authenticated' || isAuthenticated ? (
              <>
                {/* DJ Selector - Only show when logged in */}
                <DJSelector />
                {/* Queue Panel - Same size as left containers */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <QueuePanel />
                </div>
              </>
            ) : (
              <SuggestionsPanel />
            )}
          </div>
        </div>
      </div>

      <SignInModal open={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </main>
  )
}

