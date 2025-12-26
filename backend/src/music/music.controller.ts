import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TrackService } from './services/track.service';
import { PlaylistService } from './services/playlist.service';
import { SearchTracksDto, GetTrackDto, GetTrendingDto } from './dto/track.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Track } from './interfaces/audius.interface';

@Controller('music')
export class MusicController {
  constructor(
    private trackService: TrackService,
    private playlistService: PlaylistService,
  ) {}

  /**
   * Search tracks
   */
  @Public()
  @Throttle({ default: { limit: 2000, ttl: 60000 } }) // 2000 searches per minute
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchTracks(@Query() query: SearchTracksDto): Promise<{
    tracks: Track[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const tracks = await this.trackService.searchTracks(
        query.query,
        query.limit || 20,
        query.offset || 0,
      );

      return {
        tracks,
        total: tracks.length,
        limit: query.limit || 20,
        offset: query.offset || 0,
      };
    } catch (error: any) {
      // Log the actual error for debugging
      console.error('Search tracks error:', error);
      
      // If it's already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to search tracks',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get trending tracks
   */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
  @Get('trending')
  @HttpCode(HttpStatus.OK)
  async getTrendingTracks(@Query() query: GetTrendingDto): Promise<{
    tracks: Track[];
  }> {
    try {
      const tracks = await this.trackService.getTrendingTracks(
        query.genre,
        query.limit,
      );

      return { tracks };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch trending tracks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get track by ID
   */
  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute
  @Get('track/:id')
  @HttpCode(HttpStatus.OK)
  async getTrack(@Param() params: GetTrackDto): Promise<{ track: Track }> {
    try {
      const track = await this.trackService.getTrackById(params.id);

      if (!track) {
        throw new HttpException('Track not found', HttpStatus.NOT_FOUND);
      }

      return { track };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch track',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get stream URL for a track
   */
  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @Get('track/:id/stream')
  @HttpCode(HttpStatus.OK)
  async getStreamUrl(@Param() params: GetTrackDto): Promise<{
    streamUrl: string;
  }> {
    try {
      const streamUrl = await this.trackService.getStreamUrl(params.id);
      return { streamUrl };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get stream URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get playlist by ID (AI-Ready)
   */
  @Public()
  @Get('playlist/:id')
  @HttpCode(HttpStatus.OK)
  async getPlaylist(@Param('id') id: string) {
    const playlist = await this.playlistService.getPlaylistById(id);
    if (!playlist) {
      throw new HttpException('Playlist not found', HttpStatus.NOT_FOUND);
    }
    return { playlist };
  }
}

