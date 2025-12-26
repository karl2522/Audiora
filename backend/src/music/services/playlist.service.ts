import { Injectable } from '@nestjs/common';
import { TrackService } from './track.service';
import { Playlist, Track } from '../interfaces/audius.interface';
import { randomUUID } from 'crypto';

/**
 * Playlist Service - AI-Ready
 * This service will handle playlist generation and management
 * Currently provides basic functionality, ready for AI integration
 */
@Injectable()
export class PlaylistService {
  // In-memory playlists (can be moved to database later)
  private playlists: Map<string, Playlist> = new Map();

  constructor(private trackService: TrackService) {}

  /**
   * Create a playlist
   */
  async createPlaylist(
    name: string,
    trackIds: string[],
    userId?: string,
    aiGenerated = false,
  ): Promise<Playlist> {
    const tracks = await this.trackService.getTracksByIds(trackIds);
    
    const playlist: Playlist = {
      id: randomUUID(),
      name,
      tracks,
      userId,
      aiGenerated,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.playlists.set(playlist.id, playlist);
    return playlist;
  }

  /**
   * Get playlist by ID
   */
  async getPlaylistById(playlistId: string): Promise<Playlist | null> {
    return this.playlists.get(playlistId) || null;
  }

  /**
   * Get user playlists
   */
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(
      (p) => p.userId === userId,
    );
  }

  /**
   * Generate playlist from track IDs (placeholder for AI)
   * This method will be extended with AI logic later
   */
  async generatePlaylist(
    trackIds: string[],
    userId?: string,
  ): Promise<Playlist> {
    // For now, just create a playlist from the provided tracks
    // Later: AI will generate recommendations based on these tracks
    return this.createPlaylist(
      'Generated Playlist',
      trackIds,
      userId,
      true, // AI generated
    );
  }

  /**
   * Add tracks to playlist
   */
  async addTracksToPlaylist(
    playlistId: string,
    trackIds: string[],
  ): Promise<Playlist | null> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) {
      return null;
    }

    const newTracks = await this.trackService.getTracksByIds(trackIds);
    playlist.tracks.push(...newTracks);
    playlist.updatedAt = new Date();

    return playlist;
  }
}

