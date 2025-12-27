import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PlayHistory, Prisma } from '@prisma/client';

@Injectable()
export class PlayHistoryRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new play history entry
   */
  async create(data: {
    userId: string;
    trackId: string;
    trackTitle: string;
    trackArtist: string;
    trackGenre?: string;
    trackMood?: string;
    trackDuration: number;
    startedAt: Date;
  }): Promise<PlayHistory> {
    return this.prisma.playHistory.create({
      data: {
        userId: data.userId,
        trackId: data.trackId,
        trackTitle: data.trackTitle,
        trackArtist: data.trackArtist,
        trackGenre: data.trackGenre || null,
        trackMood: data.trackMood || null,
        trackDuration: data.trackDuration,
        startedAt: data.startedAt,
        durationPlayed: 0, // Default value
      },
    });
  }

  /**
   * Update play history entry (for completion, skip)
   * ❌ REMOVED: paused, pausedAt, resumedAt (not needed for AI)
   */
  async update(
    id: string,
    data: {
      durationPlayed?: number;
      completed?: boolean;
      skipped?: boolean;
      completedAt?: Date;
      skippedAt?: Date;
    },
  ): Promise<PlayHistory> {
    return this.prisma.playHistory.update({
      where: { id },
      data,
    });
  }

  /**
   * Find active play history entry (not completed/skipped)
   * Includes time-based invalidation to prevent zombie sessions
   */
  async findActive(
    userId: string,
    trackId: string,
  ): Promise<PlayHistory | null> {
    // Only consider sessions started within last 2 hours
    // Prevents treating old sessions as active when user returns
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    return this.prisma.playHistory.findFirst({
      where: {
        userId,
        trackId,
        completed: false,
        skipped: false,
        startedAt: {
          gt: twoHoursAgo, // Only active if started within 2 hours
        },
      },
      orderBy: {
        startedAt: 'desc', // Most recent first
      },
    });
  }

  /**
   * Get user's listening history
   */
  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<PlayHistory[]> {
    const where: Prisma.PlayHistoryWhereInput = {
      userId,
    };

    if (options?.startDate || options?.endDate) {
      where.startedAt = {};
      if (options.startDate) {
        where.startedAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.startedAt.lte = options.endDate;
      }
    }

    return this.prisma.playHistory.findMany({
      where,
      orderBy: {
        startedAt: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get total count of user's listening history
   */
  async countByUserId(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<number> {
    const where: Prisma.PlayHistoryWhereInput = {
      userId,
    };

    if (options?.startDate || options?.endDate) {
      where.startedAt = {};
      if (options.startDate) {
        where.startedAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.startedAt.lte = options.endDate;
      }
    }

    return this.prisma.playHistory.count({ where });
  }

  /**
   * Get play count for a track by user
   */
  async getPlayCount(userId: string, trackId: string): Promise<number> {
    return this.prisma.playHistory.count({
      where: {
        userId,
        trackId,
      },
    });
  }

  /**
   * Get total listening time for user
   */
  async getTotalListeningTime(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.PlayHistoryWhereInput = {
      userId,
    };

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt.gte = startDate;
      }
      if (endDate) {
        where.startedAt.lte = endDate;
      }
    }

    const result = await this.prisma.playHistory.aggregate({
      where,
      _sum: {
        durationPlayed: true,
      },
    });

    return result._sum.durationPlayed || 0;
  }

  /**
   * Get most played tracks for user
   */
  async getMostPlayedTracks(
    userId: string,
    limit: number = 10,
  ): Promise<Array<{ trackId: string; playCount: number }>> {
    const results = await this.prisma.playHistory.groupBy({
      by: ['trackId'],
      where: {
        userId,
      },
      _count: {
        trackId: true,
      },
      orderBy: {
        _count: {
          trackId: 'desc',
        },
      },
      take: limit,
    });

    return results.map((r) => ({
      trackId: r.trackId,
      playCount: r._count.trackId,
    }));
  }

  /**
   * Delete user's play history (privacy)
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.playHistory.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  /**
   * Delete specific play history entry
   */
  async deleteById(id: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.playHistory.delete({
        where: {
          id,
          userId, // Ensure user can only delete their own history
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all history for aggregation (for taste profile)
   */
  async findAllForUser(userId: string, limit: number = 1000): Promise<PlayHistory[]> {
    return this.prisma.playHistory.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}


