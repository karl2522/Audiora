"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useMusicPlayerContext } from "@/contexts/music-player-context"
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    next,
    previous,
    seek,
    setVolume: setPlayerVolume,
  } = useMusicPlayerContext()

  const [mounted, setMounted] = useState(false)
  const [volumeSlider, setVolumeSlider] = useState([80])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setVolumeSlider([volume])
  }, [volume])

  const handleVolumeChange = (value: number[]) => {
    setVolumeSlider(value)
    setPlayerVolume(value[0])
  }

  const formatTime = (seconds: number | undefined) => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds) || seconds <= 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="h-full flex flex-col bg-background border-border rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm">
      <CardContent className="flex-1 flex flex-col p-3 md:p-4 lg:p-5 xl:p-6 2xl:p-8 justify-between min-h-0">
        {/* Album Art - Reduced size for better fit on medium screens */}
        <div className="relative aspect-square w-full max-w-[120px] sm:max-w-[140px] md:max-w-[150px] lg:max-w-[160px] xl:max-w-[240px] 2xl:max-w-sm mx-auto mb-1 md:mb-1.5 lg:mb-2 xl:mb-4 2xl:mb-6 rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-md">
          <Image
            src="/images/minimalist-abstract-music-waves.jpg"
            alt="Now Playing"
            fill
            className="w-full h-full object-cover"
            sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, (max-width: 1024px) 150px, (max-width: 1280px) 160px, (max-width: 1536px) 240px, 384px"
          />
        </div>

        {/* Song Info - Reduced margins */}
        <div className="text-center mb-1 md:mb-1.5 lg:mb-2 xl:mb-4 2xl:mb-6 flex-shrink-0 px-2">
          <h3 className="text-sm md:text-base lg:text-base xl:text-xl 2xl:text-2xl font-medium mb-0.5 truncate">
            {currentTrack?.title || "No track selected"}
          </h3>
          <p className="text-xs md:text-sm lg:text-sm xl:text-base text-muted-foreground truncate">
            {currentTrack ? `${currentTrack.artist}${currentTrack.genre ? ` • ${currentTrack.genre}` : ''}` : "Select a track to play"}
          </p>
        </div>

        {/* Progress Bar - Compact spacing */}
        <div className="mb-1 md:mb-1.5 lg:mb-1.5 xl:mb-4 2xl:mb-6 flex-shrink-0">
          <div className="w-full">
            {mounted ? (
              <Slider
                value={[currentTime]}
                max={duration || 1}
                step={1}
                onValueChange={(value) => seek(value[0])}
                className="w-full"
                disabled={!currentTrack}
              />
            ) : (
              <div className="relative h-1.5 w-full rounded-full bg-primary/20">
                <div className="absolute h-full bg-primary rounded-full" style={{ width: '0%' }} />
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls - Adjusted sizes and gaps */}
        <div className="flex items-center justify-center gap-1 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5 mb-1 md:mb-1.5 lg:mb-2 xl:mb-4 2xl:mb-6 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 lg:h-9 lg:w-9 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12 rounded-full hover:bg-muted/50">
            <Shuffle className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 lg:h-9 lg:w-9 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12 rounded-full hover:bg-muted/50" onClick={previous}>
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
          </Button>
          <Button
            size="lg"
            onClick={togglePlayPause}
            className="h-10 w-10 md:h-12 md:w-12 lg:h-12 lg:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:scale-105 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 xl:w-8 xl:h-8" />
            ) : (
              <Play className="w-5 h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 xl:w-8 xl:h-8 ml-0.5 md:ml-1" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 lg:h-9 lg:w-9 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12 rounded-full hover:bg-muted/50" onClick={next}>
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 lg:h-9 lg:w-9 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12 rounded-full hover:bg-muted/50">
            <Repeat className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 md:gap-3 lg:gap-3 xl:gap-4 flex-shrink-0 px-1">
          <Volume2 className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            {mounted ? (
              <Slider
                value={volumeSlider}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            ) : (
              <div className="relative h-1.5 w-full rounded-full bg-primary/20">
                <div className="absolute h-full bg-primary rounded-full" style={{ width: `${volumeSlider[0]}%` }} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

