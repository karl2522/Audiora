import { Injectable, Logger } from '@nestjs/common';
import {
  AudioraDJPlaylist,
  CandidatePoolOptions,
  TrackScore,
} from '../dto/dj.dto';
import { UserTasteProfile } from '../dto/history.dto';
import { Track } from '../interfaces/audius.interface';
import { PlayHistoryRepository } from '../repositories/play-history.repository';
import { AIBSessionParameters, AIService } from './ai.service';
import { AudiusService } from './audius.service';
import { CacheService } from './cache.service';
import { HistoryService } from './history.service';

@Injectable()
export class AudioraDJService {
  private readonly logger = new Logger(AudioraDJService.name);

  constructor(
    private historyService: HistoryService,
    private audiusService: AudiusService,
    private cacheService: CacheService,
    private playHistoryRepository: PlayHistoryRepository,
    private aiService: AIService,
  ) { }

  /**
   * Generate personalized playlist for user
   * @param userId - User ID
   * @param sessionLength - Number of tracks (default: 15, max: 50)
   * @param maxSessionLength - Maximum allowed session length (default: 50)
   */
  async generatePlaylist(
    userId: string,
    sessionLength: number = 15,
    maxSessionLength: number = 50,
  ): Promise<AudioraDJPlaylist> {
    // Validate and clamp session length
    const validatedSessionLength = Math.min(
      Math.max(1, sessionLength), // Minimum 1 track
      maxSessionLength, // Maximum 50 tracks (or custom max)
    );

    // Check cache first
    const cacheKey = `audiora-dj:${userId}:${validatedSessionLength}`;
    const cached = this.cacheService.get<AudioraDJPlaylist>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for Audiora DJ playlist: ${userId}`);
      return cached;
    }
    // this.logger.log(`Cache bypassed for testing AI integration`);

    // Get user taste profile
    const profile = await this.historyService.buildUserTasteProfile(userId);

    // Cold start guard
    if (!profile || profile.topGenres.length === 0) {
      this.logger.log(`Cold start for user ${userId} - returning fallback playlist`);
      return this.getFallbackPlaylist(userId, validatedSessionLength);
    }

    // 🧠 AI INTEGRATION: Get Session Parameters
    const context = `Time: ${new Date().toLocaleTimeString()}, Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`;
    let aiParams: AIBSessionParameters | null = null;

    try {
      aiParams = await this.aiService.getSessionParameters(profile, context);
      if (aiParams) {
        this.logger.log(`🤖 AI Session Parameters: ${JSON.stringify(aiParams)}`);
      }
    } catch (error) {
      this.logger.warn('Failed to get AI parameters, falling back to rule-based logic');
    }

    // Build candidate pool
    const candidates = await this.buildCandidatePool(userId, profile, {
      maxCandidates: 500,
      includeDiscovery: true,
      discoveryPercentage: 0.2,
      excludeRecentDays: 7,
      excludeGenres: aiParams?.filters?.exclude_genres, // Apply AI filters
    });

    if (candidates.length === 0) {
      this.logger.warn(`Empty candidate pool for user ${userId} - returning fallback playlist`);
      return this.getFallbackPlaylist(userId, validatedSessionLength);
    }

    // Score all tracks (batched for performance)
    const scoredTracks = await this.batchScoreTracks(
      candidates,
      profile,
      userId,
      aiParams?.weights // Pass AI weights
    );

    // Sort by score (highest first)
    scoredTracks.sort((a, b) => b.score - a.score);

    // Take top N tracks
    const topTracks = scoredTracks.slice(0, validatedSessionLength);

    // Optional: Shuffle within top 10 for variation
    const shuffled = this.shuffleTopTracks(
      topTracks.map((ts) => ts.track),
      Math.min(10, validatedSessionLength),
    );

    const playlist: AudioraDJPlaylist = {
      userId,
      generatedAt: new Date(),
      tracks: shuffled,
      sessionLength: shuffled.length,
      vibeDescription: aiParams?.vibe_description || "Personalized mix based on your taste", // Fallback description
      metadata: {
        avgCompletionRate: profile.avgTrackCompletionRate,
        topGenres: profile.topGenres.slice(0, 3),
        topArtists: profile.topArtists.slice(0, 3),
      },
    };

    // Cache playlist for 15 minutes
    this.cacheService.set(cacheKey, playlist, 15 * 60 * 1000);

    // Store metadata for analytics (optional - can be implemented later)
    // await this.storePlaylistMetadata(playlist);

    this.logger.log(
      `Generated Audiora DJ playlist for user ${userId}: ${playlist.tracks.length} tracks`,
    );

    return playlist;
  }

  /**
   * Build candidate pool of tracks
   */
  private async buildCandidatePool(
    userId: string,
    profile: UserTasteProfile,
    options: CandidatePoolOptions & { excludeGenres?: string[] } = {},
  ): Promise<Track[]> {
    const {
      maxCandidates = 500,
      includeDiscovery = true,
      discoveryPercentage = 0.2,
      excludeRecentDays = 7,
      excludeGenres = [],
    } = options;

    // Get recently played track IDs
    const recentTracks = await this.getRecentTrackIds(userId, excludeRecentDays);

    // Query Audius for tracks matching top genres (60% of pool)
    const genreLimit = Math.floor(maxCandidates * 0.6);
    const genreTracks = await this.audiusService.searchByGenres(
      profile.topGenres.slice(0, 3),
      genreLimit,
    );

    // Query Audius for tracks from top artists (20% of pool)
    const artistLimit = Math.floor(maxCandidates * 0.2);
    const artistTracks = await this.audiusService.searchByArtists(
      profile.topArtists.slice(0, 5),
      artistLimit,
    );

    // Discovery tracks (20%)
    const discoveryLimit = includeDiscovery
      ? Math.floor(maxCandidates * discoveryPercentage)
      : 0;
    const discoveryTracks =
      discoveryLimit > 0
        ? await this.audiusService.getDiscoveryTracks(
          profile.topGenres,
          discoveryLimit,
        )
        : [];

    // Combine and deduplicate
    const allTracks = [...genreTracks, ...artistTracks, ...discoveryTracks];
    const uniqueTracks = this.deduplicateTracks(allTracks);

    // Filter out skip-heavy genres AND AI-excluded genres
    const filtered = uniqueTracks.filter(
      (track) =>
        !profile.skipHeavyGenres.includes(track.genre || '') &&
        !excludeGenres.includes(track.genre || '')
    );

    // Filter out recently played
    const finalCandidates = filtered.filter(
      (track) => !recentTracks.includes(track.id),
    );

    this.logger.debug(
      `Built candidate pool: ${finalCandidates.length} tracks (from ${allTracks.length} total)`,
    );

    return finalCandidates.slice(0, maxCandidates);
  }

  /**
   * Batch score tracks for performance
   */
  private async batchScoreTracks(
    tracks: Track[],
    profile: UserTasteProfile,
    userId: string,
    weights?: AIBSessionParameters['weights'],
  ): Promise<TrackScore[]> {
    const BATCH_SIZE = 100; // Process 100 tracks at a time
    const scoredTracks: TrackScore[] = [];

    for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
      const batch = tracks.slice(i, i + BATCH_SIZE);
      const batchScores = batch.map((track) => {
        const score = this.scoreTrack(track, profile, weights);
        const breakdown = this.getScoreBreakdown(track, profile);

        // Log scoring for debugging (first track only)
        if (i === 0 && batch.indexOf(track) === 0) {
          this.logTrackScoring(track, score, breakdown);
        }

        return {
          track,
          score,
          breakdown,
        };
      });

      scoredTracks.push(...batchScores);
    }

    return scoredTracks;
  }

  /**
   * Score a track based on user taste profile
   */
  private scoreTrack(
    track: Track,
    profile: UserTasteProfile,
    weights?: AIBSessionParameters['weights']
  ): number {
    // Genre match (0-1)
    const genreMatch = this.calculateGenreMatch(track, profile);

    // Artist match (0-1)
    const artistMatch = this.calculateArtistMatch(track, profile);

    // Mood match (0-1)
    const moodMatch = this.calculateMoodMatch(track, profile);

    // Novelty (0-1)
    const novelty = this.calculateNovelty(track, profile);

    // Base score (Use AI weights if available, else defaults)
    const wGenre = weights?.genre_match ?? 0.4;
    const wArtist = weights?.artist_match ?? 0.3;
    const wMood = weights?.mood_match ?? 0.2;
    const wNovelty = weights?.novelty ?? 0.1;

    const baseScore =
      genreMatch * wGenre +
      artistMatch * wArtist +
      moodMatch * wMood +
      novelty * wNovelty;

    // Completion rate boost
    const completionRateBoost =
      0.8 + profile.avgTrackCompletionRate * 0.4;

    // Time relevance boost
    const timeRelevanceBoost = this.calculateTimeRelevance(profile);

    // Final score
    const finalScore = baseScore * completionRateBoost * timeRelevanceBoost;

    // ⚠️ IMPORTANT: Renormalize to 0-1 after boosts
    // Boosts can exceed 1.2 or drop below 0.8, so we need to renormalize
    // to prevent high boosts from disproportionately affecting ranking
    return Math.min(1.0, Math.max(0.0, finalScore));
  }

  /**
   * Get score breakdown for debugging
   */
  private getScoreBreakdown(
    track: Track,
    profile: UserTasteProfile,
  ): TrackScore['breakdown'] {
    return {
      genreMatch: this.calculateGenreMatch(track, profile),
      artistMatch: this.calculateArtistMatch(track, profile),
      moodMatch: this.calculateMoodMatch(track, profile),
      novelty: this.calculateNovelty(track, profile),
      timeRelevance: this.calculateTimeRelevance(profile),
    };
  }

  /**
   * Calculate genre match score
   */
  private calculateGenreMatch(track: Track, profile: UserTasteProfile): number {
    if (!track.genre || profile.topGenres.length === 0) {
      return 0.0;
    }

    const genreIndex = profile.topGenres.findIndex(
      (g) => g.toLowerCase() === track.genre?.toLowerCase(),
    );

    if (genreIndex === -1) {
      return 0.0;
    }

    // Top genre = 1.0, second = 0.8, third = 0.6
    if (genreIndex === 0) return 1.0;
    if (genreIndex === 1) return 0.8;
    return 0.6;
  }

  /**
   * Calculate artist match score
   */
  private calculateArtistMatch(track: Track, profile: UserTasteProfile): number {
    if (!track.artist || profile.topArtists.length === 0) {
      return 0.0;
    }

    const artistIndex = profile.topArtists.findIndex(
      (a) => a.toLowerCase() === track.artist.toLowerCase(),
    );

    if (artistIndex === -1) {
      return 0.0;
    }

    // Top artist = 1.0, others = 0.7
    return artistIndex === 0 ? 1.0 : 0.7;
  }

  /**
   * Calculate mood match score
   */
  private calculateMoodMatch(track: Track, profile: UserTasteProfile): number {
    if (!track.mood || profile.moodPreference.length === 0) {
      return 0.0;
    }

    return profile.moodPreference.includes(track.mood) ? 1.0 : 0.0;
  }

  /**
   * Calculate novelty score
   */
  private calculateNovelty(track: Track, profile: UserTasteProfile): number {
    // For now, assume all tracks are novel (user hasn't played them)
    // In future, can check play history to see if user has played this track
    let novelty = 1.0;

    // Adjust based on discovery rate
    // If user has high discovery rate, boost novelty
    // If user has low discovery rate, reduce novelty
    novelty = novelty * (0.5 + profile.discoveryRate * 0.5);

    // ⚠️ IMPORTANT: For discovery tracks, weight score lower initially
    // This prevents discovery tracks from dominating top positions
    // unless user has a high discoveryRate
    // Note: We can't easily detect if a track is "discovery" here,
    // but the discovery tracks are already filtered in buildCandidatePool
    // For now, we'll apply a general reduction based on discovery rate
    if (profile.discoveryRate < 0.5) {
      // User has low discovery rate, reduce novelty weight
      novelty = novelty * 0.7;
    }

    return Math.min(1.0, Math.max(0.0, novelty));
  }

  /**
   * Calculate time relevance boost
   */
  private calculateTimeRelevance(profile: UserTasteProfile): number {
    const currentHour = new Date().getHours();
    const timeOfDay = this.getTimeOfDay(currentHour);

    // Boost tracks if they match current time of day preference
    return profile.listeningTimeOfDay.includes(timeOfDay) ? 1.1 : 0.9;

    // 🚀 FUTURE ENHANCEMENT: Genre/Mood weighting by time of day
    // Example: Chill/Lo-fi tracks boosted in evening, upbeat in morning
    // if (timeOfDay === 'Evening' && track.genre === 'Lo-Fi') {
    //   timeRelevanceBoost *= 1.15; // Extra boost for evening lo-fi
    // }
    // if (timeOfDay === 'Morning' && track.mood === 'Energetic') {
    //   timeRelevanceBoost *= 1.15; // Extra boost for morning energy
    // }
  }

  /**
   * Get time of day from hour
   */
  private getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 22) return 'Evening';
    return 'Night';
  }

  /**
   * Get recent track IDs (to exclude from recommendations)
   */
  private async getRecentTrackIds(
    userId: string,
    days: number,
  ): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get history entries after cutoff date
    const recentHistory = await this.playHistoryRepository.findByUserId(userId, {
      startDate: cutoffDate,
      limit: 1000, // Get up to 1000 recent tracks
    });

    // Extract unique track IDs
    const trackIds = new Set<string>();
    recentHistory.forEach((entry) => {
      trackIds.add(entry.trackId);
    });

    return Array.from(trackIds);
  }

  /**
   * Deduplicate tracks by ID
   */
  private deduplicateTracks(tracks: Track[]): Track[] {
    const seen = new Set<string>();
    return tracks.filter((track) => {
      if (seen.has(track.id)) {
        return false;
      }
      seen.add(track.id);
      return true;
    });
  }

  /**
   * Shuffle top N tracks for variation
   */
  private shuffleTopTracks(tracks: Track[], topN: number): Track[] {
    if (tracks.length <= topN) {
      return [...tracks];
    }

    const topTracks = tracks.slice(0, topN);
    const restTracks = tracks.slice(topN);

    // Shuffle top N tracks
    for (let i = topTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topTracks[i], topTracks[j]] = [topTracks[j], topTracks[i]];
    }

    return [...topTracks, ...restTracks];
  }

  /**
   * Get fallback playlist (for cold start)
   */
  private async getFallbackPlaylist(
    userId: string,
    sessionLength: number,
  ): Promise<AudioraDJPlaylist> {
    // Get trending tracks from Audius
    const trendingTracks = await this.audiusService.getTrendingTracks(
      undefined,
      sessionLength,
    );

    return {
      userId,
      generatedAt: new Date(),
      tracks: trendingTracks,
      sessionLength: trendingTracks.length,
      vibeDescription: "Trending tracks to get you started", // Fallback description
      metadata: {
        avgCompletionRate: 0,
        topGenres: [],
        topArtists: [],
      },
    };
  }

  /**
   * Log track scoring for debugging
   */
  private logTrackScoring(
    track: Track,
    score: number,
    breakdown: TrackScore['breakdown'],
  ): void {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Track Scoring: ${track.title} by ${track.artist}`, {
        score,
        breakdown: {
          genreMatch: breakdown?.genreMatch,
          artistMatch: breakdown?.artistMatch,
          moodMatch: breakdown?.moodMatch,
          novelty: breakdown?.novelty,
          timeRelevance: breakdown?.timeRelevance,
        },
        track: {
          genre: track.genre,
          mood: track.mood,
          artist: track.artist,
        },
      });
    }
  }
}

