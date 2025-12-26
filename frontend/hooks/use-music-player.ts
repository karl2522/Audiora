"use client"

import { Track } from '@/lib/music-client'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseMusicPlayerReturn {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  queue: Track[]
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  togglePlayPause: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  addToQueue: (track: Track) => 'success' | 'duplicate' | 'already-playing'
  clearQueue: () => void
}

export function useMusicPlayer(): UseMusicPlayerReturn {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [queue, setQueue] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Use refs to avoid dependencies on queue/currentIndex
  const queueRef = useRef<Track[]>([])
  const currentIndexRef = useRef<number>(-1)

  // Keep refs in sync
  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const handleNext = useCallback(() => {
    const currentQueue = queueRef.current
    const idx = currentIndexRef.current

    if (currentQueue.length === 0 || idx === -1) return

    // 1. Calculate new queue synchronously (remove current track)
    const updatedQueue = currentQueue.filter((_, index) => index !== idx)

    // 2. Update Queue State
    setQueue(updatedQueue)
    queueRef.current = updatedQueue // Update ref immediately for safety

    // 3. Handle Empty Queue
    if (updatedQueue.length === 0) {
      setCurrentIndex(-1)
      currentIndexRef.current = -1
      setCurrentTrack(null)
      setIsPlaying(false)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      return
    }

    // 4. Calculate Next Index
    // The track that was at idx+1 is now at idx.
    // So we stay at idx, unless idx is now out of bounds (was last item).
    let nextIndex = idx
    if (nextIndex >= updatedQueue.length) {
      nextIndex = 0 // Wrap to start
    }

    // 5. Update Player State
    setCurrentIndex(nextIndex)
    currentIndexRef.current = nextIndex
    const nextTrack = updatedQueue[nextIndex]
    setCurrentTrack(nextTrack)
    setIsPlaying(true)

    // 6. Play Audio
    if (audioRef.current) {
      audioRef.current.src = nextTrack.streamUrl
      audioRef.current.load()
      audioRef.current.play().catch((error) => {
        console.error('Error playing next track:', error)
        setIsPlaying(false)
      })
    }
  }, []) // No dependencies - uses refs instead

  // Store handleNext in a ref so it's always current
  const handleNextRef = useRef(handleNext)
  useEffect(() => {
    handleNextRef.current = handleNext
  }, [handleNext])

  // Initialize audio element - only once, never recreate
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (audioRef.current) {
      return // Already initialized - don't recreate
    }
    const audio = new Audio()
    audio.preload = 'metadata'

    // Event listeners
    audio.addEventListener('loadedmetadata', () => {
      // Update duration from audio element (more accurate than track.duration)
      // But only if it's valid (audio.duration can be NaN)
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener('ended', () => {
      // Use ref to get latest handleNext
      handleNextRef.current()
    })

    audio.addEventListener('error', (e) => {
      const audioElement = e.target as HTMLAudioElement

      // Ignore errors when src is empty or invalid (expected during initialization)
      if (!audioElement.src || audioElement.src === '' || audioElement.src === window.location.href) {
        return
      }

      if (audioElement.error) {
        // Only log meaningful errors (not empty src errors)
        if (audioElement.error.code !== 4) { // MEDIA_ELEMENT_ERROR: Empty src
          console.error('Audio error:', {
            code: audioElement.error.code,
            message: audioElement.error.message,
            src: audioElement.src,
          })
        }
      }
      setIsPlaying(false)
    })

    audioRef.current = audio

    // CRITICAL: Don't cleanup unless component truly unmounts
    // This prevents pausing audio when queue updates cause re-renders
    return () => {
      // Only cleanup on actual unmount, not on re-renders
      if (audioRef.current === audio) {
        // Remove all event listeners to prevent memory leaks
        audio.removeEventListener('loadedmetadata', () => { })
        audio.removeEventListener('timeupdate', () => { })
        audio.removeEventListener('ended', () => { })
        audio.removeEventListener('error', () => { })
        audio.pause()
        audio.src = ''
        audioRef.current = null
      }
    }
  }, []) // Empty deps - initialize ONCE only, never recreate

  // Track the current track ID to prevent unnecessary reloads
  const currentTrackIdRef = useRef<string | null>(null)
  // Track current track state via ref to avoid dependencies
  const currentTrackRef = useRef<Track | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  // Update audio source when track changes
  useEffect(() => {
    if (!audioRef.current) return

    // Only clear audio if currentTrack is explicitly null/undefined
    // Don't clear if it's just missing streamUrl temporarily
    if (!currentTrack) {
      // Only pause if we had a track before (not on initial mount)
      if (currentTrackIdRef.current !== null) {
        audioRef.current.pause()
        audioRef.current.src = ''
        setCurrentTime(0)
        setDuration(0)
        currentTrackIdRef.current = null
      }
      return
    }

    if (!currentTrack.streamUrl) {
      // Don't pause audio here - might be temporary
      return
    }

    const audio = audioRef.current

    // SECURITY: Validate stream URL before setting
    if (!currentTrack.streamUrl || typeof currentTrack.streamUrl !== 'string' || currentTrack.streamUrl.trim() === '') {
      return
    }

    // SECURITY: Validate URL format
    try {
      const url = new URL(currentTrack.streamUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return
      }
    } catch (e) {
      return
    }

    // Check if this is the same track (by ID) - if so, don't reload
    if (currentTrackIdRef.current === currentTrack.id) {
      // Same track - preserve current playback state, don't interfere
      // Only resume if explicitly needed (audio paused but should be playing)
      if (isPlaying && audio.paused) {
        audio.play().catch((error) => {
          if (error.name !== 'NotAllowedError' && process.env.NODE_ENV === 'development') {
            console.error('Error resuming playback:', error)
          }
          setIsPlaying(false)
        })
      }
      // Don't pause if isPlaying is false - let user control that
      return
    }

    // Only update if the URL has changed
    const currentSrc = audio.src || ''
    const newSrc = currentTrack.streamUrl

    // Normalize URLs for comparison (remove trailing slashes, etc.)
    const normalizeUrl = (url: string) => url.replace(/\/$/, '')
    const normalizedCurrent = normalizeUrl(currentSrc)
    const normalizedNew = normalizeUrl(newSrc)

    // Check if URL is different
    if (normalizedCurrent !== normalizedNew) {
      // SECURITY: Ensure we're not setting a page URL as audio source
      try {
        const url = new URL(newSrc)
        if (url.origin === window.location.origin && !newSrc.match(/\.(mp3|ogg|wav|m4a|aac|flac|webm)(\?|$)/i)) {
          return
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid URL format:', newSrc)
        }
        return
      }

      try {
        // Set duration from track object immediately (fallback until audio metadata loads)
        if (currentTrack.duration && currentTrack.duration > 0) {
          setDuration(currentTrack.duration)
        }

        audio.src = newSrc
        audio.load()
        setCurrentTime(0)
        currentTrackIdRef.current = currentTrack.id // Update ref

        // Auto-play when track changes (if was playing)
        if (isPlaying) {
          const playAudio = () => {
            audio.play().catch((error) => {
              // Ignore autoplay errors (browser policy)
              if (error.name !== 'NotAllowedError' && process.env.NODE_ENV === 'development') {
                console.error('Error auto-playing track:', error)
              }
              setIsPlaying(false)
            })
          }

          // Try to play immediately, or wait for canplay event
          if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
            playAudio()
          } else {
            const canPlayHandler = () => {
              playAudio()
              audio.removeEventListener('canplay', canPlayHandler)
            }
            audio.addEventListener('canplay', canPlayHandler, { once: true })
          }
        }
      } catch (error) {
        console.error('Error setting audio source:', error)
        setIsPlaying(false)
      }
    } else {
      // URL is the same, update the ref but don't reload
      currentTrackIdRef.current = currentTrack.id

      if (isPlaying && audio.paused) {
        // URL is the same but audio is paused, resume playing
        audio.play().catch((error) => {
          if (error.name !== 'NotAllowedError' && process.env.NODE_ENV === 'development') {
            console.error('Error resuming playback:', error)
          }
          setIsPlaying(false)
        })
      }
    }
  }, [currentTrack, isPlaying])

  // Removed debug useEffect - was causing unnecessary re-renders

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const play = useCallback((track: Track) => {
    // SECURITY: Validate track object
    if (!track || typeof track !== 'object' || !track.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid track object')
      }
      return
    }

    // SECURITY: Validate and sanitize streamUrl
    if (!track.streamUrl || typeof track.streamUrl !== 'string' || track.streamUrl.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Track missing streamUrl:', track.id)
      }
      return
    }

    // SECURITY: Validate URL format to prevent XSS/SSRF
    try {
      const url = new URL(track.streamUrl)
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invalid URL protocol:', url.protocol)
        }
        return
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid URL format:', track.streamUrl)
      }
      return
    }

    // Add track to queue if not already there
    let trackIndex = -1
    setQueue((prev) => {
      const exists = prev.some(t => t.id === track.id)
      if (!exists) {
        const newQueue = [...prev, track]
        // Find the index of this track in the new queue
        trackIndex = newQueue.findIndex(t => t.id === track.id)
        return newQueue
      } else {
        // Track already in queue, find its index
        trackIndex = prev.findIndex(t => t.id === track.id)
        return prev
      }
    })

    // Update index and current track synchronously
    if (trackIndex !== -1) {
      setCurrentIndex(trackIndex)
    }

    // Set as current track - useEffect will handle audio loading and playing
    setCurrentTrack(track)
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    setIsPlaying(true)
    audioRef.current?.play().catch((error) => {
      console.error('Error resuming audio:', error)
      setIsPlaying(false)
    })
  }, [])

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else if (currentTrack) {
      resume()
    }
  }, [isPlaying, currentTrack, pause, resume])

  const handlePrevious = useCallback(() => {
    const currentQueue = queueRef.current
    const idx = currentIndexRef.current

    if (currentQueue.length === 0 || idx === -1) return

    const prevIndex = idx === 0 ? currentQueue.length - 1 : idx - 1
    setCurrentIndex(prevIndex)
    setCurrentTrack(currentQueue[prevIndex])
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.src = currentQueue[prevIndex].streamUrl
      audioRef.current.load()
      audioRef.current.play().catch((error) => {
        console.error('Error playing previous track:', error)
        setIsPlaying(false)
      })
    }
  }, []) // No dependencies - uses refs instead

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const addToQueue = useCallback((track: Track): 'success' | 'duplicate' | 'already-playing' => {
    // SECURITY: Validate track object
    if (!track || typeof track !== 'object' || !track.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid track object in addToQueue')
      }
      return 'duplicate'
    }

    // Check current track via ref to avoid dependency
    const current = currentTrackRef.current
    if (current && current.id === track.id) {
      return 'already-playing'
    }

    // Use functional update - this should NOT affect current playback
    let added = false
    setQueue((prev) => {
      // Check if track already exists in queue
      const exists = prev.some(t => t.id === track.id)
      if (exists) {
        return prev // Return same reference to prevent re-render
      }
      added = true
      return [...prev, track]
    })

    // CRITICAL: Don't touch currentTrack, isPlaying, audioRef, or any playback state
    // This function should ONLY update the queue array
    return added ? 'success' : 'duplicate'
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    setCurrentIndex(-1)
    pause()
    setCurrentTrack(null)
    if (audioRef.current) {
      audioRef.current.src = ''
    }
  }, [pause])

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    play,
    pause,
    resume,
    togglePlayPause,
    next: handleNext,
    previous: handlePrevious,
    seek,
    setVolume,
    addToQueue,
    clearQueue,
  }
}

