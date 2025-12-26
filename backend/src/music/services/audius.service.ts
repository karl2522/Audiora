import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AudiusTrack,
  AudiusSearchResponse,
  AudiusTrendingResponse,
  AudiusTrackResponse,
  Track,
} from '../interfaces/audius.interface';

@Injectable()
export class AudiusService {
  private readonly logger = new Logger(AudiusService.name);
  private readonly baseUrl: string;
  private readonly discoveryProviders: string[];

  constructor(private configService: ConfigService) {
    // Audius discovery providers (fallback for redundancy)
    this.discoveryProviders = [
      'https://discoveryprovider.audius.co',
      'https://discoveryprovider2.audius.co',
      'https://discoveryprovider3.audius.co',
    ];
    this.baseUrl = this.discoveryProviders[0];
  }

  /**
   * Make a request to Audius API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    retries = 3,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.discoveryProviders.length; i++) {
      const provider = this.discoveryProviders[i];
      
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const url = `${provider}${endpoint}`;
          this.logger.debug(`Requesting: ${url} (attempt ${attempt + 1})`);

          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
            },
            // Add timeout
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => response.statusText);
            this.logger.error(`Audius API error: ${response.status} ${response.statusText} - ${errorText}`);
            throw new HttpException(
              `Audius API error: ${response.statusText} (${response.status})`,
              response.status,
            );
          }

          const data = await response.json();
          return data as T;
        } catch (error: any) {
          lastError = error;
          
          // If it's a timeout or network error, try next provider
          if (error.name === 'AbortError' || error.code === 'ECONNREFUSED') {
            this.logger.warn(
              `Provider ${provider} failed, trying next...`,
            );
            break; // Try next provider
          }

          // If it's an HTTP error, wait before retry
          if (attempt < retries - 1) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    throw new HttpException(
      `Failed to fetch from Audius API after all retries: ${lastError?.message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Normalize Audius track to our Track interface
   * Captures ALL available data for AI processing
   */
  private normalizeTrack(audiusTrack: AudiusTrack): Track {
    // Get best quality artwork
    const artwork =
      audiusTrack.artwork?.['1000x1000'] ||
      audiusTrack.artwork?.['480x480'] ||
      audiusTrack.artwork?.['150x150'] ||
      audiusTrack.user.profile_picture?.['480x480'] ||
      undefined;

    // Audius API returns duration in SECONDS (not milliseconds!)
    // According to Audius API docs: duration is an integer representing track length in seconds
    const rawDuration = audiusTrack.duration;
    let durationInSeconds = 0;
    
    if (rawDuration !== undefined && rawDuration !== null) {
      if (typeof rawDuration === 'number' && rawDuration > 0) {
        // Audius returns duration in seconds, use as-is
        durationInSeconds = Math.floor(rawDuration);
      } else if (typeof rawDuration === 'number' && rawDuration === 0) {
        // Duration is explicitly 0
        durationInSeconds = 0;
        this.logger.warn(`Track ${audiusTrack.id} has duration 0`);
      }
    } else {
      // Duration is missing/undefined
      this.logger.warn(`Track ${audiusTrack.id} missing duration field`);
    }

    return {
      id: audiusTrack.id,
      title: audiusTrack.title,
      artist: audiusTrack.user.name || audiusTrack.user.handle,
      artistId: audiusTrack.user.id,
      artistHandle: audiusTrack.user.handle,
      artistBio: audiusTrack.user.bio,
      artistLocation: audiusTrack.user.location,
      artistFollowerCount: audiusTrack.user.follower_count,
      artwork,
      streamUrl: audiusTrack.stream_url || this.getStreamUrl(audiusTrack.id),
      duration: durationInSeconds, // Convert ms to seconds, default to 0 if invalid
      genre: audiusTrack.genre,
      mood: audiusTrack.mood,
      tags: audiusTrack.tags?.split(',').map((t) => t.trim()).filter(Boolean) || [],
      description: audiusTrack.description,
      playCount: audiusTrack.play_count,
      favoriteCount: audiusTrack.favorite_count,
      repostCount: audiusTrack.repost_count,
      createdAt: audiusTrack.created_at,
      releaseDate: audiusTrack.release_date,
      permalink: audiusTrack.permalink,
    };
  }

