import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

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

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token: hashedToken,
      expiresAt,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Find refresh token by hashed token value
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const hashedToken = this.hashToken(token);
    return this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
      relations: ['user'],
    });
  }

  /**
   * Revoke a refresh token
   */
  async revoke(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.refreshTokenRepository.update(
      { token: hashedToken },
      { revokedAt: new Date() },
    );
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('revokedAt IS NULL')
      .execute();
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.refreshTokenRepository.update(
      { token: hashedToken },
      { lastUsedAt: new Date() },
    );
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  /**
   * Delete old revoked tokens (older than 30 days)
   */
  async cleanupOldRevokedTokens(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.refreshTokenRepository.delete({
      revokedAt: LessThan(thirtyDaysAgo),
    });
    return result.affected || 0;
  }
}

