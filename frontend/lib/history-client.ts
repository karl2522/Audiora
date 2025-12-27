/**
 * History API Client for listening history tracking
 */

import { apiRequest } from './api-client';

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackGenre?: string;
  trackMood?: string;
  startedAt: string;
  completedAt?: string;
  skippedAt?: string;
  durationPlayed: number;
  trackDuration: number;
  completed: boolean;
  skipped: boolean;
}

export interface ListeningStats {
  totalTracksPlayed: number;
  totalListeningTime: number;
  mostPlayedTracks: Array<{
    trackId: string;
    playCount: number;
  }>;
  favoriteGenres: Array<{
    genre: string;
    playCount: number;
  }>;
}

export interface UserTasteProfile {
  topGenres: string[];
  topArtists: string[];
  avgTrackCompletionRate: number;
  skipHeavyGenres: string[];
  listeningTimeOfDay: string[];
  moodPreference: string[];
  discoveryRate: number;
}

/**
 * Log track start
 */
export async function logTrackStart(data: {
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackGenre?: string;
  trackMood?: string;
  trackDuration: number;
}): Promise<{ success: boolean; historyId: string }> {
  return apiRequest<{ success: boolean; historyId: string }>(
    '/music/history/start',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

/**
 * Log track completion
 */
export async function logTrackComplete(data: {
  trackId: string;
  durationPlayed: number;
}): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/music/history/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log track skip
 */
export async function logTrackSkip(data: {
  trackId: string;
  durationPlayed: number;
}): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/music/history/skip', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ❌ REMOVED: logTrackProgress
// Progress tracked in memory (frontend), final durationPlayed sent on complete/skip

// ❌ REMOVED: logTrackPause and logTrackResume
// Pause/resume is UI analytics, not taste analytics

/**
 * Get user's listening history
 */
export async function getListeningHistory(options?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{
  history: PlayHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const queryString = params.toString();
  return apiRequest<{
    history: PlayHistoryEntry[];
    total: number;
    limit: number;
    offset: number;
  }>(`/music/history${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get AI-ready user taste profile
 */
export async function getTasteProfile(): Promise<UserTasteProfile> {
  return apiRequest<UserTasteProfile>('/music/history/taste-profile');
}

/**
 * Get listening statistics
 */
export async function getListeningStats(): Promise<ListeningStats> {
  return apiRequest<ListeningStats>('/music/history/stats');
}

/**
 * Delete play history entry
 */
export async function deleteHistoryEntry(
  id: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/music/history/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Delete all play history
 */
export async function deleteAllHistory(): Promise<{
  success: boolean;
  deletedCount: number;
}> {
  return apiRequest<{ success: boolean; deletedCount: number }>(
    '/music/history',
    {
      method: 'DELETE',
    },
  );
}


