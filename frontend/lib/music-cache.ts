/**
 * Simple in-memory cache for music API responses
 * Reduces API calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MusicCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Default TTL: Longer for search to reduce API calls
  private readonly SEARCH_TTL = 10 * 60 * 1000; // 10 minutes (increased from 5)
  private readonly TRACK_TTL = 30 * 60 * 1000; // 30 minutes (increased from 10)
  private readonly TRENDING_TTL = 15 * 60 * 1000; // 15 minutes

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
      return entry.data as T;
    }
    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }
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
  }

  /**
   * Get cached search results
   */
  getSearch(query: string, limit: number, offset: number) {
    const normalizedQuery = query.toLowerCase().trim();
    const key = this.getSearchKey(normalizedQuery, limit, offset);
    const cached = this.get(key);
    if (cached) {
      console.log(`Cache HIT: ${key}`);
    } else {
      console.log(`Cache MISS: ${key}`);
    }
    return cached;
  }

  /**
   * Cache search results
   */
  setSearch(query: string, limit: number, offset: number, data: any): void {
    const normalizedQuery = query.toLowerCase().trim();
    const key = this.getSearchKey(normalizedQuery, limit, offset);
    this.set(key, data, this.SEARCH_TTL);
    console.log(`Cache SET: ${key} (TTL: ${this.SEARCH_TTL}ms)`);
  }

  /**
   * Get cached track
   */
  getTrack(trackId: string) {
    const key = this.getTrackKey(trackId);
    return this.get(key);
  }

  /**
   * Cache track
   */
  setTrack(trackId: string, data: any): void {
    const key = this.getTrackKey(trackId);
    this.set(key, data, this.TRACK_TTL);
  }

  /**
   * Get cached trending tracks
   */
  getTrending(genre?: string, limit?: number) {
    const key = this.getTrendingKey(genre, limit);
    return this.get(key);
  }

  /**
   * Cache trending tracks
   */
  setTrending(genre: string | undefined, limit: number | undefined, data: any): void {
    const key = this.getTrendingKey(genre, limit);
    this.set(key, data, this.TRENDING_TTL);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
      }
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
}

// Singleton instance
export const musicCache = new MusicCache();

// Cleanup expired entries every 5 minutes
// SECURITY FIX: Store interval ID to allow cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

if (typeof window !== 'undefined') {
  cleanupInterval = setInterval(() => {
    musicCache.cleanup();
  }, 5 * 60 * 1000);

  // Cleanup on page unload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
  });
}

