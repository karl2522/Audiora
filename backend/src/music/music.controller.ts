import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TrackService } from './services/track.service';
import { PlaylistService } from './services/playlist.service';
import { HistoryService } from './services/history.service';
import { AudioraDJService } from './services/audiora-dj.service';
import { SearchTracksDto, GetTrackDto, GetTrendingDto } from './dto/track.dto';
import {
  LogTrackStartDto,
  LogTrackCompleteDto,
  LogTrackSkipDto,
  GetHistoryDto,
} from './dto/history.dto';
import { AudioraDJPlaylist } from './dto/dj.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { Track } from './interfaces/audius.interface';

@Controller('music')
export class MusicController {
  private readonly logger = new Logger(MusicController.name);

  constructor(
    private trackService: TrackService,
    private playlistService: PlaylistService,
    private historyService: HistoryService,
    private audioraDJService: AudioraDJService,
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

      // Debug: Log first track duration before sending to frontend
      if (tracks.length > 0) {
        const firstTrack = tracks[0];
        this.logger.log(`[DEBUG] Sending track to frontend: ${firstTrack.title}`);
        this.logger.log(`[DEBUG] Track duration: ${firstTrack.duration}s`);
      }

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

  /**
   * Listening History Endpoints
   */

  /**
   * Log track start event
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute per user
  @Post('history/start')
  @HttpCode(HttpStatus.OK)
  async logTrackStart(
    @CurrentUser() user: UserPayload,
    @Body() dto: LogTrackStartDto,
  ) {
    try {
      const history = await this.historyService.logTrackStart(
        user.sub,
        dto.trackId,
        {
          title: dto.trackTitle,
          artist: dto.trackArtist,
          genre: dto.trackGenre,
          mood: dto.trackMood,
          duration: dto.trackDuration,
        },
      );
      return {
        success: true,
        historyId: history.id,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to log track start',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Log track completion
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('history/complete')
  @HttpCode(HttpStatus.OK)
  async logTrackComplete(
    @CurrentUser() user: UserPayload,
    @Body() dto: LogTrackCompleteDto,
  ) {
    try {
      await this.historyService.logTrackComplete(
        user.sub,
        dto.trackId,
        dto.durationPlayed,
      );
      return { success: true };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to log track completion',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Log track skip
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('history/skip')
  @HttpCode(HttpStatus.OK)
  async logTrackSkip(
    @CurrentUser() user: UserPayload,
    @Body() dto: LogTrackSkipDto,
  ) {
    try {
      await this.historyService.logTrackSkip(
        user.sub,
        dto.trackId,
        dto.durationPlayed,
      );
      return { success: true };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to log track skip',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's listening history
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute per user
  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getHistory(
    @CurrentUser() user: UserPayload,
    @Query() query: GetHistoryDto,
  ) {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      return await this.historyService.getUserHistory(user.sub, {
        limit: query.limit,
        offset: query.offset,
        startDate,
        endDate,
      });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch listening history',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get AI-ready user taste profile
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute per user
  @Get('history/taste-profile')
  @HttpCode(HttpStatus.OK)
  async getTasteProfile(@CurrentUser() user: UserPayload) {
    try {
      return await this.historyService.buildUserTasteProfile(user.sub);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to build taste profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's listening statistics
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute per user
  @Get('history/stats')
  @HttpCode(HttpStatus.OK)
  async getStats(@CurrentUser() user: UserPayload) {
    try {
      return await this.historyService.getUserStats(user.sub);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch listening stats',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete specific play history entry
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Delete('history/:id')
  @HttpCode(HttpStatus.OK)
  async deleteHistoryEntry(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    try {
      const deleted = await this.historyService
        .getRepository()
        .deleteById(id, user.sub);
      if (!deleted) {
        throw new HttpException('History entry not found', HttpStatus.NOT_FOUND);
      }
      return { success: true };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete history entry',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete all user's play history
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Delete('history')
  @HttpCode(HttpStatus.OK)
  async deleteAllHistory(@CurrentUser() user: UserPayload) {
    try {
      const deletedCount = await this.historyService
        .getRepository()
        .deleteByUserId(user.sub);
      return {
        success: true,
        deletedCount,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to delete history',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get Audiora DJ personalized playlist
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Get('dj/audiora')
  @HttpCode(HttpStatus.OK)
  async getAudioraDJPlaylist(
    @CurrentUser() user: UserPayload,
    @Query('sessionLength') sessionLength?: number,
    @Query('maxLength') maxLength?: number,
  ): Promise<AudioraDJPlaylist> {
    try {
      const validatedSessionLength = sessionLength
        ? parseInt(sessionLength.toString(), 10)
        : undefined;
      const validatedMaxLength = maxLength
        ? parseInt(maxLength.toString(), 10)
        : 50; // Default max 50 tracks

      const playlist = await this.audioraDJService.generatePlaylist(
        user.sub,
        validatedSessionLength,
        validatedMaxLength,
      );

      // Log playlist generation for analytics
      this.logger.log(
        `Generated Audiora DJ playlist for user ${user.sub}: ${playlist.tracks.length} tracks`,
      );

      return playlist;
    } catch (error: any) {
      this.logger.error(
        `Error generating Audiora DJ playlist: ${error.message}`,
      );
      throw new HttpException(
        error.message || 'Failed to generate playlist',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

