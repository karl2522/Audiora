"use client"

import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Music2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useMusicPlayerContext } from "@/contexts/music-player-context"

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
    <Card className="h-full flex flex-col bg-background border-border rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden">
      <CardContent className="flex-1 flex flex-col p-2 md:p-3 lg:p-4 xl:p-6 2xl:p-8 justify-between min-h-0">
        {/* Album Art */}
        <div className="relative aspect-square w-full max-w-[140px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[220px] xl:max-w-[280px] 2xl:max-w-sm mx-auto mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 2xl:mb-6 rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden bg-muted flex-shrink-0">
          <Image
            src="/images/minimalist-abstract-music-waves.jpg"
            alt="Now Playing"
            fill
            className="w-full h-full object-cover"
            sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, (max-width: 1024px) 180px, (max-width: 1280px) 220px, (max-width: 1536px) 280px, 384px"
          />
        </div>

        {/* Song Info */}
        <div className="text-center mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 2xl:mb-6 flex-shrink-0">
          <h3 className="text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-medium mb-0.5">
            {currentTrack?.title || "No track selected"}
          </h3>
          <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
            {currentTrack ? `${currentTrack.artist}${currentTrack.genre ? ` • ${currentTrack.genre}` : ''}` : "Select a track to play"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 2xl:mb-6 flex-shrink-0">
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
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5 md:mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-0.5 md:gap-1 lg:gap-2 xl:gap-3 2xl:gap-4 mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 2xl:mb-6 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 rounded-full">
            <Shuffle className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 rounded-full" onClick={previous}>
            <SkipBack className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </Button>
          <Button
            size="lg"
            onClick={togglePlayPause}
            className="h-9 w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16 rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 ml-0.5 md:ml-1" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 rounded-full" onClick={next}>
            <SkipForward className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 rounded-full">
            <Repeat className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 flex-shrink-0">
          <Volume2 className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0" />
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

