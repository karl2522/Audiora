/**
 * Music API Client for Audius integration
 */

import { apiRequest } from './api-client';
import { musicCache } from './music-cache';

/**
 * Track Interface - Includes ALL available data from Audius API for AI processing
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistBio?: string;
  artistLocation?: string;
  artistFollowerCount?: number;
  artwork?: string;
  streamUrl: string;
  duration: number; // in seconds
  genre?: string;
  mood?: string;
  tags?: string[];
  description?: string;
  playCount?: number;
  favoriteCount?: number;
  repostCount?: number;
  createdAt?: string;
  releaseDate?: string;
  permalink?: string;
}

export interface SearchTracksResponse {
  tracks: Track[];
  total: number;
  limit: number;
  offset: number;
}

export interface TrendingTracksResponse {
  tracks: Track[];
}

export interface TrackResponse {
  track: Track;
}

export interface StreamUrlResponse {
  streamUrl: string;
}

/**
 * Search tracks (with caching)
 */
export async function searchTracks(
  query: string,
  limit = 20,
  offset = 0,
): Promise<SearchTracksResponse> {
  // Normalize query for cache key (lowercase, trim)
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check cache first
  const cached = musicCache.getSearch(normalizedQuery, limit, offset);
  if (cached) {
    console.log("✅ Using cached search results for:", query);
    return cached;
  }

  console.log("🔍 Cache miss - fetching from API for:", query);

  // Fetch from API
  const params = new URLSearchParams({
    query: normalizedQuery,
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  try {
    const response = await apiRequest<SearchTracksResponse>(`/music/search?${params.toString()}`);
    
    // Debug: Log first track duration received from API
    if (response?.tracks && response.tracks.length > 0) {
      const firstTrack = response.tracks[0];
      console.log('[DEBUG] Frontend received track:', {
        title: firstTrack.title,
        duration: firstTrack.duration,
        durationType: typeof firstTrack.duration,
        allKeys: Object.keys(firstTrack),
      });
    }
    
    // Cache the response
    if (response && response.tracks && response.tracks.length > 0) {
      console.log("💾 Caching search results for:", query);
      musicCache.setSearch(normalizedQuery, limit, offset, response);
    }
    
    return response;
  } catch (error: any) {
    // If rate limited, try to return cached data even if expired
    if (error?.statusCode === 429) {
      console.warn("⚠️ Rate limited - checking for stale cache");
      const staleCache = musicCache.getSearch(normalizedQuery, limit, offset);
      if (staleCache) {
        console.log("✅ Returning stale cache due to rate limit");
        return staleCache;
      }
    }
    throw error;
  }
}

/**
 * Get trending tracks (with caching)
 */
export async function getTrendingTracks(
  genre?: string,
  limit = 20,
): Promise<TrendingTracksResponse> {
  // Check cache first
  const cached = musicCache.getTrending(genre, limit);
  if (cached) {
    console.log("Using cached trending tracks");
    return cached;
  }

  // Fetch from API
  const params = new URLSearchParams();
  if (genre) params.append('genre', genre);
  params.append('limit', limit.toString());
  
  const queryString = params.toString();
  const response = await apiRequest<TrendingTracksResponse>(
    `/music/trending${queryString ? `?${queryString}` : ''}`,
  );
  
  // Cache the response
  if (response && response.tracks) {
    musicCache.setTrending(genre, limit, response);
  }
  
  return response;
}

/**
 * Get track by ID (with caching)
 */
export async function getTrackById(trackId: string): Promise<TrackResponse> {
  // Check cache first
  const cached = musicCache.getTrack(trackId);
  if (cached) {
    console.log("Using cached track:", trackId);
    return cached;
  }

  // Fetch from API
  const response = await apiRequest<TrackResponse>(`/music/track/${trackId}`);
  
  // Cache the response
  if (response && response.track) {
    musicCache.setTrack(trackId, response);
  }
  
  return response;
}

/**
 * Get stream URL for a track
 */
export async function getStreamUrl(
  trackId: string,
): Promise<StreamUrlResponse> {
  return apiRequest<StreamUrlResponse>(`/music/track/${trackId}/stream`);
}

