import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RefreshToken, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Hash a refresh token before storing
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new refresh token record
   */
  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const hashedToken = this.hashToken(token);

    return this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });
  }

  /**
   * Find refresh token by hashed token value
   */
  async findByToken(token: string): Promise<(RefreshToken & { user: { id: string; email: string; name: string | null; picture: string | null } }) | null> {
    const hashedToken = this.hashToken(token);
    return this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
          },
        },
      },
    });
  }

  /**
   * Revoke a refresh token
   */
  async revoke(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Delete old revoked tokens (older than 30 days)
   */
  async cleanupOldRevokedTokens(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        revokedAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
      },
    });
    return result.count;
  }
}
