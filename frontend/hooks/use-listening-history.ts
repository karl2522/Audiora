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

  /**
   * Log track start
   */
  const logStart = useCallback(
    async (track: Track) => {
      if (!isAuthenticated || !track) return;

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
      } catch (error) {
        // Queue for retry if offline
        queuedRequestsRef.current.push(() => logStart(track));
      }
    },
    [isAuthenticated],
  );

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
    } catch (error) {
      // Queue for retry
      queuedRequestsRef.current.push(() => logComplete());
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
    } catch (error) {
      // Queue for retry
      queuedRequestsRef.current.push(() => logSkip());
    }
  }, [isAuthenticated, currentTrack, currentTime]);

  // Effect: Log start when track changes
  useEffect(() => {
    if (currentTrack && isAuthenticated) {
      // If there's an active session for a different track, skip it first
      if (activeHistoryIdRef.current) {
        logSkip();
      }
      logStart(currentTrack);
    }

    // ⚠️ SAFE CLEANUP: Only auto-skip when track actually changes, not on unmount
    // This prevents double-firing when component unmounts, user navigates, or tab reloads
    // We handle skip in the effect above when new track starts, so cleanup is minimal
    return () => {
      // Don't auto-skip on unmount - let the new track's effect handle it
      // This prevents edge cases: component unmounts, page navigation, tab reloads
    };
  }, [currentTrack?.id, isAuthenticated, logStart, logSkip]); // Only when track ID changes

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

