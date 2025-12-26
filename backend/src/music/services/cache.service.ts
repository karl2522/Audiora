import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Simple in-memory cache service for music API responses
 * Reduces external API calls and improves performance
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: Map<string, CacheEntry<any>> = new Map();

  // Default TTL values
  private readonly SEARCH_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TRACK_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly TRENDING_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly STREAM_URL_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Generate cache key for search
   */
  private getSearchKey(query: string, limit: number, offset: number): string {
    return `search:${query.toLowerCase().trim()}:${limit}:${offset}`;
  }

  /**
   * Generate cache key for track
   */
  private getTrackKey(trackId: string): string {
    return `track:${trackId}`;
  }

  /**
   * Generate cache key for trending
   */
  private getTrendingKey(genre?: string, limit?: number): string {
    return `trending:${genre || 'all'}:${limit || 20}`;
  }

  /**
   * Generate cache key for stream URL
   */
  private getStreamUrlKey(trackId: string): string {
    return `stream:${trackId}`;
  }

  /**
   * Check if entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (this.isValid(entry)) {
      this.logger.debug(`Cache HIT for key: ${key}`);
      return entry!.data as T; // Safe to use ! here because isValid checks entry exists
    }
    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
      this.logger.debug(`Cache EXPIRED for key: ${key}`);
    }
    this.logger.debug(`Cache MISS for key: ${key}`);
    return null;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.logger.debug(`Cache SET for key: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Get cached search results
   */
  getSearch<T>(query: string, limit: number, offset: number): T | null {
    const key = this.getSearchKey(query, limit, offset);
    return this.get<T>(key);
  }

  /**
   * Cache search results
   */
  setSearch<T>(query: string, limit: number, offset: number, data: T): void {
    const key = this.getSearchKey(query, limit, offset);
    this.set(key, data, this.SEARCH_TTL);
  }

  /**
   * Get cached track
   */
  getTrack<T>(trackId: string): T | null {
    const key = this.getTrackKey(trackId);
    return this.get<T>(key);
  }

  /**
   * Cache track
   */
  setTrack<T>(trackId: string, data: T): void {
    const key = this.getTrackKey(trackId);
    this.set(key, data, this.TRACK_TTL);
  }

  /**
   * Get cached trending tracks
   */
  getTrending<T>(genre?: string, limit?: number): T | null {
    const key = this.getTrendingKey(genre, limit);
    return this.get<T>(key);
  }

  /**
   * Cache trending tracks
   */
  setTrending<T>(genre: string | undefined, limit: number | undefined, data: T): void {
    const key = this.getTrendingKey(genre, limit);
    this.set(key, data, this.TRENDING_TTL);
  }

  /**
   * Get cached stream URL
   */
  getStreamUrl(trackId: string): string | null {
    const key = this.getStreamUrlKey(trackId);
    return this.get<string>(key);
  }

  /**
   * Cache stream URL
   */
  setStreamUrl(trackId: string, streamUrl: string): void {
    const key = this.getStreamUrlKey(trackId);
    this.set(key, streamUrl, this.STREAM_URL_TTL);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval(intervalMs = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
    this.logger.log(`Cache cleanup interval started (every ${intervalMs}ms)`);
  }
}

