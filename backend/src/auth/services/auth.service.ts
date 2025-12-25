import { Injectable } from '@nestjs/common';
import { GoogleUser, UserPayload } from '../interfaces/user.interface';
import { TokenService } from './token.service';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private userRepository: UserRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private configService: ConfigService,
  ) {}

  /**
   * Validate user from Google OAuth and save/update in database
   */
  async validateGoogleUser(googleUser: GoogleUser): Promise<UserPayload> {
    const user = await this.userRepository.createOrUpdate(googleUser);
    
    return {
      sub: user.id,
      email: user.email,
      name: user.name || undefined,
      picture: user.picture || undefined,
    };
  }

  /**
   * Generate tokens for authenticated user
   */
  async login(user: UserPayload) {
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    // Calculate expiration date for refresh token
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresInDays = refreshExpiresIn.includes('d')
      ? parseInt(refreshExpiresIn.replace('d', ''), 10)
      : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store refresh token in database
    await this.refreshTokenRepository.create(user.sub, refreshToken, expiresAt);

    // Update user's last login
    await this.userRepository.updateLastLogin(user.sub);

    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    
    // Verify refresh token exists and is valid in database
    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    
    if (!tokenRecord) {
      throw new Error('Invalid or revoked refresh token');
    }

    // Check if token is expired or revoked
    const isExpired = new Date() > tokenRecord.expiresAt;
    const isRevoked = tokenRecord.revokedAt !== null;

    if (isExpired || isRevoked) {
      throw new Error('Invalid or revoked refresh token');
    }

    // Get user from database
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }

    const userPayload: UserPayload = {
      sub: user.id,
      email: user.email,
      name: user.name || undefined,
      picture: user.picture || undefined,
    };

    // Update last used timestamp
    await this.refreshTokenRepository.updateLastUsed(refreshToken);

    // Generate new access token
    const accessToken = this.tokenService.generateAccessToken(userPayload);

    // Rotate refresh token (security best practice)
    // Revoke old token
    await this.refreshTokenRepository.revoke(refreshToken);

    // Generate new refresh token
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresInDays = refreshExpiresIn.includes('d')
      ? parseInt(refreshExpiresIn.replace('d', ''), 10)
      : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const newRefreshToken = this.tokenService.generateRefreshToken(userPayload);
    await this.refreshTokenRepository.create(
      user.id,
      newRefreshToken,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.revoke(refreshToken);
  }

  /**
   * Logout from all devices - revoke all refresh tokens for a user
   */
  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId);
  }
}

