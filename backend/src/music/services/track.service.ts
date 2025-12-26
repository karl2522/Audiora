import { Injectable } from '@nestjs/common';
import { AudiusService } from './audius.service';
import { CacheService } from './cache.service';
import { Track } from '../interfaces/audius.interface';

/**
 * Track Service - Business logic layer
 * This service can be extended for AI features later
 */
@Injectable()
export class TrackService {
  constructor(
    private audiusService: AudiusService,
    private cacheService: CacheService,
  ) {}

  /**
   * Search tracks (with caching)
   */
  async searchTracks(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<Track[]> {
    // Check cache first
    const cached = this.cacheService.getSearch<Track[]>(query, limit, offset);
    if (cached) {
      return cached;
    }

    // Fetch from Audius API
    const tracks = await this.audiusService.searchTracks(query, limit, offset);

    // Cache the results
    if (tracks && tracks.length > 0) {
      this.cacheService.setSearch(query, limit, offset, tracks);
    }

    return tracks;
  }

  /**
   * Get trending tracks (with caching)
   */
  async getTrendingTracks(genre?: string, limit = 20): Promise<Track[]> {
    // Check cache first
    const cached = this.cacheService.getTrending<Track[]>(genre, limit);
    if (cached) {
      return cached;
    }

    // Fetch from Audius API
    const tracks = await this.audiusService.getTrendingTracks(genre, limit);

    // Cache the results
    if (tracks && tracks.length > 0) {
      this.cacheService.setTrending(genre, limit, tracks);
    }

    return tracks;
  }

  /**
   * Get track by ID (with caching)
   */
  async getTrackById(trackId: string): Promise<Track | null> {
    // Check cache first
    const cached = this.cacheService.getTrack<Track>(trackId);
    if (cached) {
      return cached;
    }

    // Fetch from Audius API
    const track = await this.audiusService.getTrackById(trackId);

    // Cache the result
    if (track) {
      this.cacheService.setTrack(trackId, track);
    }

    return track;
  }

  /**
   * Get stream URL for a track (with caching)
   */
  async getStreamUrl(trackId: string): Promise<string> {
    // Check cache first
    const cached = this.cacheService.getStreamUrl(trackId);
    if (cached) {
      return cached;
    }

    // Fetch from Audius API
    const streamUrl = await this.audiusService.getStreamUrlForTrack(trackId);

    // Cache the result
    if (streamUrl) {
      this.cacheService.setStreamUrl(trackId, streamUrl);
    }

    return streamUrl;
  }

  /**
   * Get multiple tracks by IDs (for playlists - AI-ready)
   */
  async getTracksByIds(trackIds: string[]): Promise<Track[]> {
    const tracks = await Promise.all(
      trackIds.map((id) => this.getTrackById(id)),
    );
    return tracks.filter((track): track is Track => track !== null);
  }
}

