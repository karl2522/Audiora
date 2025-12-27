import { Track } from '../interfaces/audius.interface';

/**
 * Audiora DJ Playlist Response
 */
export interface AudioraDJPlaylist {
  userId: string;
  generatedAt: Date;
  tracks: Track[];
  sessionLength: number;
  seedTracks?: string[];
  vibeDescription?: string;
  metadata?: {
    avgCompletionRate: number;
    topGenres: string[];
    topArtists: string[];
  };
}

/**
 * Track Score (Internal)
 */
export interface TrackScore {
  track: Track;
  score: number;
  breakdown?: {
    genreMatch: number;
    artistMatch: number;
    moodMatch: number;
    novelty: number;
    timeRelevance: number;
  };
}

/**
 * Candidate Pool Options
 */
export interface CandidatePoolOptions {
  maxCandidates?: number; // Default: 500
  includeDiscovery?: boolean; // Default: true
  discoveryPercentage?: number; // Default: 0.2 (20%)
  excludeRecentDays?: number; // Default: 7 (exclude tracks played in last 7 days)
}


