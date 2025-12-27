"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMusicPlayerContext } from "@/contexts/music-player-context"
import { Track } from "@/lib/music-client"
import { Clock, ListMusic, Music2, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import Image from "next/image"


interface QueuePanelProps {
  vibeDescription?: string
  onRegenerate?: () => void
  onClearQueue?: () => void
}

export function QueuePanel({ vibeDescription, onRegenerate, onClearQueue }: QueuePanelProps) {
  const { queue, currentTrack, play } = useMusicPlayerContext()

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds) || seconds <= 0) {
      return "0:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTrackClick = (track: Track) => {
    play(track)
  }

  return (
    <Card className="flex-1 flex flex-col bg-background border-border rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden min-h-0 h-full shadow-sm">
      <CardHeader className="pb-2 md:pb-2 flex-shrink-0 p-3 md:p-3 lg:p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Music2 className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-muted-foreground" />
            <CardTitle className="text-sm md:text-sm lg:text-base">
              Queued songs
              {queue.length > 0 && (
                <span className="ml-2 text-xs md:text-xs lg:text-sm text-muted-foreground font-normal">
                  ({queue.length})
                </span>
              )}
            </CardTitle>
          </div>
          {queue.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearQueue}
              className="h-6 w-6 md:h-7 md:w-7 hover:bg-destructive/10 hover:text-destructive rounded-full cursor-pointer"
              title="Clear queue"
            >
              <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
            </Button>
          )}
        </div>

        {vibeDescription ? (
          <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-primary/10 border border-primary/20 group relative">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground/90 font-medium leading-tight flex-1">
              {vibeDescription}
            </p>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                className="h-5 w-5 -mt-1 -mr-1 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                title="Regenerate with same vibe"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs md:text-xs lg:text-sm text-muted-foreground">Up next in your queue</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 max-h-full p-3 md:p-3 lg:p-4 pt-0">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] md:min-h-[200px] text-center px-4">
            <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-muted flex items-center justify-center mb-3 md:mb-4">
              <ListMusic className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-sm md:text-base lg:text-lg font-medium mb-1 md:mb-2">Your queue is empty</h3>
            <p className="text-xs md:text-xs lg:text-sm text-muted-foreground max-w-sm">
              Generate a playlist with AI DJs or search for songs to add them to your queue
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 md:space-y-1">
            {queue.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id

              return (
                <button
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  className={`w-full flex items-center gap-1.5 md:gap-2 p-1.5 md:p-1.5 lg:p-2 rounded-md md:rounded-lg hover:bg-muted transition-colors text-left group ${isCurrentTrack ? 'bg-muted ring-1 md:ring-2 ring-primary' : ''
                    }`}
                >
                  {/* Track Artwork */}
                  <div className="relative w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-md md:rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src="/images/minimalist-abstract-music-waves.jpg"
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 28px, (max-width: 1024px) 32px, 40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-xs lg:text-sm font-medium truncate">{track.title}</p>
                    <p className="text-[10px] md:text-[10px] lg:text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[10px] md:text-[10px] lg:text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                    <span>{formatDuration(track.duration)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

