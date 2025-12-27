import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LogTrackStartDto {
  @IsString()
  trackId: string;

  @IsString()
  trackTitle: string;

  @IsString()
  trackArtist: string;

  @IsOptional()
  @IsString()
  trackGenre?: string; // Single primary genre (will be normalized)

  @IsOptional()
  @IsString()
  trackMood?: string; // Single primary mood (will be normalized)

  @IsInt()
  @Min(1)
  trackDuration: number;
}

export class LogTrackCompleteDto {
  @IsString()
  trackId: string;

  @IsNumber()
  @Min(0)
  durationPlayed: number;
}

export class LogTrackSkipDto {
  @IsString()
  trackId: string;

  @IsNumber()
  @Min(0)
  durationPlayed: number;
}

// ❌ REMOVED: LogTrackProgressDto
// Progress tracked in memory (frontend), final durationPlayed sent on complete/skip

// ❌ REMOVED: LogTrackPauseDto and LogTrackResumeDto
// Pause/resume is UI analytics, not taste analytics
// Rule: If it's removed conceptually, remove it physically

export interface UserTasteProfile {
  topGenres: string[];
  topArtists: string[];
  avgTrackCompletionRate: number; // 0.0 to 1.0
  skipHeavyGenres: string[];
  listeningTimeOfDay: string[]; // ["Night", "Late Evening", etc.]
  moodPreference: string[];
  discoveryRate: number; // 0.0 to 1.0 (new tracks vs repeats)
}

export class GetHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}


