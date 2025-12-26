"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useMusicPlayerContext } from '@/contexts/music-player-context';
import { Track } from '@/lib/music-client';
import {
  logTrackStart,
  logTrackComplete,
  logTrackSkip,
} from '@/lib/history-client';

/**
 * Hook for tracking listening history
 * Only tracks authenticated users
 * Uses currentTime from music player state (no separate progress tracking)
 */
export function useListeningHistory() {
  const { isAuthenticated } = useAuth();
  const { currentTrack, currentTime, duration, isPlaying } =
    useMusicPlayerContext();

  const activeHistoryIdRef = useRef<string | null>(null);
  const queuedRequestsRef = useRef<Array<() => Promise<void>>>([]);
  const lastLoggedTrackIdRef = useRef<string | null>(null); // Track last logged track to prevent duplicates
  const isLoggingRef = useRef(false); // Prevent concurrent logStart calls
  const logStartTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce timer
  const logStartRef = useRef<((track: Track) => Promise<void>) | null>(null); // Store latest logStart callback
  const logSkipRef = useRef<(() => Promise<void>) | null>(null); // Store latest logSkip callback

  /**
   * Log track start with debouncing and duplicate prevention
   */
  const logStart = useCallback(
    async (track: Track) => {
      if (!isAuthenticated || !track) return;

      // Prevent duplicate calls for the same track
      if (lastLoggedTrackIdRef.current === track.id) {
        return;
      }

      // Prevent concurrent calls
      if (isLoggingRef.current) {
        return;
      }

      // Clear any pending debounce timer
      if (logStartTimeoutRef.current) {
        clearTimeout(logStartTimeoutRef.current);
        logStartTimeoutRef.current = null;
      }

      // Debounce: wait 300ms before actually logging
      logStartTimeoutRef.current = setTimeout(async () => {
        // Double-check we're not already logging this track
        if (lastLoggedTrackIdRef.current === track.id || isLoggingRef.current) {
          return;
        }

        isLoggingRef.current = true;

        try {
          const response = await logTrackStart({
            trackId: track.id,
            trackTitle: track.title,
            trackArtist: track.artist,
            trackGenre: track.genre,
            trackMood: track.mood,
            trackDuration: track.duration,
          });
          activeHistoryIdRef.current = response.historyId;
          lastLoggedTrackIdRef.current = track.id; // Mark as logged
        } catch (error: any) {
          // Handle rate limiting - don't retry immediately
          if (error?.statusCode === 429) {
            console.warn('Rate limited on track start, will retry later');
            // Don't queue for immediate retry on rate limit
            // The next track change will try again
          } else {
            // Queue for retry if offline or other errors - use the callback directly
            queuedRequestsRef.current.push(() => logStart(track));
          }
        } finally {
          isLoggingRef.current = false;
        }
      }, 300);
    },
    [isAuthenticated],
  );

  // Update ref after callback is created
  logStartRef.current = logStart;

  /**
   * Log track completion
   */
  const logComplete = useCallback(async () => {
    if (!isAuthenticated || !currentTrack) return;

    try {
      await logTrackComplete({
        trackId: currentTrack.id,
        durationPlayed: Math.floor(currentTime),
      });
      activeHistoryIdRef.current = null;
      lastLoggedTrackIdRef.current = null; // Reset so next track can be logged
    } catch (error: any) {
      // Handle rate limiting
      if (error?.statusCode === 429) {
        console.warn('Rate limited on track complete');
        // Don't retry immediately
      } else {
        // Queue for retry
        queuedRequestsRef.current.push(() => logComplete());
      }
    }
  }, [isAuthenticated, currentTrack, currentTime]);

  /**
   * Log track skip
   */
  const logSkip = useCallback(async () => {
    if (!isAuthenticated || !currentTrack) return;

    try {
      await logTrackSkip({
        trackId: currentTrack.id,
        durationPlayed: Math.floor(currentTime),
      });
      activeHistoryIdRef.current = null;
      lastLoggedTrackIdRef.current = null; // Reset so next track can be logged
    } catch (error: any) {
      // Handle rate limiting
      if (error?.statusCode === 429) {
        console.warn('Rate limited on track skip');
        // Don't retry immediately
      } else {
        // Queue for retry
        queuedRequestsRef.current.push(() => logSkip());
      }
    }
  }, [isAuthenticated, currentTrack, currentTime]);

  // Update ref after callback is created
  logSkipRef.current = logSkip;

  // Effect: Log start when track changes
  useEffect(() => {
    if (currentTrack && isAuthenticated && logStartRef.current) {
      // Only log if track actually changed (not just a re-render)
      if (lastLoggedTrackIdRef.current !== currentTrack.id) {
        // If there's an active session for a different track, skip it first
        if (activeHistoryIdRef.current && lastLoggedTrackIdRef.current && logSkipRef.current) {
          logSkipRef.current();
        }
        logStartRef.current(currentTrack);
      }
    }

    // Cleanup: clear debounce timer on unmount or track change
    return () => {
      if (logStartTimeoutRef.current) {
        clearTimeout(logStartTimeoutRef.current);
        logStartTimeoutRef.current = null;
      }
    };
  }, [currentTrack?.id, isAuthenticated]); // Only depend on track ID and auth, not callbacks

  // No progress tracking effect needed
  // Progress already tracked in music player state (currentTime)
  // Final durationPlayed sent on complete/skip only

  // Effect: Log completion when track ends
  // ⚠️ COMPLETION THRESHOLD: currentTime >= duration - 1 (1 second before end)
  // This threshold is consistent with discovery rate filtering (>= 30s for meaningful plays)
  useEffect(() => {
    if (currentTrack && duration > 0 && currentTime >= duration - 1) {
      logComplete();
    }
  }, [currentTime, duration, currentTrack, logComplete]);

  // Effect: Retry queued requests when online
  useEffect(() => {
    const retryQueued = async () => {
      if (queuedRequestsRef.current.length > 0 && isAuthenticated) {
        const requests = [...queuedRequestsRef.current];
        queuedRequestsRef.current = [];

        for (const request of requests) {
          try {
            await request();
          } catch (error) {
            // Re-queue if still failing
            queuedRequestsRef.current.push(request);
          }
        }
      }
    };

    window.addEventListener('online', retryQueued);
    return () => window.removeEventListener('online', retryQueued);
  }, [isAuthenticated]);

  return {
    logStart,
    logComplete,
    logSkip,
    // Removed: logPause, logResume (not needed for AI)
  };
}

