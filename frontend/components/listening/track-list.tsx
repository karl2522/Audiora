"use client"

import { Track } from "@/lib/music-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Music2, Clock, Plus } from "lucide-react"
import Image from "next/image"
import { memo } from "react"

interface TrackListProps {
  tracks: Track[]
  onTrackSelect: (track: Track) => void
  onAddToQueue?: (track: Track) => void
  currentTrackId?: string
  isLoading?: boolean
}

export const TrackList = memo(function TrackList({ tracks, onTrackSelect, onAddToQueue, currentTrackId, isLoading }: TrackListProps) {
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds) || seconds <= 0) {
      return "0:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-background border-border animate-pulse">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
        <Music2 className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mb-4" />
        <p className="text-sm md:text-base text-muted-foreground">No tracks found</p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Try searching for something else</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tracks.map((track) => {
        const isCurrentTrack = currentTrackId === track.id
        
        return (
          <Card
            key={track.id}
            className={`bg-background border-border transition-all cursor-pointer hover:bg-muted/50 ${
              isCurrentTrack ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTrackSelect(track)}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Artwork */}
                <div className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src="/images/minimalist-abstract-music-waves.jpg"
                    alt={track.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 48px, (max-width: 1024px) 56px, 64px"
                  />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  {/* SECURITY: React escapes by default, but ensure safe rendering */}
                  <h4 className="text-sm md:text-base font-medium truncate" title={track.title}>
                    {track.title || 'Unknown Title'}
                  </h4>
                  <p className="text-xs md:text-sm text-muted-foreground truncate" title={track.artist}>
                    {track.artist || 'Unknown Artist'}
                  </p>
                </div>

                {/* Duration and Actions */}
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">
                    {(() => {
                      const formatted = formatDuration(track.duration);
                      // Debug log for first track
                      if (track.id === tracks[0]?.id && process.env.NODE_ENV === 'development') {
                        console.log('[DEBUG] TrackList formatting duration:', {
                          trackId: track.id,
                          title: track.title,
                          rawDuration: track.duration,
                          formatted,
                        });
                      }
                      return formatted;
                    })()}
                  </span>
                  {onAddToQueue && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-9 md:w-9 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddToQueue(track)
                      }}
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTrackSelect(track)
                    }}
                    title="Play"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
})

