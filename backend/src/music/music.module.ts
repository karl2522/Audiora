import { Module, OnModuleInit } from '@nestjs/common';
import { MusicController } from './music.controller';
import { TrackService } from './services/track.service';
import { AudiusService } from './services/audius.service';
import { PlaylistService } from './services/playlist.service';
import { CacheService } from './services/cache.service';
import { HistoryService } from './services/history.service';
import { AudioraDJService } from './services/audiora-dj.service';
import { PlayHistoryRepository } from './repositories/play-history.repository';

@Module({
  controllers: [MusicController],
  providers: [
    TrackService,
    AudiusService,
    PlaylistService,
    CacheService,
    HistoryService,
    AudioraDJService,
    PlayHistoryRepository,
  ],
  exports: [TrackService, PlaylistService, HistoryService, AudioraDJService], // Export for AI module later
})
export class MusicModule implements OnModuleInit {
  constructor(private cacheService: CacheService) {}

  onModuleInit() {
    // Start automatic cache cleanup every 5 minutes
    this.cacheService.startCleanupInterval();
  }
}

