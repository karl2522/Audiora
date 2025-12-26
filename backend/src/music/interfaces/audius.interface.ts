/**
 * Audius API Response Interfaces
 */

export interface AudiusTrack {
  id: string;
  title: string;
  description?: string;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  duration: number;
  play_count: number;
  favorite_count: number;
  repost_count: number;
  genre?: string;
  mood?: string;
  tags?: string;
  created_at: string;
  release_date?: string;
  track_segments?: any[];
  user: AudiusUser;
  permalink?: string;
  is_streamable?: boolean;
  stream_url?: string;
}

export interface AudiusUser {
  id: string;
  handle: string;
  name: string;
  bio?: string;
  location?: string;
  profile_picture?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  cover_photo?: {
    '640x'?: string;
    '2000x'?: string;
  };
  follower_count: number;
  following_count: number;
  track_count: number;
  playlist_count: number;
  verified?: boolean;
}

export interface AudiusSearchResponse {
  data: AudiusTrack[];
}

export interface AudiusTrendingResponse {
  data: AudiusTrack[];
}

export interface AudiusTrackResponse {
  data: AudiusTrack[];
}

/**
 * Normalized Track Interface (for our application)
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artwork?: string;
  streamUrl: string;
  duration: number; // in seconds
  genre?: string;
  playCount?: number;
  favoriteCount?: number;
  createdAt?: string;
  description?: string;
  tags?: string[];
}

/**
 * Playlist Interface (AI-Ready)
 */
export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  userId?: string;
  aiGenerated?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