  /**
   * Get stream URL for a track
   */
  private getStreamUrl(trackId: string): string {
    // Audius stream URL format
    return `${this.baseUrl}/v1/tracks/${trackId}/stream`;
  }

  /**
   * Search tracks
   */
  async searchTracks(query: string, limit = 20, offset = 0): Promise<Track[]> {
    try {
      // Build query string with app_name parameter (required by Audius API)
      const params = new URLSearchParams({
        query: query,
        limit: limit.toString(),
        offset: offset.toString(),
        app_name: 'Audiora', // Required by Audius API
      });
      const endpoint = `/v1/tracks/search?${params.toString()}`;
      this.logger.log(`Searching Audius for: "${query}" (limit: ${limit}, offset: ${offset})`);
      
      const response = await this.makeRequest<AudiusSearchResponse>(endpoint);

      if (!response) {
        this.logger.warn('Audius API returned null/undefined response');
        return [];
      }

      if (!response.data || !Array.isArray(response.data)) {
        this.logger.warn(`Audius API returned invalid data structure: ${JSON.stringify(response).substring(0, 200)}`);
        return [];
      }

      this.logger.log(`Found ${response.data.length} tracks from Audius API`);

      const filteredTracks = response.data.filter((track) => track.is_streamable !== false);
      this.logger.log(`Filtered to ${filteredTracks.length} streamable tracks`);

      // Log sample track durations for debugging
      if (filteredTracks.length > 0) {
        const sampleTrack = filteredTracks[0];
        this.logger.log(`[DEBUG] Sample track from Audius API:`);
        this.logger.log(`  - Title: ${sampleTrack.title}`);
        this.logger.log(`  - Duration (raw from API): ${sampleTrack.duration} (type: ${typeof sampleTrack.duration})`);
        this.logger.log(`  - Duration is in SECONDS (per Audius API docs)`);
        this.logger.log(`  - Full track keys: ${Object.keys(sampleTrack).join(', ')}`);
      }

      const normalizedTracks = filteredTracks.map((track) => {
        const normalized = this.normalizeTrack(track);
        if (normalized.id === filteredTracks[0]?.id) {
          this.logger.log(`[DEBUG] After normalization:`);
          this.logger.log(`  - Duration: ${normalized.duration}s`);
        }
        return normalized;
      });

      return normalizedTracks;
    } catch (error: any) {
      this.logger.error(`Error searching tracks: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get trending tracks
   */
  async getTrendingTracks(genre?: string, limit = 20): Promise<Track[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        app_name: 'Audiora', // Required by Audius API
      });
      if (genre) {
        params.append('genre', genre);
      }
      const endpoint = `/v1/tracks/trending?${params.toString()}`;

      const response = await this.makeRequest<AudiusTrendingResponse>(endpoint);

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .filter((track) => track.is_streamable !== false)
        .map((track) => this.normalizeTrack(track));
    } catch (error) {
      this.logger.error(
        `Error fetching trending tracks: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get track by ID
   */
  async getTrackById(trackId: string): Promise<Track | null> {
    try {
      const endpoint = `/v1/tracks/${trackId}?app_name=Audiora`;
      const response = await this.makeRequest<AudiusTrackResponse>(endpoint);

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        return null;
      }

      const track = response.data[0];
      if (track.is_streamable === false) {
        return null;
      }

      return this.normalizeTrack(track);
    } catch (error) {
      this.logger.error(`Error fetching track: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get stream URL for a track
   */
  async getStreamUrlForTrack(trackId: string): Promise<string> {
    const track = await this.getTrackById(trackId);
    if (!track) {
      throw new HttpException('Track not found', HttpStatus.NOT_FOUND);
    }
    return track.streamUrl;
  }
}

