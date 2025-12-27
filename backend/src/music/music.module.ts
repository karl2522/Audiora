import { Module, OnModuleInit } from '@nestjs/common';
import { MusicController } from './music.controller';
import { PlayHistoryRepository } from './repositories/play-history.repository';
import { AudioraDJService } from './services/audiora-dj.service';
import { AudiusService } from './services/audius.service';
import { CacheService } from './services/cache.service';
import { HistoryService } from './services/history.service';
import { PlaylistService } from './services/playlist.service';
import { TrackService } from './services/track.service';

import { AIService } from './services/ai.service';

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
    AIService,
  ],
  exports: [TrackService, PlaylistService, HistoryService, AudioraDJService, AIService], // Export for AI module later
})
export class MusicModule implements OnModuleInit {
  constructor(private cacheService: CacheService) { }

  onModuleInit() {
    // Start automatic cache cleanup every 5 minutes
    this.cacheService.startCleanupInterval();
  }
}

