import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type * as jwt from 'jsonwebtoken';
import { TokenPayload, UserPayload } from '../interfaces/user.interface';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(user: UserPayload): string {
    const payload: TokenPayload = {
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') || '15m';
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(user: UserPayload): string {
    const payload: TokenPayload = {
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) || '7d';
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }
      return this.jwtService.verify<TokenPayload>(token, {
        secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }
      return this.jwtService.verify<TokenPayload>(token, {
        secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

