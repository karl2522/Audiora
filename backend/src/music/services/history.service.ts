import { Injectable, Logger } from '@nestjs/common';
import { PlayHistoryRepository } from '../repositories/play-history.repository';
import { PlayHistory } from '@prisma/client';
import { UserTasteProfile } from '../dto/history.dto';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private playHistoryRepository: PlayHistoryRepository) {}

  /**
   * Get repository (for controller access to delete methods)
   */
  getRepository(): PlayHistoryRepository {
    return this.playHistoryRepository;
  }

  /**
   * Log track start event
   * Normalizes genre and mood for AI consistency
   */
  async logTrackStart(
    userId: string,
    trackId: string,
    trackData: {
      title: string;
      artist: string;
      genre?: string;
      mood?: string;
      duration: number;
    },
  ): Promise<PlayHistory> {
    // Normalize genre and mood for AI consistency
    const normalizedGenre = trackData.genre
      ? this.normalizeGenre(trackData.genre)
      : undefined;
    const normalizedMood = trackData.mood
      ? this.normalizeMood(trackData.mood)
      : undefined;

    // Check for active session (with time-based invalidation)
    // ⚠️ IMPORTANT: Only checks same track (userId + trackId)
    // Cross-track transitions are handled by frontend (frontend skips previous track)
    // Backend only resolves same-track duplicate actives
    const active = await this.playHistoryRepository.findActive(userId, trackId);

    if (active) {
      // Mark previous session as skipped if incomplete
      // This handles: User plays Track A → User plays Track A again (same track duplicate)
      await this.playHistoryRepository.update(active.id, {
        skipped: true,
        skippedAt: new Date(),
        durationPlayed: active.durationPlayed, // Keep existing duration
      });
    }

    // Note: If user plays Track A → Track B, frontend handles skipping Track A
    // Backend does NOT auto-skip cross-track transitions

    // Create new entry with normalized data
    return this.playHistoryRepository.create({
      userId,
      trackId,
      trackTitle: trackData.title,
      trackArtist: trackData.artist,
      trackGenre: normalizedGenre,
      trackMood: normalizedMood,
      trackDuration: trackData.duration,
      startedAt: new Date(),
    });
  }

  /**
   * Log track completion (finished naturally)
   */
  async logTrackComplete(
    userId: string,
    trackId: string,
    durationPlayed: number,
  ): Promise<void> {
    const active = await this.playHistoryRepository.findActive(userId, trackId);
    if (active) {
      await this.playHistoryRepository.update(active.id, {
        completed: true,
        completedAt: new Date(),
        durationPlayed,
      });
    }
  }

  /**
   * Log track skip
   */
  async logTrackSkip(
    userId: string,
    trackId: string,
    durationPlayed: number,
  ): Promise<void> {
    const active = await this.playHistoryRepository.findActive(userId, trackId);
    if (active) {
      await this.playHistoryRepository.update(active.id, {
        skipped: true,
        skippedAt: new Date(),
        durationPlayed,
      });
    }
  }

  /**
   * Get user's listening history
   */
  async getUserHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{
    history: PlayHistory[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const history = await this.playHistoryRepository.findByUserId(userId, options);
    const total = await this.playHistoryRepository.countByUserId(userId, options);

    return {
      history,
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  /**
   * Get listening statistics for user
   */
  async getUserStats(userId: string): Promise<{
    totalTracksPlayed: number;
    totalListeningTime: number; // seconds
    mostPlayedTracks: Array<{ trackId: string; playCount: number }>;
    favoriteGenres: Array<{ genre: string; playCount: number }>;
  }> {
    const history = await this.playHistoryRepository.findAllForUser(userId);
    const totalListeningTime =
      await this.playHistoryRepository.getTotalListeningTime(userId);
    const mostPlayedTracks =
      await this.playHistoryRepository.getMostPlayedTracks(userId, 10);

    // Calculate favorite genres
    const genreCounts = new Map<string, number>();
    history.forEach((entry) => {
      if (entry.trackGenre) {
        genreCounts.set(
          entry.trackGenre,
          (genreCounts.get(entry.trackGenre) || 0) + 1,
        );
      }
    });

    const favoriteGenres = Array.from(genreCounts.entries())
      .map(([genre, playCount]) => ({ genre, playCount }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);

    return {
      totalTracksPlayed: history.length,
      totalListeningTime,
      mostPlayedTracks,
      favoriteGenres,
    };
  }

  /**
   * Build AI-ready user taste profile (CRITICAL)
   * Computed on-demand, not stored permanently
   * This is what gets sent to LLM, NOT raw play history rows
   *
   * Architecture:
   * DB (PlayHistory) → Aggregate/Summarize → UserTasteProfile → Prompt LLM → Get ranked track IDs → Fetch from Audius
   */
  async buildUserTasteProfile(userId: string): Promise<UserTasteProfile> {
    // Aggregate raw play history into AI-ready summary
    // DO NOT feed raw rows to LLM

    const history = await this.playHistoryRepository.findAllForUser(userId, 1000);

    // Cold start guard: Need minimum data for meaningful profile
    if (history.length < 5) {
      return {
        topGenres: [],
        topArtists: [],
        avgTrackCompletionRate: 0,
        skipHeavyGenres: [],
        listeningTimeOfDay: [],
        moodPreference: [],
        discoveryRate: 1, // Assume high discovery rate for new users
      };
    }

    // Calculate top genres (by play count, weighted by completion rate)
    const genreStats = this.calculateGenreStats(history);

    // Calculate top artists (by play count, weighted by completion rate)
    const artistStats = this.calculateArtistStats(history);

    // Calculate average completion rate
    const avgCompletionRate = this.calculateAvgCompletionRate(history);

    // Identify skip-heavy genres
    const skipHeavyGenres = this.identifySkipHeavyGenres(history);

    // Analyze listening time patterns
    const listeningTimeOfDay = this.analyzeListeningTimePatterns(history);

    // Extract mood preferences
    const moodPreference = this.extractMoodPreferences(history);

    // Calculate discovery rate (new tracks vs repeats)
    const discoveryRate = this.calculateDiscoveryRate(history);

    return {
      topGenres: genreStats.slice(0, 5).map((g) => g.genre),
      topArtists: artistStats.slice(0, 5).map((a) => a.artist),
      avgTrackCompletionRate: avgCompletionRate,
      skipHeavyGenres: skipHeavyGenres,
      listeningTimeOfDay: listeningTimeOfDay,
      moodPreference: moodPreference,
      discoveryRate: discoveryRate,
    };
  }

  /**
   * Normalize genre for AI consistency
   * Handles variations like "hip hop" → "Hip-Hop"
   */
  private normalizeGenre(genre: string): string {
    if (!genre) return '';

    const normalized = genre.trim().toLowerCase();

    // Common genre mappings
    const genreMap: Record<string, string> = {
      'hip hop': 'Hip-Hop',
      'hip-hop': 'Hip-Hop',
      hiphop: 'Hip-Hop',
      'r&b': 'R&B',
      rnb: 'R&B',
      electronic: 'Electronic',
      edm: 'Electronic',
      'electronic dance music': 'Electronic',
      'lo-fi': 'Lo-Fi',
      lofi: 'Lo-Fi',
      'lo fi': 'Lo-Fi',
      indie: 'Indie',
      'indie rock': 'Indie',
      rock: 'Rock',
      pop: 'Pop',
      jazz: 'Jazz',
      classical: 'Classical',
      country: 'Country',
      folk: 'Folk',
      reggae: 'Reggae',
      blues: 'Blues',
      metal: 'Metal',
      punk: 'Punk',
      alternative: 'Alternative',
    };

    return genreMap[normalized] || this.capitalizeFirst(genre);
  }

  /**
   * Normalize mood for AI consistency
   */
  private normalizeMood(mood: string): string {
    if (!mood) return '';

    const normalized = mood.trim().toLowerCase();

    // Common mood mappings
    const moodMap: Record<string, string> = {
      chill: 'Chill',
      'chill vibes': 'Chill',
      chillout: 'Chill',
      relaxed: 'Chill',
      sad: 'Sad',
      melancholic: 'Sad',
      melancholy: 'Sad',
      happy: 'Happy',
      upbeat: 'Happy',
      energetic: 'Energetic',
      energizing: 'Energetic',
      calm: 'Calm',
      peaceful: 'Calm',
      romantic: 'Romantic',
      love: 'Romantic',
      aggressive: 'Aggressive',
      intense: 'Aggressive',
      dreamy: 'Dreamy',
      atmospheric: 'Dreamy',
    };

    return moodMap[normalized] || this.capitalizeFirst(mood);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private calculateGenreStats(
    history: PlayHistory[],
  ): Array<{ genre: string; score: number }> {
    // Weight by completion rate: completed tracks count more than skipped
    const genreMap = new Map<
      string,
      { plays: number; completed: number }
    >();

    history.forEach((entry) => {
      if (!entry.trackGenre) return;

      const stats = genreMap.get(entry.trackGenre) || {
        plays: 0,
        completed: 0,
      };
      stats.plays++;
      if (entry.completed) stats.completed++;
      genreMap.set(entry.trackGenre, stats);
    });

    return Array.from(genreMap.entries())
      .map(([genre, stats]) => ({
        genre,
        score: stats.completed * 2 + stats.plays, // Completed tracks weighted 2x
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateArtistStats(
    history: PlayHistory[],
  ): Array<{ artist: string; score: number }> {
    const artistMap = new Map<
      string,
      { plays: number; completed: number }
    >();

    history.forEach((entry) => {
      const stats = artistMap.get(entry.trackArtist) || {
        plays: 0,
        completed: 0,
      };
      stats.plays++;
      if (entry.completed) stats.completed++;
      artistMap.set(entry.trackArtist, stats);
    });

    return Array.from(artistMap.entries())
      .map(([artist, stats]) => ({
        artist,
        score: stats.completed * 2 + stats.plays,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateAvgCompletionRate(history: PlayHistory[]): number {
    if (history.length === 0) return 0;

    const completed = history.filter((h) => h.completed).length;
    return completed / history.length;
  }

  private identifySkipHeavyGenres(history: PlayHistory[]): string[] {
    const genreSkipRate = new Map<
      string,
      { total: number; skipped: number }
    >();

    history.forEach((entry) => {
      if (!entry.trackGenre) return;

      const stats = genreSkipRate.get(entry.trackGenre) || {
        total: 0,
        skipped: 0,
      };
      stats.total++;
      if (entry.skipped) stats.skipped++;
      genreSkipRate.set(entry.trackGenre, stats);
    });

    return Array.from(genreSkipRate.entries())
      .filter(([_, stats]) => stats.total >= 3) // At least 3 plays
      .filter(([_, stats]) => stats.skipped / stats.total > 0.5) // Skip rate > 50%
      .map(([genre]) => genre);
  }

  private analyzeListeningTimePatterns(history: PlayHistory[]): string[] {
    const timeSlots = {
      Morning: 0, // 6-12
      Afternoon: 0, // 12-18
      Evening: 0, // 18-22
      Night: 0, // 22-6
    };

    history.forEach((entry) => {
      const hour = new Date(entry.startedAt).getHours();
      if (hour >= 6 && hour < 12) timeSlots.Morning++;
      else if (hour >= 12 && hour < 18) timeSlots.Afternoon++;
      else if (hour >= 18 && hour < 22) timeSlots.Evening++;
      else timeSlots.Night++;
    });

    return Object.entries(timeSlots)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([slot]) => slot);
  }

  private extractMoodPreferences(history: PlayHistory[]): string[] {
    const moodCounts = new Map<string, number>();

    history.forEach((entry) => {
      if (!entry.trackMood) return;
      moodCounts.set(entry.trackMood, (moodCounts.get(entry.trackMood) || 0) + 1);
    });

    return Array.from(moodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood]) => mood);
  }

  private calculateDiscoveryRate(history: PlayHistory[]): number {
    if (history.length === 0) return 0;

    // Filter out accidental taps (played < 30 seconds)
    // ⚠️ THRESHOLD CONSISTENCY: >= 30s OR completed
    // Completion threshold: currentTime >= duration - 1 (frontend)
    // Discovery threshold: durationPlayed >= 30s OR completed (backend)
    // Both use same logic: meaningful play = >= 30s OR completed
    const meaningfulPlays = history.filter(
      (h) => h.durationPlayed >= 30 || h.completed,
    );

    if (meaningfulPlays.length === 0) return 1; // All were accidental

    const uniqueTracks = new Set(meaningfulPlays.map((h) => h.trackId));
    const discoveryRate = uniqueTracks.size / meaningfulPlays.length;

    // Cap to [0, 1]
    return Math.max(0, Math.min(1, discoveryRate));
  }
}

